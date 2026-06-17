import './SpectacleReports.scss';
import { useEffect, useState } from 'react';
import EmptyState from '../../../../components/emptyState/EmptyState';
import { getApiErrorMessage } from '../../../../api/client';
import { scheduleApi } from '../../../../api/scheduleApi';
import { spectaclesApi } from '../../../../api/spectaclesApi';
import type { Sale, ScheduleItem } from '../../../../api/types';
import { notifyError } from '../../../../utils/toast';
import { generateSpectacleReportPDF } from '../../../../utils/generateSpectacleReportPDF';
import type { SpectacleReportData } from '../../../../utils/generateSpectacleReportPDF';

interface SpectacleReportsProps {
  sales: Sale[];
}

const SpectacleReports: React.FC<SpectacleReportsProps> = ({ sales }) => {
  const getCurrentDate = (): string => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const parts = time.split(':');
    return parts.slice(0, 2).join(':');
  };

  const [selectedDate, setDateFrom] = useState<string>(getCurrentDate());
  const [dateTo, setDateTo] = useState<string>(getCurrentDate());
  const [spectaclesList, setSpectaclesList] = useState<string[]>([]);
  const [selectedSpectacle, setSelectedSpectacle] = useState<string>('toate spectacolele');
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>([]);
  const [metadataLoading, setMetadataLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadMetadata = async () => {
      setMetadataLoading(true);

      try {
        const [scheduleData, spectaclesData] = await Promise.all([
          scheduleApi.getAll(),
          spectaclesApi.getAll(),
        ]);

        setScheduleList(scheduleData);
        setSpectaclesList([
          'Toate Spectacolele',
          ...Array.from(new Set(spectaclesData.map((item) => item.title))),
        ]);
      } catch (error) {
        notifyError(getApiErrorMessage(error, 'Eroare la încărcarea datelor pentru raport'));
      } finally {
        setMetadataLoading(false);
      }
    };
    loadMetadata();
  }, []);

  const filteredSales = sales.filter((sale) => {
    const schedule = scheduleList.find((id) => id.id === sale.schedule_id);

    if (!schedule) return false;

    if (selectedSpectacle === 'toate spectacolele') {
      return schedule.date >= selectedDate && schedule.date <= dateTo;
    }

    return (
      schedule.title.toLowerCase() === selectedSpectacle.toLowerCase() &&
      schedule.date >= selectedDate &&
      schedule.date <= dateTo
    );
  });

  const groupedByDateAndTitle = filteredSales.reduce<
    Record<
      string,
      {
        id: string;
        date: string;
        time?: string;
        title: string;
        card_method: number;
        card_sum: number;
        cash_method: number;
        cash_sum: number;
        total_tickets: number;
        total_sum: number;
      }
    >
  >((acc, sale) => {
    const spectacle = scheduleList.find((presentation) => presentation.id === sale.schedule_id);
    if (!spectacle) return acc;

    const key = spectacle.id;

    if (!acc[key]) {
      acc[key] = {
        id: spectacle.id,
        date: spectacle.date,
        time: spectacle.time,
        title: spectacle.title,
        card_method: 0,
        card_sum: 0,
        cash_method: 0,
        cash_sum: 0,
        total_tickets: 0,
        total_sum: 0,
      };
    }

    acc[key].card_method += sale.payment_method === 'card' ? sale.quantity : 0;
    acc[key].card_sum += sale.payment_method === 'card' ? sale.total_sum : 0;
    acc[key].cash_method += sale.payment_method === 'cash' ? sale.quantity : 0;
    acc[key].cash_sum += sale.payment_method === 'cash' ? sale.total_sum : 0;
    acc[key].total_tickets += sale.quantity;
    acc[key].total_sum += sale.total_sum;

    return acc;
  }, {});

  const sortedEntries = Object.values(groupedByDateAndTitle).sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    if ((a.time || '') < (b.time || '')) return -1;
    if ((a.time || '') > (b.time || '')) return 1;
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  });

  const spectacleTitle = Array.from(new Set(filteredSales.map((item) => item.title))).join('');

  const cashMethod = filteredSales.filter((item) => item.payment_method === 'cash');
  const cardMethod = filteredSales.filter((item) => item.payment_method === 'card');

  const totalCashTickets = cashMethod.reduce((sum, s) => sum + s.quantity, 0);
  const totalCardTickets = cardMethod.reduce((sum, s) => sum + s.quantity, 0);
  const totalCashSum = cashMethod.reduce((sum, s) => sum + s.total_sum, 0);
  const totalCardSum = cardMethod.reduce((sum, s) => sum + s.total_sum, 0);
  const totalSum = filteredSales.reduce((sum, s) => sum + s.total_sum, 0);
  const totalTickets = filteredSales.reduce((sum, s) => sum + s.quantity, 0);

  const handleDownloadPDF = () => {
    const sortedGroupedData = Object.values(groupedByDateAndTitle)
      .sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : a.title < b.title ? -1 : a.title > b.title ? 1 : 0
      )
      .map((data) => ({ ...data }));

    const data: SpectacleReportData = {
      selectedDate,
      dateTo,
      spectacleTitle,
      totalCashTickets,
      totalCardTickets,
      filteredSales,
      totalCashSum,
      totalCardSum,
      totalSum,
      groupedData: sortedGroupedData,
    };
    generateSpectacleReportPDF(data);
  };

  const formatDisplayDate = (value: string) => value.split('-').reverse().join('-');
  const periodLabel = `${formatDisplayDate(selectedDate)} – ${formatDisplayDate(dateTo)}`;

  return (
    <div className="spectacle report-panel">
      {metadataLoading ? (
        <p className="app-status app-status--loading">Se încarcă datele spectacolelor...</p>
      ) : (
        <>
          <div className="report-toolbar">
            <label className="field">
              <span className="field__label">Spectacol</span>
              <select
                className="input"
                value={selectedSpectacle}
                onChange={(e) => setSelectedSpectacle(e.target.value)}
              >
                {spectaclesList.map((item) => (
                  <option value={item.toLocaleLowerCase()} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Data de la</span>
              <input
                className="input input--inline"
                type="date"
                value={selectedDate}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Data până la</span>
              <input
                className="input input--inline"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
          </div>

          {spectacleTitle === '' ? (
            <EmptyState
              title="Nu au fost găsite vânzări"
              message={`Nu există spectacole cu vânzări pentru perioada ${periodLabel}.`}
            />
          ) : (
            <>
              <div className="table-scroll">
                <table className="table table--center">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Spectacol</th>
                      <th>Nr. bilete numerar</th>
                      <th>Suma bilete numerar</th>
                      <th>Nr. bilete card</th>
                      <th>Suma bilete card</th>
                      <th>Nr. total bilete</th>
                      <th>Suma totală</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((data) => (
                      <tr key={data.id}>
                        <td>
                          {formatDisplayDate(data.date)} {formatTime(data.time)}
                        </td>
                        <td>{data.title}</td>
                        <td>{data.cash_method}</td>
                        <td>{data.cash_sum}</td>
                        <td>{data.card_method}</td>
                        <td>{data.card_sum}</td>
                        <td>{data.total_tickets}</td>
                        <td>{data.total_sum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="report-summary">
                <h3>Sumar</h3>
                <p><strong>Nr. de bilete numerar:</strong> {totalCashTickets}</p>
                <p><strong>Suma pe bilete numerar:</strong> {totalCashSum} MDL</p>
                <p><strong>Nr. de bilete card:</strong> {totalCardTickets}</p>
                <p><strong>Suma pe bilete card:</strong> {totalCardSum} MDL</p>
                <p><strong>Bilete total:</strong> {totalTickets}</p>
                <p><strong>Suma totală:</strong> {totalSum} MDL</p>
              </div>

              <div className="report-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={!selectedSpectacle || selectedDate > dateTo}
                >
                  Descarcă PDF
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SpectacleReports;

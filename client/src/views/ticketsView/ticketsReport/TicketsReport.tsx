import './TicketsReport.scss';
import { useEffect, useState } from 'react';
import EmptyState from '../../../components/emptyState/EmptyState';
import { getApiErrorMessage } from '../../../api/client';
import { reportsApi } from '../../../api/reportsApi';
import { notifyError } from '../../../utils/toast';
import TicketsReportFilters from './components/TicketsReportFilters';
import TicketsReportSummary from './components/TicketsReportSummary';
import TicketsReportTable from './components/TicketsReportTable';
import { getDefaultReportDates, getTicketPrice } from './helpers';
import type { TicketReportItem } from '../../../api/types';

const TicketsReport: React.FC = () => {
  const defaultDates = getDefaultReportDates();
  const [report, setReport] = useState<TicketReportItem[]>([]);
  const [startDate, setStartDate] = useState<string>(defaultDates.startDate);
  const [endDate, setEndDate] = useState<string>(defaultDates.endDate);
  const [loading, setLoading] = useState<boolean>(true);

  const firstSerial = report.length > 0 ? report[0].serial_number : '';
  const lastSerial = report.length > 0 ? report[report.length - 1].serial_number : '';
  const totalTickets = report.length;

  const fetchReport = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);

    try {
      const data = await reportsApi.getTicketReport(startDate, endDate);
      const formattedData = data.map((item: TicketReportItem) => ({
        ...item,
        price: getTicketPrice(item.type),
      }));

      setReport(formattedData);
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la preluarea raportului pentru bilete'));
      setReport([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  return (
    <div className="ticketsReport">
      <h2 className="ticketsReport__title">Raport pe Bilete</h2>
      <TicketsReportFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />
      {loading ? (
        <p className="app-status app-status--loading">Se încarcă raportul...</p>
      ) : report.length === 0 ? (
        <EmptyState
          title="Nu există bilete în perioada selectată"
          message="Modificați intervalul de date sau verificați dacă au fost vânzări înregistrate."
        />
      ) : (
        <>
          <TicketsReportTable report={report} />
          <TicketsReportSummary
            firstSerial={firstSerial}
            lastSerial={lastSerial}
            totalTickets={totalTickets}
          />
        </>
      )}
    </div>
  );
};

export default TicketsReport;

import { useState } from 'react';
import EmptyState from '../../../../components/emptyState/EmptyState';
import { getApiErrorMessage } from '../../../../api/client';
import { scheduleApi } from '../../../../api/scheduleApi';
import type { Sale } from '../../../../api/types';
import { generatePeriodReportPDF } from '../../../../utils/generatePeriodReportPDF';
import type { PeriodReportData } from '../../../../utils/generatePeriodReportPDF';
import { generateSalesPeriodExcel } from '../../../../utils/generateSalesPeriodExcel';
import { generateSalesShortExcel } from '../../../../utils/generateSalesShortExcel';
import { notifyError } from '../../../../utils/toast';
import './PeriodReports.scss';

interface PeriodReportsProps {
  sales: Sale[];
}

const getCurrentDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const PeriodReports: React.FC<PeriodReportsProps> = ({ sales }) => {
  const [dateFrom, setDateFrom] = useState<string>(getCurrentDate());
  const [dateTo, setDateTo] = useState<string>(getCurrentDate());
  const [excelLoading, setExcelLoading] = useState<boolean>(false);
  const [shortExcelLoading, setShortExcelLoading] = useState<boolean>(false);

  const filteredSales = sales.filter((item) => {
    const saleDate = item.created_at.slice(0, 10);
    return saleDate >= dateFrom && saleDate <= dateTo;
  });

  const cashTickets = filteredSales
    .filter((item) => item.payment_method === 'cash')
    .reduce((acc, curr) => curr.quantity + acc, 0);
  const cashSum = filteredSales
    .filter((item) => item.payment_method === 'cash')
    .reduce((acc, curr) => curr.total_sum + acc, 0);
  const cardTickets = filteredSales
    .filter((item) => item.payment_method === 'card')
    .reduce((acc, curr) => curr.quantity + acc, 0);
  const cardSum = filteredSales
    .filter((item) => item.payment_method === 'card')
    .reduce((acc, curr) => curr.total_sum + acc, 0);
  const totalTickets = filteredSales.reduce((acc, curr) => curr.quantity + acc, 0);
  const totalSum = filteredSales.reduce((acc, curr) => curr.total_sum + acc, 0);

  const handleDownloadPDF = () => {
    const data: PeriodReportData = {
      startDate: dateFrom,
      endDate: dateTo,
      totalCashTickets: cashTickets,
      totalCashAmount: cashSum,
      totalCardTickets: cardTickets,
      totalCardAmount: cardSum,
      totalTickets,
      totalAmount: totalSum,
    };

    generatePeriodReportPDF(data);
  };

  const handleDownloadExcel = async () => {
    setExcelLoading(true);

    try {
      const schedules = await scheduleApi.getAll();
      await generateSalesPeriodExcel({
        sales,
        schedules,
        startDate: dateFrom,
        endDate: dateTo,
      });
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la generarea raportului Excel'));
    } finally {
      setExcelLoading(false);
    }
  };

  const handleDownloadShortExcel = async () => {
    setShortExcelLoading(true);

    try {
      const schedules = await scheduleApi.getAll();
      await generateSalesShortExcel({
        sales,
        schedules,
        startDate: dateFrom,
        endDate: dateTo,
      });
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la generarea raportului Excel scurt'));
    } finally {
      setShortExcelLoading(false);
    }
  };

  const formatDisplayDate = (value: string) => value.split('-').reverse().join('-');
  const periodLabel = `${formatDisplayDate(dateFrom)} – ${formatDisplayDate(dateTo)}`;

  return (
    <div className="period report-panel">
      <div className="report-toolbar">
        <label className="field">
          <span className="field__label">De la</span>
          <input
            className="input input--inline"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Până la</span>
          <input
            className="input input--inline"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
      </div>

      {totalTickets === 0 ? (
        <EmptyState
          title="Nu există vânzări în această perioadă"
          message={`Nu au fost înregistrate vânzări pentru ${periodLabel}.`}
        />
      ) : (
        <>
          <div className="table-scroll">
            <table className="table table--center">
              <thead>
                <tr>
                  <th>Perioada</th>
                  <th>Nr. bilete numerar</th>
                  <th>Suma bilete numerar</th>
                  <th>Nr. bilete card</th>
                  <th>Suma bilete card</th>
                  <th>Nr. bilete total</th>
                  <th>Suma bilete total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{periodLabel}</td>
                  <td>{cashTickets}</td>
                  <td>{cashSum}</td>
                  <td>{cardTickets}</td>
                  <td>{cardSum}</td>
                  <td>{totalTickets}</td>
                  <td>{totalSum}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="report-actions">
            <button className="btn" type="button" onClick={handleDownloadPDF}>
              Descarcă PDF
            </button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={handleDownloadExcel}
              disabled={excelLoading}
            >
              {excelLoading ? 'Se generează...' : 'Descarcă Excel vânzări'}
            </button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={handleDownloadShortExcel}
              disabled={shortExcelLoading}
            >
              {shortExcelLoading ? 'Se generează...' : 'Descarcă Excel scurt'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PeriodReports;

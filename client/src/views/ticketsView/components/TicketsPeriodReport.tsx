import { useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../../../api/client';
import { reportsApi } from '../../../api/reportsApi';
import { notifyError } from '../../../utils/toast';
import { generateTicketsPeriodReportPDF } from '../../../utils/generateTicketsPeriodReportPDF';
import TicketsPeriodReportPreview from './TicketsPeriodReportPreview';
import type { TicketsPeriodReportData } from './ticketsPeriodReportTypes';

const getTodayInputValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const TicketsPeriodReport: React.FC = () => {
  const [dateFrom, setDateFrom] = useState<string>(getTodayInputValue);
  const [dateTo, setDateTo] = useState<string>(getTodayInputValue);
  const [reportData, setReportData] = useState<TicketsPeriodReportData | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string>('');
  const previewRequestId = useRef(0);

  const fetchReportData = async (startDate: string, endDate: string, updatePreview: boolean) => {
    if (!startDate || !endDate) return null;

    const requestId = updatePreview ? ++previewRequestId.current : previewRequestId.current;

    if (updatePreview) {
      setPreviewLoading(true);
      setPreviewError('');
    }

    try {
      const data = await reportsApi.getTicketsPeriodReport(startDate, endDate);
      if (updatePreview && requestId === previewRequestId.current) {
        setReportData(data);
      }
      return data;
    } catch (error) {
      if (updatePreview && requestId === previewRequestId.current) {
        setPreviewError(getApiErrorMessage(error, 'Eroare la încărcarea previzualizării'));
        setReportData(null);
      }
      return null;
    } finally {
      if (updatePreview && requestId === previewRequestId.current) {
        setPreviewLoading(false);
      }
    }
  };

  const downloadReport = async () => {
    const data = await fetchReportData(dateFrom, dateTo, false);
    if (!data) {
      notifyError(previewError || 'Eroare la generarea raportului');
      return;
    }

    generateTicketsPeriodReportPDF(data);
  };

  useEffect(() => {
    fetchReportData(dateFrom, dateTo, true);
  }, [dateFrom, dateTo]);

  return (
    <div className="tickets__report-period report-panel">
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

      <TicketsPeriodReportPreview
        data={reportData}
        loading={previewLoading}
        error={previewError}
      />

      <div className="report-actions">
        <button
          className="btn"
          type="button"
          onClick={downloadReport}
          disabled={previewLoading}
        >
          Descarcă PDF
        </button>
      </div>
    </div>
  );
};

export default TicketsPeriodReport;

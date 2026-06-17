import DailyReports from './reports/dailyReports/DailyReports';
import MonthlyReports from './reports/monthly/MonthlyReports';
import SpectacleReports from './reports/spectacleReports/SpectacleReports';
import PeriodReports from './reports/periodReports/PeriodReports';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../api/client';
import { salesApi } from '../../api/salesApi';
import type { Sale } from '../../api/types';
import { notifyError } from '../../utils/toast';
import './ReportsView.scss';

type ReportTabId = 'zilnic' | 'lunar' | 'spectacol' | 'perioada';

const reportTabs: { id: ReportTabId; label: string }[] = [
  { id: 'zilnic', label: 'Zilnic' },
  { id: 'lunar', label: 'Lunar' },
  { id: 'spectacol', label: 'Spectacol' },
  { id: 'perioada', label: 'Perioadă' },
];

const ReportsView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTabId>('zilnic');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);

      try {
        const data = await salesApi.getAll();
        setSales(data);
      } catch (error) {
        notifyError(getApiErrorMessage(error, 'Eroare la încărcarea vânzărilor'));
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const renderActiveReport = () => {
    if (loading) {
      return <p className="app-status app-status--loading">Se încarcă vânzările...</p>;
    }

    switch (activeTab) {
      case 'zilnic':
        return <DailyReports sales={sales} />;
      case 'lunar':
        return <MonthlyReports sales={sales} />;
      case 'spectacol':
        return <SpectacleReports sales={sales} />;
      case 'perioada':
        return <PeriodReports sales={sales} />;
      default:
        return <DailyReports sales={sales} />;
    }
  };

  return (
    <div className="reports">
      <h2 className="reports__title">Rapoarte vânzări</h2>

      <div className="reports__tabs" role="tablist" aria-label="Tipuri de rapoarte">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`reports__tab ${activeTab === tab.id ? 'reports__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="reports__panel" role="tabpanel">
        {renderActiveReport()}
      </div>
    </div>
  );
};

export default ReportsView;

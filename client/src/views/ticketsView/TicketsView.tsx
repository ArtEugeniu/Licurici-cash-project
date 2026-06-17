import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../api/client';
import { ticketsApi } from '../../api/ticketsApi';
import './TicketsView.scss';
import IntegrityCheck from './components/IntegrityCheck';
import TicketsEntryForm from './components/TicketsEntryForm';
import TicketsEntryTable from './components/TicketsEntryTable';
import TicketsPeriodReport from './components/TicketsPeriodReport';
import TicketsReport from './ticketsReport/TicketsReport';
import { notifyError } from '../../utils/toast';
import type { TicketEntry } from '../../api/types';

type TicketTabId = 'verificare' | 'primire' | 'perioada' | 'serii';

const ticketTabs: { id: TicketTabId; label: string }[] = [
  { id: 'verificare', label: 'Verificare' },
  { id: 'primire', label: 'Primire' },
  { id: 'perioada', label: 'Perioadă' },
  { id: 'serii', label: 'Serii' },
];

const TicketsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TicketTabId>('verificare');
  const [ticketsInList, setTicketInList] = useState<TicketEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTicketsIn = async () => {
    setLoading(true);

    try {
      const data = await ticketsApi.getReceived();
      setTicketInList(data);
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la preluarea biletelor'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'primire') {
      fetchTicketsIn();
    }
  }, [activeTab]);

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'verificare':
        return <IntegrityCheck />;
      case 'primire':
        return (
          <>
            <TicketsEntryForm onTicketsAdded={fetchTicketsIn} />
            {loading ? (
              <p className="app-status app-status--loading">Se încarcă lista biletelor primite...</p>
            ) : (
              <TicketsEntryTable ticketsInList={ticketsInList} />
            )}
          </>
        );
      case 'perioada':
        return <TicketsPeriodReport />;
      case 'serii':
        return <TicketsReport />;
      default:
        return <IntegrityCheck />;
    }
  };

  return (
    <div className="tickets page">
      <h2 className="page-title">Rapoarte Bilete</h2>

      <div className="tabs" role="tablist" aria-label="Secțiuni rapoarte bilete">
        {ticketTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tabs__tab ${activeTab === tab.id ? 'tabs__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tickets__panel tabs__panel" role="tabpanel">
        {renderActivePanel()}
      </div>
    </div>
  );
};

export default TicketsView;

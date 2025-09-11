import './DashboardLayout.scss';
import Header from '../header/Header';
import Sidebar from '../sidebar/Sidebar';
import ScheduleView from '../../views/scheduleView/ScheduleView';
import SpectaclesView from '../../views/spectaclesView/SpectaclesView';
import ReportsView from '../../views/reportsView/ReportsView';
import TicketsView from '../../views/ticketsView/TicketsView';

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ activeTab, setActiveTab }) => {

  const renderContent = () => {
    switch (activeTab) {
      case 'program':
        return <ScheduleView />;
      case 'spectacole':
        return <SpectaclesView />;
      case 'rapoarte':
        return <ReportsView />;
        case 'bilete':
        return <TicketsView />;
      default:
        return <ScheduleView />
    }
  }

  return (
    <>
      <Header />
      <main>
        <div className="container">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          {renderContent()}
        </div>
      </main>
    </>
  )
}

export default DashboardLayout;
import type { ReactNode } from 'react';
import './Sidebar.scss';

type SidebarItem = {
  id: string;
  title: string;
  shortTitle: string;
  icon: ReactNode;
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'program',
    title: 'Program',
    shortTitle: 'Program',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar__icon">
        <path d="M7 3v2M17 3v2M4 9h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    ),
  },
  {
    id: 'spectacole',
    title: 'Spectacole',
    shortTitle: 'Spectacole',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar__icon">
        <path d="M4 6h16v2H4V6zm2 4h12l-1 10H7L6 10zm4-8 2 2 2-2H10z" />
      </svg>
    ),
  },
  {
    id: 'rapoarte',
    title: 'Rapoarte Vânzări',
    shortTitle: 'Vânzări',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar__icon">
        <path d="M4 19V5h2v14H4zm6 0V9h2v10h-2zm6 0V3h2v16h-2z" />
      </svg>
    ),
  },
  {
    id: 'bilete',
    title: 'Rapoarte Bilete',
    shortTitle: 'Bilete',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar__icon">
        <path d="M3 8v8a2 2 0 0 0 2 2h1v2l3-2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zm3-2h12v2H6V6zm0 4h12v6H6v-6z" />
      </svg>
    ),
  },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar" aria-label="Navigare principală">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true">✦</span>
        <span className="sidebar__brand-text">Licurici</span>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <li className="sidebar__item" key={item.id}>
                <button
                  type="button"
                  className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  <span className="sidebar__link-text">{item.title}</span>
                  <span className="sidebar__link-short">{item.shortTitle}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

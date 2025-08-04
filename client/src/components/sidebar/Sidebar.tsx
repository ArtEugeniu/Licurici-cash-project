import './Sidebar.scss';

type TabType = {
  id: string;
  title: string
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void
}


const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {

  const sidebarItems: TabType[] = [
    { id: 'program', title: 'Program' },
    { id: 'spectacole', title: 'Spectacole' },
    { id: 'rapoarte', title: 'Rapoarte' }
  ];

  return (
    <>
      <aside className='sidebar'>
        <ul className="sidebar__list">

          {sidebarItems.map(item => {
            return (
              <li className="sidebar__item" key={item.id}>
                <button className={`sidebar__button ${activeTab === item.id ? 'sidebar__button-active' : ''}`} onClick={() => setActiveTab(item.id)}>
                  {item.title}
                </button>
              </li>
            )
          })}

        </ul>
      </aside>
    </>
  )
}

export default Sidebar;
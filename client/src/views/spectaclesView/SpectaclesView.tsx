import './Spectaclesview.scss';
import { useEffect, useState } from 'react';
import SpectaclesViewModal from './SpectacleViewModal';
import SpectaclesViewAddModal from './SpectaclesViewAddModal';
import { v4 as uuid } from 'uuid';

interface Spectacles {
  id: string;
  title: string;
  created_at: string;
  type: string;
}

interface ScheduleData {
  title: string
  time: string
  type: string
  date: string
}

const SpectaclesView: React.FC = () => {

  const [spectacles, setSpectacles] = useState<Spectacles[]>([]);
  const [showModalNew, setShowModalNew] = useState<boolean>(false);
  const [showModalAdd, setShowModalAdd] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [filteredSpectacles, setFilteredSpectacles] = useState<Spectacles[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    title: '',
    time: '',
    type: '',
    date: ''
  })

  useEffect(() => {
    const fetchSpectacles = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/spectacles');
        const data = await response.json();
        setSpectacles(data)
      } catch (error) {
        alert('Eroare la încărcarea spectacolelor:' + error)
      }
    }

    fetchSpectacles();
  }, []);

  useEffect(() => {
    const filtered = spectacles.filter(item => {
      return item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase());
    })
    setFilteredSpectacles(search === '' ? spectacles : filtered);
  }, [spectacles, search])

  const handleAddSpectacle = async (title: string, type: string) => {
    const randomId = uuid();
    const response = await fetch('http://localhost:5000/api/spectacles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: randomId, title, type })
    });

    const data = await response.json();


    setSpectacles(data);
  };

  const handleDeleteSpectacle = async (id: string) => {

    const confirmed = window.confirm('Sunteti sigur ca doriti sa stergeti acest spectacol?');
    if (!confirmed) return;

    const response = await fetch(`http://localhost:5000/api/spectacles/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    setSpectacles(data);
  }

  const handleCancelAddToSchedule = async () => {
    setShowModalAdd(false)
  }

  const handleAddToSchedule = async () => {
    const date = scheduleData.date;
    const time = scheduleData.time;
    const randomId = uuid();

    if (!isValidDate(String(date))) {
      alert('Introduceți dată corectă')
      return;
    }

    if (isDateInPast(String(date))) {
      alert('Introduceți dată corectă')
      return;
    }

    if (!isValidTime(String(time))) {
      alert('Introduceți ora corectă');
      return;
    }

    try {
     const response = await fetch('http://localhost:5000/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: randomId,
          title: scheduleData.title,
          type: scheduleData.type,
          date: scheduleData.date,
          time: scheduleData.time
        })
      });

      if(!response.ok) {
        const errorData = await response.json();
        alert(errorData.error);
        return
      }

      setShowModalAdd(false);
    } catch (error) {
      alert('Eroare la adaugarea spectacolului in program: ' + error)
    }
  }

  function isValidDate(dateStr: string) {
    if (!dateStr) return false;

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  function isDateInPast(dateStr: string): boolean {
    if (!dateStr) return false;

    const inputDate = new Date(dateStr);
    const today = new Date();


    today.setHours(0, 0, 0, 0);


    return inputDate < today;
  }

  function isValidTime(timeStr: string): boolean {
    if (!timeStr) return false;

    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(timeStr);
  }


  return (
    <div className="spectacles">
      <h2 className="spectacles__title">
        Spectacole
      </h2>
      <button className='spectacles__new' onClick={() => setShowModalNew(true)}>Spectacol nou</button>
      <label className='spectacles__search-label' htmlFor="spectacle-search">
        <input className='spectacles__search' type="search" id="spectacle-search" placeholder='Cauta spectacol' onChange={(e) => setSearch(e.target.value)} value={search} />
      </label>
      {showModalNew && <SpectaclesViewModal onCancel={() => setShowModalNew(false)} onAdd={handleAddSpectacle} />}
      {showModalAdd && <SpectaclesViewAddModal scheduleData={scheduleData} setScheduleData={setScheduleData} onAccept={handleAddToSchedule} onCancel={handleCancelAddToSchedule} />}
      <ul className="spectacles__list">
        {filteredSpectacles.map(item => {
          return (
            <li className="spectacles__item" key={item.id}>
              <h3 className="spectacles__name">{item.title} <span>{item.type === 'Premiera' ? '(Premiera)' : ''}</span></h3>
              <div className="spectacles__actions">
                <button className="spectacles__add" onClick={() => {
                  setShowModalAdd(true);
                  setScheduleData({ title: item.title, type: item.type, date: '', time: '' })
                }}>Adaugă</button>
                <button className="spectacles__delete" onClick={() => handleDeleteSpectacle(item.id)}>Șterge</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SpectaclesView;
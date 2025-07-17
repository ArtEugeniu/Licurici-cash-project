import './Spectaclesview.scss';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SpectaclesViewModal from './SpectacleViewModal';
import SpectaclesViewAddModal from './SpectaclesViewAddModal';

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
      const { data, error } = await supabase.from('spectacles').select('*');
      if (error) {
        console.error('Spectacles Download error: ' + error.message)
      } else {
        setSpectacles(data)
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
    const { data, error } = await supabase.from('spectacles').insert([{ title, type }]);
    if (error) {
      console.error('Eroare: ' + error.message)
      return
    }

    setSpectacles((prev) => [...prev, ...(data || [])])
  };

  const handleDeleteSpectacle = async (id: string) => {

    const confirmed = window.confirm('Sunteti sigur ca doriti sa stergeti acest spectacol?');
    if (!confirmed) return;

    const { error } = await supabase.from('spectacles').delete().eq('id', id);
    if (error) {
      console.error('Eroare: ' + error.message);

      setSpectacles(prev => prev.filter(item => item.id !== id));
    }
  }

  const handleCancelAddToSchedule = async () => {
    setShowModalAdd(false)
  }

  const handleAddToSchedule = async () => {
    const date = scheduleData.date;

    if (!isValidDate(String(date))) {
      alert('Introduceți dată corectă')
      return;
    }

    if (isDateInPast(String(date))) {
      alert('Introduceți dată corectă')
      return;
    }

    const { data: existing } = await supabase.from('schedule').select('*').eq('title', scheduleData.title).eq('date', scheduleData.date);

    if (existing && existing.length > 0) {
      alert(`Spectacolul ${scheduleData.title} deja este in program pe data de ${scheduleData.date}`)
      return
    }

    const { error } = await supabase.from('schedule').insert([{ title: scheduleData.title, type: scheduleData.type, date: scheduleData.date, time: scheduleData.time }]);

    if (error) {
      console.error('Eroare: ' + error.message)
    }

    setShowModalAdd(false);

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
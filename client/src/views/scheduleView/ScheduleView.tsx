import './ScheduleView.scss';
import { useEffect, useState } from 'react';
import ScheduleViewModal from './ScheduleViewModal';
import ScheduleViewEditModal from './ScheduleViewEditModal';

type ScheduleDataType = {
  time: string
  title: string
  date: string
  type: string
  id: string
}


const ScheduleView: React.FC = () => {

  const [scheduleData, setScheduleData] = useState<ScheduleDataType[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showModalEdit, setShowModalEdit] = useState<boolean>(false);
  const [selectedSpectacle, setSelectedSpectacle] = useState<ScheduleDataType>({
    time: '',
    title: '',
    date: '',
    type: '',
    id: ''
  });

  const scheduleList = async () => {

    const response = await fetch('http://localhost:5000/api/schedule', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Eroare la încărcarea afișei');
    }

    const data = await response.json();

    if (data) {

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sorted = data.sort((a: any, b: any) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      const filtered = sorted.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate >= today;
      });
      setScheduleData(filtered);
    }

  }

  useEffect(() => {

    scheduleList();

  }, []);

  const editSpectacle = async (title: string, id: string, type: string) => {

    const confirm = window.confirm('Sunteti sigur ca doriti sa editati acest spectacol?');

    if (!confirm) return;

    try {
      const response = await fetch(`http://localhost:5000/api/schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type })
      });

      if (!response.ok) {
        alert('Eroare la editarea spectacolului');
      }


      scheduleList();
      setShowModalEdit(false);
    } catch (error) {
      alert('Eroare la editarea spectacolului')
    }
  }

  const removeSpectacle = async (id: string) => {

    const confirmed = window.confirm('Sunteti sigur ca doriti sa stergeti acest spectacol?');
    if (!confirmed) return;

    const response = await fetch(`http://localhost:5000/api/schedule/${id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      setScheduleData(prev => prev.filter(item => item.id !== id));
    } else {
      alert('Eroare la ștergere');
    }
  }

  const formateDate = (date: string): string => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }



  return (
    <div className='program'>
      <h2 className='program__title'>Program</h2>
      {showModal && <ScheduleViewModal selectedSpectacle={selectedSpectacle} setShowModal={setShowModal} />}
      {showModalEdit && <ScheduleViewEditModal selectedSpectacle={selectedSpectacle} setShowModalEdit={setShowModalEdit} onConfirm={editSpectacle} />}
      <ul className="program__list">
        {scheduleData.map(item => {
          return (
            <li className="program__item" key={item.id} onClick={() => (setShowModal(true), setSelectedSpectacle(item))}>
              <h3 className="program__item-title">{item.title} <span>{item.type === 'Premiera' ? '(Premiera)' : ''}</span></h3>
              <div className='program__item-info'>
                <div className='program__item-time'>Ora: {item.time}</div>
                <div className="program__item-date">Data: {formateDate(item.date)}</div>
                <button className='program__item-button' onClick={(e) => (e.stopPropagation(), setShowModalEdit(true), setSelectedSpectacle(item))}>Editeza</button>
                <button className='program__item-button' onClick={(e) => (e.stopPropagation(), removeSpectacle(item.id))}>Sterge</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ScheduleView;
import './ScheduleViewEditModal.scss';
import { useState, useEffect } from 'react';


type ScheduleDataType = {
  time: string
  title: string
  date: string
  type: string
  id: string
}

type SpectacleData = {
  title: string
  id: string
  type: string
}

interface ScheduleViewEditModalProps {
  selectedSpectacle: ScheduleDataType
  setShowModalEdit: React.Dispatch<React.SetStateAction<boolean>>
  onConfirm: (title: string, id: string, type: string) => void
}

const ScheduleViewEditModal: React.FC<ScheduleViewEditModalProps> = ({ selectedSpectacle, setShowModalEdit, onConfirm }) => {

  const [spectaleList, setSpectacleList] = useState<SpectacleData[]>([]);
  const [spectacle, setSpectacle] = useState<SpectacleData>({
    title: selectedSpectacle.title,
    id: selectedSpectacle.id,
    type: selectedSpectacle.type
  });


  useEffect(() => {
    const fetchSpectaclesList = async () => {
      const response = await fetch('http://localhost:5000/api/spectacles', {
        method: 'GET'
      });

      const data = await response.json();
      setSpectacleList(data);
    }


    fetchSpectaclesList();
  }, []);

  return (
    <div className='editModal'>
      <h2 className="editModal__title">Editeaza</h2>
      <label htmlFor="spectacle-list">Titlu: </label>
      <select className='editModal__select' name="" id="spectacle-list" value={spectacle.title} onChange={(e) => {
        const selectedTitle = e.target.value;
        const selected = spectaleList.find(item => selectedTitle === item.title);
        if (selected) {
          setSpectacle(prev => ({
            ...prev,
            title: selected.title,
            type: selected.type
          }))
        }
      }}>
        {spectaleList.map((item, index) => {
          return (
            <option value={item.title} key={index}>{item.title}</option>
          )
        })}
      </select>
      <div className='editModal__buttons'>
        <button className='editModal__button' onClick={() => onConfirm(spectacle.title, spectacle.id, spectacle.type)}>Accepta</button>
        <button className='editModal__button' onClick={() => setShowModalEdit(false)}>Anuleaza</button>
      </div>
    </div>
  )
}

export default ScheduleViewEditModal;
import './ScheduleViewEditModal.scss';
import { useState, useEffect } from 'react';
import { spectaclesApi } from '../../api/spectaclesApi';
import type { ScheduleItem, Spectacle } from '../../api/types';

interface ScheduleViewEditModalProps {
  selectedSpectacle: ScheduleItem
  setShowModalEdit: React.Dispatch<React.SetStateAction<boolean>>
  onConfirm: (title: string, id: string, type: string) => void
}

const ScheduleViewEditModal: React.FC<ScheduleViewEditModalProps> = ({ selectedSpectacle, setShowModalEdit, onConfirm }) => {

  const [spectaleList, setSpectacleList] = useState<Spectacle[]>([]);
  const [spectacle, setSpectacle] = useState<Spectacle>({
    title: selectedSpectacle.title,
    id: selectedSpectacle.id,
    type: selectedSpectacle.type
  });


  useEffect(() => {
    const fetchSpectaclesList = async () => {
      const data = await spectaclesApi.getAll();
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
        <button className='editModal__button' onClick={() => onConfirm(spectacle.title, spectacle.id, spectacle.type)}>Acceptă</button>
        <button className='editModal__button' onClick={() => setShowModalEdit(false)}>Anulează</button>
      </div>
    </div>
  )
}

export default ScheduleViewEditModal;

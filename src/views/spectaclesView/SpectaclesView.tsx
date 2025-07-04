import './Spectaclesview.scss';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SpectaclesViewModal from './SpectacleViewModal';

interface Spectacles {
  id: string;
  title: string;
  created_at: string;
  type: string;
}

const SpectaclesView: React.FC = () => {

  const [spectacles, setSpectacles] = useState<Spectacles[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);

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
  }, [spectacles]);

  const handleAddSpectacle = async (title: string, type: string) => {
    const { data, error } = await supabase.from('spectacles').insert([{ title, type }]);
    if (error) {
      console.error('Eroare: ' + error.message)
      return
    }

    setSpectacles((prev) => [...prev, ...(data || [])])
  };

  const handleDeleteSpectacle = async (id: string) => {
    const {data, error} = await supabase.from('spectacles').delete().eq('id', id);
    if(error) {
      console.error('Eroare: ' + error.message);

      setSpectacles(prev => prev.filter(item => item.id !== id));
    }
  }

  return (
    <div className="spectacles">
      <h2 className="spectacles__title">
        Spectacole
      </h2>
      <button className='spectacles__new' onClick={() => setShowModal(true)}>Spectacol nou</button>
      {showModal && <SpectaclesViewModal onCancel={() => setShowModal(false)} onAdd={handleAddSpectacle} />}
      <ul className="spectacles__list">
        {spectacles.map(item => {
          return (
            <li className="spectacles__item" key={item.id}>
              <h3 className="spectacles__name">{item.title} <span>({item.type})</span></h3>
              <div className="spectacles__actions">
                <button className="spectacles__add">Adaugă</button>
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
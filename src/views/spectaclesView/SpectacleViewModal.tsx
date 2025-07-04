import './SpectaclesViewModal.scss';
import { useState } from 'react';

interface SpectaclesViewModalProps {
  onCancel: () => void;
  onAdd: (title: string, type: string) => void;
}

const SpectaclesViewModal: React.FC<SpectaclesViewModalProps> = ({ onCancel, onAdd }) => {

  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<string>('Standart');

  const onAccept = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), type);
    onCancel();
  }

  return (
    <div className='modal'>
      <div className='modal__content'>
        <h3 className='modal__title'>Adaugă spectacol</h3>
        <input className='modal__input' type="text" placeholder='Titlul spectacolului' value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className='modal__select' value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Standart">Standart</option>
          <option value="Premiera">Premieră</option>
        </select>
        <div className='modal__buttons'>
          <button onClick={onAccept}>Salvează</button>
          <button onClick={onCancel}>Anulează</button>
        </div>
      </div>
    </div>
  )
}

export default SpectaclesViewModal;
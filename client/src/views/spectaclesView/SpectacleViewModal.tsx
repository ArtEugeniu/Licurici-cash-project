import { useState } from 'react';
import Modal from '../../components/modal/Modal';

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
  };

  return (
    <Modal title="Adaugă spectacol" onClose={onCancel}>
      <div className="field">
        <label className="field__label" htmlFor="spectacle-title">Titlul spectacolului</label>
        <input
          className="input"
          id="spectacle-title"
          type="text"
          placeholder="Titlul spectacolului"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="spectacle-type">Tip</label>
        <select className="select" id="spectacle-type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Standart">Standart</option>
          <option value="Premiera">Premieră</option>
          <option value="Special">Special</option>
        </select>
      </div>

      <div className="modal__actions">
        <button className="btn" onClick={onAccept}>Salvează</button>
        <button className="btn btn--secondary" onClick={onCancel}>Anulează</button>
      </div>
    </Modal>
  );
};

export default SpectaclesViewModal;

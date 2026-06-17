import { useState, useEffect } from 'react';
import Modal from '../../components/modal/Modal';
import { spectaclesApi } from '../../api/spectaclesApi';
import type { ScheduleItem, Spectacle } from '../../api/types';

interface ScheduleViewEditModalProps {
  selectedSpectacle: ScheduleItem;
  setShowModalEdit: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: (title: string, id: string, type: string) => void;
}

const ScheduleViewEditModal: React.FC<ScheduleViewEditModalProps> = ({
  selectedSpectacle,
  setShowModalEdit,
  onConfirm,
}) => {
  const [spectaleList, setSpectacleList] = useState<Spectacle[]>([]);
  const [spectacle, setSpectacle] = useState<Spectacle>({
    title: selectedSpectacle.title,
    id: selectedSpectacle.id,
    type: selectedSpectacle.type,
  });

  useEffect(() => {
    spectaclesApi.getAll().then(setSpectacleList).catch(() => {});
  }, []);

  return (
    <Modal title="Editează spectacolul" onClose={() => setShowModalEdit(false)}>
      <div className="field">
        <label className="field__label" htmlFor="spectacle-list">Titlu</label>
        <select
          className="select"
          id="spectacle-list"
          value={spectacle.title}
          onChange={(e) => {
            const selectedTitle = e.target.value;
            const selected = spectaleList.find((item) => selectedTitle === item.title);
            if (selected) {
              setSpectacle((prev) => ({
                ...prev,
                title: selected.title,
                type: selected.type,
              }));
            }
          }}
        >
          {spectaleList.map((item) => (
            <option value={item.title} key={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>

      <div className="modal__actions">
        <button
          className="btn"
          onClick={() => onConfirm(spectacle.title, spectacle.id, spectacle.type)}
        >
          Acceptă
        </button>
        <button className="btn btn--secondary" onClick={() => setShowModalEdit(false)}>
          Anulează
        </button>
      </div>
    </Modal>
  );
};

export default ScheduleViewEditModal;

import Modal from '../../components/modal/Modal';

interface ScheduleData {
  title: string;
  time: string;
  type: string;
  date: string;
}

interface SpectaclesViewAddModalProps {
  scheduleData: ScheduleData;
  onCancel: () => void;
  onAccept: () => void;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>;
  isSubmitting?: boolean;
}

const SpectaclesViewAddModal: React.FC<SpectaclesViewAddModalProps> = ({
  scheduleData,
  setScheduleData,
  onCancel,
  onAccept,
  isSubmitting = false,
}) => {
  return (
    <Modal title={`Adaugă în program: ${scheduleData.title}`} onClose={() => !isSubmitting && onCancel()}>
      <div className="field">
        <label className="field__label" htmlFor="schedule-date">Data</label>
        <input
          id="schedule-date"
          type="date"
          className="input"
          disabled={isSubmitting}
          onChange={(e) => setScheduleData((prev) => ({ ...prev, date: e.target.value }))}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="schedule-time">Ora spectacolului</label>
        <input
          id="schedule-time"
          type="time"
          className="input"
          disabled={isSubmitting}
          onChange={(e) => setScheduleData((prev) => ({ ...prev, time: e.target.value }))}
        />
      </div>

      <div className="modal__actions">
        <button className="btn" onClick={onAccept} disabled={isSubmitting}>
          {isSubmitting ? 'Se adaugă...' : 'Acceptați'}
        </button>
        <button className="btn btn--secondary" onClick={onCancel} disabled={isSubmitting}>
          Anulați
        </button>
      </div>
    </Modal>
  );
};

export default SpectaclesViewAddModal;

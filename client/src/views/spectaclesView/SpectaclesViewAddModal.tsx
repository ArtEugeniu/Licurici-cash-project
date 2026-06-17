import './SpectaclesViewAddModal.scss'

interface ScheduleData {
  title: string
  time: string
  type: string
  date: string
}

interface SpectaclesViewAddModalProps {
  scheduleData: ScheduleData
  onCancel: () => void
  onAccept: () => void
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>
  isSubmitting?: boolean
}

const SpectaclesViewAddModal: React.FC<SpectaclesViewAddModalProps> = ({
  scheduleData,
  setScheduleData,
  onCancel,
  onAccept,
  isSubmitting = false,
}) => {

  return (
    <div className="addModal">
      <h2 className="addModal__title">{scheduleData.title}</h2>
      <input id='date' type="date" className="addModal__date" disabled={isSubmitting} onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))} />
      <input type="time" className='addModal__date' placeholder='Ora spectacolului' disabled={isSubmitting} onChange={(e) => setScheduleData(prev => ({...prev, time: e.target.value}))}/>
      <div className="addModal__buttons">
        <button className="addModal__accept" onClick={onAccept} disabled={isSubmitting}>
          {isSubmitting ? 'Se adaugă...' : 'Acceptați'}
        </button>
        <button className='addModal__cancel' onClick={onCancel} disabled={isSubmitting}>Anulați</button>
      </div>
    </div>
  )
}

export default SpectaclesViewAddModal;

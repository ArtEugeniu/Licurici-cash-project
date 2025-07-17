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
}

const SpectaclesViewAddModal: React.FC<SpectaclesViewAddModalProps> = ({ scheduleData, setScheduleData, onCancel, onAccept }) => {

  return (
    <div className="addModal">
      <h2 className="addModal__title">{scheduleData.title}</h2>
      <input id='date' type="date" className="addModal__date" onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))} />
      <input type="time" className='addModal__date' placeholder='Ora spectacolului' onChange={(e) => setScheduleData(prev => ({...prev, time: e.target.value}))}/>
      <div className="addModal__buttons">
        <button className="addModal__accept" onClick={onAccept}>Acceptați</button>
        <button className='addModal__cancel' onClick={onCancel}>Anulați</button>
      </div>
    </div>
  )
}

export default SpectaclesViewAddModal;
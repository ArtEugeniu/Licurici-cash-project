import './ScheduleViewModal.scss';
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

type ScheduleDataType = {
  time: string
  title: string
  date: string
  type: string
  id: string
}

interface ScheduleViewModalProps {
  selectedSpectacle: ScheduleDataType
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>
}

const ScheduleViewModal: React.FC<ScheduleViewModalProps> = ({ selectedSpectacle, setShowModal }) => {

  const [ticketNumber, setTicketNumber] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  const addSale = async () => {
    if (ticketNumber === 0) {
      alert('Eroare: Alegeti numarul de bilete')
      return
    }
    const { error } = await supabase.from('sales').insert([
      {
        quantity: ticketNumber,
        payment_method: paymentMethod,
        total_sum: totalPrice(),
        schedule_id: selectedSpectacle.id,
        type: selectedSpectacle.type
      }
    ])
    if (error) {
      alert('Eroare: ' + error.message)
    } else {
      alert('Succes!')
    }
  }


  const totalPrice = (): number => {
    if (selectedSpectacle.type === 'Standart') return 100 * ticketNumber;
    else return 150 * ticketNumber
  }


  return (
    <div className="scheduleModal">
      <h2 className="scheduleModal__title">{selectedSpectacle.title} ({selectedSpectacle.type}) {selectedSpectacle.date}</h2>
      <select className='scheduleModal__select' name="payment-method" id="payment-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
        <option value="cash">Numerar</option>
        <option value="card">Card</option>
      </select>
      <div className="scheduleModal__ticket-number">
        <label htmlFor="tickets-number">Numarul de bilete: </label>
        <input type="number" id="tickets-number" min={1} value={ticketNumber} onChange={(e) => setTicketNumber(Number(e.target.value))} />
      </div>
      <div className='scheduleModal__total'>Total: <span>{totalPrice()} Lei</span></div>
      <div className="scheduleModal__buttons">
        <button className="scheduleModal__accept" onClick={() => (setShowModal(false), addSale())}>Confirma</button>
        <button className="scheduleModal__cancel" onClick={() => setShowModal(false)}>Declina</button>
      </div>
    </div>
  )
}

export default ScheduleViewModal;
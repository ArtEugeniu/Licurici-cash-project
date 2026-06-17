import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import Modal from '../../components/modal/Modal';
import { getApiErrorMessage } from '../../api/client';
import { salesApi } from '../../api/salesApi';
import type { ScheduleItem } from '../../api/types';
import { notifyError, notifySuccess } from '../../utils/toast';
import type { CurrentRollStock } from '../../utils/remainingTickets';

interface ScheduleViewModalProps {
  selectedSpectacle: ScheduleItem;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  currentRoll: CurrentRollStock | null;
  onSaleComplete?: () => void;
}

const ScheduleViewModal: React.FC<ScheduleViewModalProps> = ({
  selectedSpectacle,
  setShowModal,
  currentRoll,
  onSaleComplete,
}) => {
  const [ticketNumber, setTicketNumber] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmStep, setShowConfirmStep] = useState<boolean>(false);

  const totalPrice = (): number => {
    if (selectedSpectacle.type === 'Standart') return 100 * ticketNumber;
    if (selectedSpectacle.type === 'Premiera') return 150 * ticketNumber;
    if (selectedSpectacle.type === 'Special') return 200 * ticketNumber;
    return 100 * ticketNumber;
  };

  const formattedDate = selectedSpectacle.date.split('-').reverse().join('.');
  const paymentLabel = paymentMethod === 'cash' ? 'Numerar' : 'Card';
  const ticketLabel = ticketNumber === 1 ? 'bilet' : 'bilete';
  const isRollBlocked = currentRoll === null || ticketNumber > currentRoll.remaining;
  const rollErrorMessage = currentRoll === null
    ? 'Nu există bilete disponibile la casa de bilete'
    : `Nu sunt suficiente bilete în rolă. Rămase: ${currentRoll.remaining}`;

  const closeModal = () => setShowModal(false);

  const handleConfirmClick = () => {
    if (ticketNumber <= 0) {
      notifyError('Alegeți un număr valid de bilete');
      return;
    }

    if (currentRoll === null) {
      notifyError('Nu există bilete disponibile la casa de bilete');
      return;
    }

    if (ticketNumber > currentRoll.remaining) {
      notifyError(`Nu sunt suficiente bilete în rolă. Rămase: ${currentRoll.remaining}`);
      return;
    }

    setShowConfirmStep(true);
  };

  const addSale = async () => {
    setIsSubmitting(true);

    try {
      await salesApi.create({
        id: uuid(),
        quantity: ticketNumber,
        payment_method: paymentMethod,
        total_sum: totalPrice(),
        type: selectedSpectacle.type,
        title: selectedSpectacle.title,
        schedule_id: selectedSpectacle.id,
        print: {
          title: selectedSpectacle.title,
          date: formattedDate,
          time: selectedSpectacle.time,
          price: `${totalPrice() / ticketNumber} `,
        },
      });

      notifySuccess(
        `Vânzare reușită: ${ticketNumber} ${ticketLabel} - ${selectedSpectacle.title}, ${formattedDate} ${selectedSpectacle.time}, ${totalPrice()} lei`
      );

      onSaleComplete?.();
      closeModal();
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la vânzare sau tipărire'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirmStep) {
    return (
      <Modal title="Confirmați vânzarea" onClose={() => !isSubmitting && setShowConfirmStep(false)}>
        <div className="modal__summary">
          <p><strong>Spectacol:</strong> {selectedSpectacle.title}</p>
          <p><strong>Data:</strong> {formattedDate} {selectedSpectacle.time}</p>
          <p><strong>Bilete:</strong> {ticketNumber}</p>
          <p><strong>Plată:</strong> {paymentLabel}</p>
          <p><strong>Total:</strong> {totalPrice()} Lei</p>
        </div>
        <div className="modal__actions">
          <button className="btn btn--lg" onClick={addSale} disabled={isSubmitting}>
            {isSubmitting ? 'Se procesează...' : 'Finalizează'}
          </button>
          <button className="btn btn--secondary btn--lg" onClick={() => setShowConfirmStep(false)} disabled={isSubmitting}>
            Înapoi
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`${selectedSpectacle.title} (${selectedSpectacle.type})`}
      onClose={() => !isSubmitting && closeModal()}
    >
      <div className="field">
        <label className="field__label" htmlFor="payment-method">Metodă de plată</label>
        <select
          className="select"
          id="payment-method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          disabled={isSubmitting}
        >
          <option value="cash">Numerar</option>
          <option value="card">Card</option>
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="tickets-number">Numărul de bilete</label>
        <input
          className="input"
          type="number"
          id="tickets-number"
          min={1}
          value={ticketNumber}
          onChange={(e) => setTicketNumber(Number(e.target.value))}
          disabled={isSubmitting}
        />
        {currentRoll ? (
          <p className="field__hint">
            În rolă curentă: {currentRoll.remaining}{' '}
            {currentRoll.remaining === 1 ? 'bilet' : 'bilete'} ({currentRoll.nextSerial} - {currentRoll.serialTo})
          </p>
        ) : (
          <p className="field__error">Nu există bilete disponibile la casa de bilete</p>
        )}
        {currentRoll && ticketNumber > currentRoll.remaining && (
          <p className="field__error">{rollErrorMessage}</p>
        )}
      </div>

      <div className="modal__summary modal__summary--center">
        <strong>Total: {totalPrice()} Lei</strong>
      </div>

      <div className="modal__actions">
        <button className="btn btn--lg" onClick={handleConfirmClick} disabled={isSubmitting || isRollBlocked}>
          Confirmă
        </button>
        <button className="btn btn--secondary btn--lg" onClick={closeModal} disabled={isSubmitting}>
          Declină
        </button>
      </div>
    </Modal>
  );
};

export default ScheduleViewModal;

import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../../api/client';
import { ticketsApi } from '../../../api/ticketsApi';
import { notifyError, notifySuccess } from '../../../utils/toast';

type TicketsEntryFormProps = {
  onTicketsAdded: () => void;
};

const TicketsEntryForm: React.FC<TicketsEntryFormProps> = ({ onTicketsAdded }) => {
  const [ticketsNumber, setTicketsNumber] = useState<string>('0');
  const [firstSerial, setFirstSerial] = useState<string>('0');
  const [lastSerial, setLastSerial] = useState<string>('0');
  const [showConfirmStep, setShowConfirmStep] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const first = Number(firstSerial);
    const last = first + Number(ticketsNumber) - 1;
    const digits = firstSerial.length;

    if (last <= 0) {
      setLastSerial('0');
    } else {
      setLastSerial(String(last).padStart(digits, '0'));
    }
  }, [ticketsNumber, firstSerial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (ticketsNumber === '0') {
      notifyError('Selectați numărul de bilete primite');
      return;
    }

    setShowConfirmStep(true);
  };

  const addSerial = async () => {
    setIsSubmitting(true);

    try {
      await ticketsApi.createBatch({ firstSerial, lastSerial, ticketsNumber });

      notifySuccess('Biletele au fost adăugate cu succes!');
      onTicketsAdded();
      setFirstSerial('0');
      setLastSerial('0');
      setTicketsNumber('0');
      setShowConfirmStep(false);
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la adăugarea biletelor'));
    } finally {
      setIsSubmitting(false);
    }
  };
  if (showConfirmStep) {
    return (
      <div className="tickets__entry-form tickets__entry-form--confirm">
        <h3 className="tickets__entry-title">Confirmați primirea biletelor</h3>
        <p>Serii: <strong>{firstSerial} – {lastSerial}</strong></p>
        <p>Cantitate: <strong>{ticketsNumber} bilete</strong></p>
        <div className="tickets__entry-confirm-actions">
          <button
            className="tickets__entry-button"
            type="button"
            onClick={addSerial}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Se adaugă...' : 'Finalizează'}
          </button>
          <button
            className="tickets__entry-button tickets__entry-button--secondary"
            type="button"
            onClick={() => setShowConfirmStep(false)}
            disabled={isSubmitting}
          >
            Înapoi
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="tickets__entry-form" onSubmit={handleSubmit}>
      <h3 className="tickets__entry-title">
        Primire Bilete
      </h3>
      <div>
        <label htmlFor="tickets-number">Cantitatea biletelor primite: </label>
        <input
          type="number"
          id="tickets-number"
          value={ticketsNumber}
          min={0}
          onChange={(e) => setTicketsNumber(e.target.value)}
          onFocus={() => setTicketsNumber('')}
          onBlur={() => {
            if (ticketsNumber === '') {
              setTicketsNumber('0');
            }
          }}
        />
      </div>
      <div>
        <label htmlFor="tickets-serial">Numărul unic al primului bilet: </label>
        <input
          type="number"
          id="tickets-serial"
          value={firstSerial}
          min={0}
          onChange={(e) => setFirstSerial(e.target.value)}
          onFocus={() => setFirstSerial('')}
          onBlur={() => {
            if (firstSerial === '') {
              setFirstSerial('0');
            }
          }}
        />
      </div>
      <div>
        <label htmlFor="serial-calc">Numărul unic al ultimului bilet: </label>
        <input type="text" id="serial-calc" value={lastSerial} readOnly />
      </div>

      <button className="tickets__entry-button" type="submit">Adaugă</button>
    </form>
  );
};

export default TicketsEntryForm;

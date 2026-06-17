import './ScheduleView.scss';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../api/client';
import { salesApi } from '../../api/salesApi';
import { scheduleApi } from '../../api/scheduleApi';
import type { Sale, ScheduleItem } from '../../api/types';
import { notifyError, notifySuccess } from '../../utils/toast';
import { fetchTicketStockInfo, type TicketStockInfo } from '../../utils/remainingTickets';
import ScheduleViewModal from './ScheduleViewModal';
import ScheduleViewEditModal from './ScheduleViewEditModal';

const ScheduleView: React.FC = () => {

  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showModalEdit, setShowModalEdit] = useState<boolean>(false);
  const [selectedSpectacle, setSelectedSpectacle] = useState<ScheduleItem>({
    time: '',
    title: '',
    date: '',
    type: '',
    id: ''
  });
  const [ticketStock, setTicketStock] = useState<TicketStockInfo | null>(null);
  const [remainingLoading, setRemainingLoading] = useState<boolean>(true);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(true);
  const [soldBySchedule, setSoldBySchedule] = useState<Record<string, number>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fetchSoldTickets = async () => {
    try {
      const sales = await salesApi.getAll();
      const counts = sales.reduce<Record<string, number>>((acc, sale) => {
        const scheduleId = String(sale.schedule_id || '').trim();
        if (!scheduleId) return acc;
        acc[scheduleId] = (acc[scheduleId] || 0) + sale.quantity;
        return acc;
      }, {});

      setSoldBySchedule(counts);
    } catch {
      setSoldBySchedule({});
    }
  };

  const handleSaleComplete = async () => {
    await Promise.all([fetchRemainingTickets(), fetchSoldTickets()]);
  };

  const fetchRemainingTickets = async () => {
    setRemainingLoading(true);

    try {
      const stock = await fetchTicketStockInfo();
      setTicketStock(stock);
    } catch {
      setTicketStock(null);
    } finally {
      setRemainingLoading(false);
    }
  };

  const scheduleList = async () => {
    setScheduleLoading(true);

    try {
      const data = await scheduleApi.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sorted = data.sort((a: ScheduleItem, b: ScheduleItem) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      const filtered = sorted.filter((item: ScheduleItem) => {
        const itemDate = new Date(item.date);
        return itemDate >= today;
      });
      setScheduleData(filtered);
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la încărcarea afișei'));
    } finally {
      setScheduleLoading(false);
    }
  }
  useEffect(() => {
    scheduleList();
    fetchRemainingTickets();
    fetchSoldTickets();
  }, []);

  const editSpectacle = async (title: string, id: string, type: string) => {
    try {
      await scheduleApi.update(id, { title, type });
      notifySuccess('Spectacolul a fost editat');
      scheduleList();
      setShowModalEdit(false);
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la editarea spectacolului'));
    }
  }

  const removeSpectacle = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }

    try {
      const sales = await salesApi.getAll();

      const findSale = sales.filter((item: Sale) => item.schedule_id === id);

      if (findSale.length > 0) {
        notifyError('Nu puteți șterge spectacolul: există deja vânzări pentru acest spectacol.');
        setPendingDeleteId(null);
        return;
      }

      await scheduleApi.remove(id);
      setScheduleData(prev => prev.filter(item => item.id !== id));
      notifySuccess('Spectacolul a fost șters');
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la ștergere'));
    } finally {
      setPendingDeleteId(null);
    }
  }

  const formateDate = (date: string): string => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }



  return (
    <div className='program'>
      <h2 className='program__title'>Program</h2>
      <div
        className={`program__stock ${
          ticketStock?.currentRoll && ticketStock.currentRoll.remaining < 50 ? 'program__stock--low' : ''
        }`}
      >
        {remainingLoading ? (
          <p>Se încarcă stocul de bilete...</p>
        ) : ticketStock === null ? (
          <p>Stoc bilete indisponibil</p>
        ) : (
          <>
            <p>
              Rămase la casă: {ticketStock.remaining}{' '}
              {ticketStock.remaining === 1 ? 'bilet' : 'bilete'}
            </p>
            {ticketStock.currentRoll ? (
              <p className="program__stock-roll">
                În rolă curentă: {ticketStock.currentRoll.remaining}{' '}
                {ticketStock.currentRoll.remaining === 1 ? 'bilet' : 'bilete'}{' '}
                ({ticketStock.currentRoll.nextSerial} – {ticketStock.currentRoll.serialTo})
              </p>
            ) : (
              <p className="program__stock-roll">Nicio rolă activă</p>
            )}
          </>
        )}
      </div>
      {showModal && (
        <ScheduleViewModal
          selectedSpectacle={selectedSpectacle}
          setShowModal={setShowModal}
          currentRoll={ticketStock?.currentRoll ?? null}
          onSaleComplete={handleSaleComplete}
        />
      )}
      {showModalEdit && <ScheduleViewEditModal selectedSpectacle={selectedSpectacle} setShowModalEdit={setShowModalEdit} onConfirm={editSpectacle} />}
      {scheduleLoading ? (
        <p className="app-status app-status--loading">Se încarcă programul...</p>
      ) : (
      <ul className="program__list">
        {scheduleData.map(item => {
          const soldCount = soldBySchedule[item.id] ?? 0;
          const isPendingDelete = pendingDeleteId === item.id;

          return (
            <li className="program__item" key={item.id} onClick={() => (setShowModal(true), setSelectedSpectacle(item))}>
              <h3 className="program__item-title">{item.title} <span>{item.type === 'Premiera' ? '(Premiera)' : ''}</span></h3>
              <div className='program__item-info'>
                <div className='program__item-time'>Ora: {item.time}</div>
                <div className="program__item-date">Data: {formateDate(item.date)}</div>
                <div className="program__item-sold">
                  Vândute: {soldCount} {soldCount === 1 ? 'bilet' : 'bilete'}
                </div>
                <button className='program__item-button' onClick={(e) => (e.stopPropagation(), setShowModalEdit(true), setSelectedSpectacle(item))}>Editează</button>
                <button
                  className={`program__item-button ${isPendingDelete ? 'program__item-button--confirm' : ''}`}
                  onClick={(e) => (e.stopPropagation(), removeSpectacle(item.id))}
                >
                  {isPendingDelete ? 'Confirmați?' : 'Șterge'}
                </button>
                {isPendingDelete && (
                  <button
                    className="program__item-button program__item-button--cancel"
                    onClick={(e) => (e.stopPropagation(), setPendingDeleteId(null))}
                  >
                    Anulează
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      )}
    </div>
  )
}

export default ScheduleView;

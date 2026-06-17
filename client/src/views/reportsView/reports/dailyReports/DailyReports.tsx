import { useState, useEffect } from "react";
import EmptyState from '../../../../components/emptyState/EmptyState';
import { scheduleApi } from '../../../../api/scheduleApi';
import type { Sale, ScheduleItem } from '../../../../api/types';
import { generateDailyReportPDF } from '../../../../utils/generateDailyReportPDF';
import type { DailyReportData } from "../../../../utils/generateDailyReportPDF";
import './DailyReports.scss';


interface DailyReportsProps {
  sales: Sale[]
};

const DailyReports: React.FC<DailyReportsProps> = ({ sales }) => {


  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [schedulesMap, setSchedulesMap] = useState<Record<string, {date: string, time?: string}>>({});

  useEffect(() => {
    // fetch schedules once and build a map schedule_id -> date (YYYY-MM-DD)
    let mounted = true;
    scheduleApi.getAll()
      .then((rows: ScheduleItem[]) => {
        if (!mounted) return;
        const m: Record<string, {date: string, time?: string}> = {};
        for (const r of rows) {
          if (r.id && r.date) {
            const key = String(r.id).trim();
            m[key] = { date: String(r.date), time: r.time ? String(r.time) : undefined };
          }
        }
        setSchedulesMap(m);
      })
      .catch(err => {
        // ignore silently for now
        console.error('Failed to fetch schedules', err);
      });
    return () => { mounted = false };
  }, []);

  const filteredSales = sales.filter(item => {
    const salesDate = new Date(item.created_at.replace(' ', 'T'));
    if (isNaN(salesDate.getTime())) return false;
    const formatedDate = salesDate.toISOString().slice(0, 10);
    return formatedDate === selectedDate;
  });


  const cashSales = filteredSales.filter(sale => sale.payment_method === 'cash');
  const cardSales = filteredSales.filter(sale => sale.payment_method === 'card');

  const premieraSales = filteredSales.filter(item => item.type === 'Premiera');
  const standartSales = filteredSales.filter(item => item.type === 'Standart');
  const specialSales = filteredSales.filter(item => item.type === 'Special');

  const premieraTickets = premieraSales.reduce((sum, s) => sum + s.quantity, 0);
  const standartTickets = standartSales.reduce((sum, s) => sum + s.quantity, 0);
  const specialTickets = specialSales.reduce((sum, s) => sum + s.quantity, 0);

  const totalCashTickets = cashSales.reduce((sum, s) => sum + s.quantity, 0);
  const totalCashAmount = cashSales.reduce((sum, s) => sum + s.total_sum, 0);

  const totalCardTickets = cardSales.reduce((sum, s) => sum + s.quantity, 0);
  const totalCardAmount = cardSales.reduce((sum, s) => sum + s.total_sum, 0);

  const totalTickets = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
  const totalAmount = filteredSales.reduce((sum, s) => sum + s.total_sum, 0);

  const formatScheduleLabel = (scheduleId: string) => {
    const sched = schedulesMap[String(scheduleId || '').trim()];
    if (!sched?.date) return '';
    const parts = String(sched.date).split('-');
    const datePart = parts.length >= 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : sched.date;
    const timePart = sched.time ? ` ${String(sched.time).split(':').slice(0, 2).join(':')}` : '';
    return `${datePart}${timePart}`;
  };

  const salesBySpectacle = filteredSales.reduce<
    Record<string, {
      title: string;
      scheduleLabel: string;
      tickets: number;
      amount: number;
      cashTickets: number;
      cashAmount: number;
      cardTickets: number;
      cardAmount: number;
    }>
  >((acc, sale) => {
    const key = sale.schedule_id || sale.title;
    if (!acc[key]) {
      acc[key] = {
        title: sale.title,
        scheduleLabel: sale.schedule_id ? formatScheduleLabel(sale.schedule_id) : '',
        tickets: 0,
        amount: 0,
        cashTickets: 0,
        cashAmount: 0,
        cardTickets: 0,
        cardAmount: 0,
      };
    }
    acc[key].tickets += sale.quantity;
    acc[key].amount += sale.total_sum;

    if (sale.payment_method === 'cash') {
      acc[key].cashTickets += sale.quantity;
      acc[key].cashAmount += sale.total_sum;
    } else if (sale.payment_method === 'card') {
      acc[key].cardTickets += sale.quantity;
      acc[key].cardAmount += sale.total_sum;
    }

    return acc;
  }, {});

  const spectacleSummaries = Object.values(salesBySpectacle).sort((a, b) =>
    a.title.localeCompare(b.title, 'ro')
  );

  return (
    <div className="daily report-panel">
      <label className="daily__date field">
        <span className="field__label">Selectați data</span>
        <input
          className="input input--inline daily__date-input"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </label>

      {filteredSales.length === 0 ? (
        <EmptyState
          title="Nu există vânzări în această zi"
          message={`Nu au fost înregistrate vânzări pentru ${selectedDate.split('-').reverse().join('-')}.`}
        />
      ) : (
        <>
      <div className="table-scroll">
        <table className="table table--center">
          <thead>
            <tr>
              <th>Data</th>
              <th>Spectacol</th>
              <th>Bilete</th>
              <th>Suma</th>
              <th>Metodă plată</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => {
              const sched = schedulesMap[String(sale.schedule_id || '').trim()];
              const fmtSched = (s?: {date: string, time?: string}) => {
                if (!s || !s.date) return '';
                const parts = String(s.date).split('-');
                const datePart = parts.length >= 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : s.date;
                const timePart = s.time ? ` ${String(s.time).split(':').slice(0,2).join(':')}` : '';
                return `${datePart}${timePart}`;
              };
              return (
                <tr key={sale.id}>
                  <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                  <td>{sale.title}{sched ? ` (${fmtSched(sched)})` : ''}</td>
                  <td>{sale.quantity}</td>
                  <td>{sale.total_sum} MDL</td>
                  <td>{sale.payment_method === 'cash' ? 'Numerar' : 'Card'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {spectacleSummaries.length > 0 && (
        <div className="daily__spectacle-summary">
          <h3>Vânzări pe spectacole:</h3>
          <ul className="daily__spectacle-list">
            {spectacleSummaries.map((item) => (
              <li key={`${item.title}-${item.scheduleLabel}`} className="daily__spectacle-item">
                <strong>{item.title}</strong>
                {item.scheduleLabel && <span className="daily__spectacle-time"> ({item.scheduleLabel})</span>}
                {' — '}
                {item.tickets} {item.tickets === 1 ? 'bilet' : 'bilete'} — {item.amount} MDL
                <span className="daily__spectacle-payment">
                  {' '}(numerar: {item.cashTickets} {item.cashTickets === 1 ? 'bilet' : 'bilete'} — {item.cashAmount} MDL,
                  {' '}card: {item.cardTickets} {item.cardTickets === 1 ? 'bilet' : 'bilete'} — {item.cardAmount} MDL)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="daily__summary">
        <h3>Sumar:</h3>
        <p><strong>Numerar:</strong> {totalCashTickets} bilete — {totalCashAmount} MDL</p>
        <p><strong>Card:</strong> {totalCardTickets} bilete — {totalCardAmount} MDL</p>
        <p><strong>Bilete 100 lei:</strong> {standartTickets} bilete — {standartTickets * 100} MDL</p>
        <p><strong>Bilete 150 lei:</strong> {premieraTickets} bilete — {premieraTickets * 150} MDL</p>
        <p><strong>Bilete 200 lei:</strong> {specialTickets} bilete — {specialTickets * 200} MDL</p>
        <p><strong>Total:</strong> {totalTickets} bilete — {totalAmount} MDL</p>
        <button
          className="btn"
          onClick={() => {
            const reportData: DailyReportData = {
              selectedDate,
              filteredSales,
              spectacleSummaries,
              totalCashTickets,
              totalCashAmount,
              totalCardTickets,
              totalCardAmount,
              premieraTickets,
              standartTickets,
              specialTickets,
              totalTickets,
              totalAmount
            };

            generateDailyReportPDF(reportData);
          }}
        >
          Descarcă PDF
        </button>
      </div>
        </>
      )}
    </div>
  )
}

export default DailyReports;

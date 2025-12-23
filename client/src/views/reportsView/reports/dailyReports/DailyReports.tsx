import { useState, useEffect } from "react";
import { generateDailyReportPDF } from '../../../../utils/generateDailyReportPDF';
import type { DailyReportData } from "../../../../utils/generateDailyReportPDF";
import './DailyReports.scss';

type Sale = {
  id: string;
  quantity: number;
  total_sum: number;
  payment_method: string;
  created_at: string;
  type: string;
  title: string;
  schedule_id: string
};

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
    fetch('http://localhost:5000/api/schedule')
      .then(res => res.json())
      .then((rows: any[]) => {
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


  return (
    <div className="daily">
      <h2 className="daily__title">Rapoarte zilnice</h2>
      <label className="daily__date">
        Selectati data:{" "}
        <input
          className="daily__date-input"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </label>
      <div className="daily__table-wrapper">
        <table className="daily__table">
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
      <div className="daily__summary">
        <h3>Sumar:</h3>
        <p><strong>Numerar:</strong> {totalCashTickets} bilete — {totalCashAmount} MDL</p>
        <p><strong>Card:</strong> {totalCardTickets} bilete — {totalCardAmount} MDL</p>
        <p><strong>Bilete 100 lei:</strong> {standartTickets} bilete — {standartTickets * 100} MDL</p>
        <p><strong>Bilete 150 lei:</strong> {premieraTickets} bilete — {premieraTickets * 150} MDL</p>
        <p><strong>Bilete 200 lei:</strong> {specialTickets} bilete — {specialTickets * 200} MDL</p>
        <p><strong>Total:</strong> {totalTickets} bilete — {totalAmount} MDL</p>
        <button
          className="daily__pdf-button"
          onClick={() => {
            const reportData: DailyReportData = {
              selectedDate,
              filteredSales,
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
    </div>
  )
}

export default DailyReports;
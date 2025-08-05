import { useState } from "react";
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
  title: string
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

  const premieraTickets = premieraSales.reduce((sum, s) => sum + s.quantity, 0);
  const standartTickets = standartSales.reduce((sum, s) => sum + s.quantity, 0);

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
          {filteredSales.map((sale) => (
            <tr key={sale.id}>
              <td>{new Date(sale.created_at).toLocaleDateString()}</td>
              <td>{sale.title}</td>
              <td>{sale.quantity}</td>
              <td>{sale.total_sum} MDL</td>
              <td>{sale.payment_method === 'cash' ? 'Numerar' : 'Card'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="daily__summary">
        <h3>Sumar:</h3>
        <p><strong>Numerar:</strong> {totalCashTickets} bilete — {totalCashAmount} MDL</p>
        <p><strong>Card:</strong> {totalCardTickets} bilete — {totalCardAmount} MDL</p>
        <p><strong>Bilete 100 lei:</strong> {standartTickets} bilete — {standartTickets * 100} MDL</p>
        <p><strong>bilete 150 lei:</strong> {premieraTickets} bilete — {premieraTickets * 150} MDL</p>
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
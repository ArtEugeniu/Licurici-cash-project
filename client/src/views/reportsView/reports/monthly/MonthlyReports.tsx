import './MonthlyReports.scss';
import { useState } from 'react';
import { generateMonthlyReportPDF } from '../../../../utils/generateMonthlyReportPDF';
import type { MonthlyReportData } from '../../../../utils/generateMonthlyReportPDF';


type Sale = {
  id: string;
  quantity: number;
  total_sum: number;
  payment_method: string;
  created_at: string;
  type: string;
  title: string
};

interface MonthlyReportsProps {
  sales: Sale[]
}

const MonthlyReports: React.FC<MonthlyReportsProps> = ({ sales }) => {

  const getCurrentMonth = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`
  }

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

  const filteredSales = sales.filter(item => {
    const salesMonth = new Date(item.created_at);
    const formatedMonth = salesMonth.toISOString().slice(0, 7);
    return formatedMonth === selectedMonth;
  })


  const cashSales = filteredSales.filter(item => item.payment_method === 'cash');
  const cardSales = filteredSales.filter(item => item.payment_method === 'card');

 const premieraSales = filteredSales.filter(item => item.type === 'Premiera');
  const standartSales = filteredSales.filter(item => item.type === 'Standart');
  const specialSales = filteredSales.filter(item => item.type === 'Special');

  const premieraTickets = premieraSales.reduce((sum, s) => sum + s.quantity, 0);
  const standartTickets = standartSales.reduce((sum, s) => sum + s.quantity, 0);
  const specialTickets = specialSales.reduce((sum, s) => sum + s.quantity, 0);

  const totalCashTickets = cashSales.reduce((total, tickets) => total + tickets.quantity, 0);
  const totalCardTickets = cardSales.reduce((total, tickets) => total + tickets.quantity, 0);

  const totalCashAmount = cashSales.reduce((total, sum) => total + sum.total_sum, 0);
  const totalCardAmount = cardSales.reduce((total, sum) => total + sum.total_sum, 0);

  const totalTickets = filteredSales.reduce((total, tickets) => total + tickets.quantity, 0);
  const totalAmount = filteredSales.reduce((total, tickets) => total + tickets.total_sum, 0);

  const handleDownloadPDF = () => {
  const data: MonthlyReportData = {
    selectedMonth,
    filteredSales,
    totalCashTickets,
    totalCashAmount,
    totalCardTickets,
    totalCardAmount,
    premieraTickets,
    standartTickets,
    specialTickets,
    totalTickets,
    totalAmount,
  };

  generateMonthlyReportPDF(data);
};


  return (
    <div className="monthly">
      <h2 className="monthly__title">Rapoarte lunare</h2>
      <label htmlFor="monthly">Selectati luna:{" "}</label>
      <input className='monthly__date' type="month" id='monthly' value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
      <table className='monthly__table'>
        <thead>
          <tr>
            <th className='monthly__month'>Luna</th>
            <th>Nr. bilete numerar</th>
            <th>Suma bilete numerar</th>
            <th>Nr. bilete card</th>
            <th>Suma bilete card</th>
            <th>Nr bilete 100 lei</th>
            <th>Nr bilete 150 lei</th>
            <th>Nr bilete 200 lei</th>
            <th>Nr. bilete total</th>
            <th>Suma bilete total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{selectedMonth}</td>
            <td>{totalCashTickets}</td>
            <td>{totalCashAmount}</td>
            <td>{totalCardTickets}</td>
            <td>{totalCardAmount}</td>
            <td>{standartTickets}</td>
            <td>{premieraTickets}</td>
            <td>{specialTickets}</td>
            <td>{totalTickets}</td>
            <td>{totalAmount}</td>
          </tr>
        </tbody>
      </table>
          <button className='monthly__pdf-button' onClick={handleDownloadPDF}>Descarcă PDF</button>
    </div>
  )
}

export default MonthlyReports;
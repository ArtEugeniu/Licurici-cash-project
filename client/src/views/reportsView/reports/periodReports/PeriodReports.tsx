import { useState } from 'react';
import './PeriodReports.scss';
import { generatePeriodReportPDF } from '../../../../utils/generatePeriodReportPDF';
import type { PeriodReportData } from '../../../../utils/generatePeriodReportPDF';

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

interface PerioadReportsProps {
  sales: Sale[]
};

const PeriodReports: React.FC<PerioadReportsProps> = ({ sales }) => {


  const getCurrentDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }


  const [dateFrom, setDateFrom] = useState<string>(getCurrentDate());
  const [dateTo, setDateTo] = useState<string>(getCurrentDate());

  const filteredSales = sales.filter(item => item.created_at.slice(0, 10) >= dateFrom && item.created_at.slice(0, 10) <= dateTo);

  const cashTickets = filteredSales.filter(item => item.payment_method === 'cash').reduce((acc, curr) => curr.quantity + acc, 0);
  const cashSum = filteredSales.filter(item => item.payment_method === 'cash').reduce((acc, curr) => curr.total_sum + acc, 0);

  const cardTickets = filteredSales.filter(item => item.payment_method === 'card').reduce((acc, curr) => curr.quantity + acc, 0);
  const cardSum = filteredSales.filter(item => item.payment_method === 'card').reduce((acc, curr) => curr.total_sum + acc, 0);

  const totalTickets = filteredSales.reduce((acc, curr) => curr.quantity + acc, 0);
  const totalSum = filteredSales.reduce((acc, curr) => curr.total_sum + acc, 0);

  const handleDownloadPDF = () => {
    const data: PeriodReportData = {
      startDate: dateFrom,
      endDate: dateTo,
      totalCashTickets: cashTickets,
      totalCashAmount: cashSum,
      totalCardTickets: cardTickets,
      totalCardAmount: cardSum,
      totalTickets: totalTickets,
      totalAmount: totalSum
    }

    generatePeriodReportPDF(data)
  }


  return (
    <div className="period">
      <h2 className="period__title">Raport pentru perioada</h2>
      <div className="period__dates">
        <label htmlFor="" className="period__from">
          De la: {" "}
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label htmlFor="" className="period__to">
          Pana la: {" "}
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>


      <table className="period__table">
        <thead>
          <tr>
            <th>Perioada</th>
            <th>Nr. bilete numerar</th>
            <th>Suma bilete numerar</th>
            <th>Nr. bilete card</th>
            <th>Suma bilete card</th>
            <th>Nr. bilete total</th>
            <th>Suma bilete total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{dateFrom.split('-').reverse().join('-')} - {dateTo.split('-').reverse().join('-')}</td>
            <td>{cashTickets}</td>
            <td>{cashSum}</td>
            <td>{cardTickets}</td>
            <td>{cardSum}</td>
            <td>{totalTickets}</td>
            <td>{totalSum}</td>
          </tr>
        </tbody>
      </table>
      <button className="period__pdf-button" onClick={handleDownloadPDF}>Descarca PDF</button>
    </div>
  )
};

export default PeriodReports;
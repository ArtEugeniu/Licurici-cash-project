import './SpectacleReports.scss';
import { useState } from 'react';
import { generateSpectacleReportPDF } from '../../../../utils/generateSpectacleReportPDF';
import type { SpectacleReportData } from '../../../../utils/generateSpectacleReportPDF';


type Sale = {
  id: string;
  quantity: number;
  total_sum: number;
  payment_method: string;
  created_at: string;
  type: string;
  schedule: {
    date?: string;
    title: string;
  };
};

interface SpectacleReportsProps {
  sales: Sale[]
};

const SpectacleReports: React.FC<SpectacleReportsProps> = ({ sales }) => {

  const getCurrentDate = (): string => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());

  const filteredSales = sales.filter(item => item.schedule.date === selectedDate);

  const spectacleTitle = Array.from(new Set(filteredSales.map(item => item.schedule.title))).join('');

  const cashMethod = filteredSales.filter(item => item.payment_method === 'cash');
  const cardMethod = filteredSales.filter(item => item.payment_method === 'card');

  const totalCashTickets = cashMethod.reduce((sum, s) => sum + s.quantity, 0);
  const totalCardTickets = cardMethod.reduce((sum, s) => sum + s.quantity, 0);

  const totalCashSum = cashMethod.reduce((sum, s) => sum + s.total_sum, 0);
  const totalCardSum = cardMethod.reduce((sum, s) => sum + s.total_sum, 0);

  const totalSum = filteredSales.reduce((sum, s) => sum + s.total_sum, 0);
  const totalTickets = filteredSales.reduce((sum, s) => sum + s.quantity, 0);

  const handleDownloadPDF = () => {
    const data: SpectacleReportData = {
      selectedDate,
      spectacleTitle,
      totalCashTickets,
      totalCardTickets,
      filteredSales,
      totalCashSum,
      totalCardSum,
      totalSum,
    };
    generateSpectacleReportPDF(data);
  };

  return (
    <div className='spectacle'>
      <h2 className="spectacle__title">
        Rapoarte dupa Spectacol
      </h2>
      <label className='spectacle__label' htmlFor="spectacle-date">Selectati data: </label>
      <input className='spectacle__date' type="date" id='spectacle-date' value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      {spectacleTitle !== '' ? (
        <div className='spectacle__summary'>
          <h2>{spectacleTitle} {selectedDate}</h2>
          <div>
            <p><strong>Nr. de bilete numerar:</strong> {totalCashTickets}</p>
            <p><strong>Suma pe bilete numerar:</strong> {totalCashSum} MDL</p>
            <p><strong>Nr. de bilete card:</strong> {totalCardTickets}</p>
            <p><strong>Suma pe bilete card:</strong> {totalCardSum} MDL</p>
            <p><strong>Bilete total:</strong> {totalTickets}</p>
            <p><strong>Suma totala:</strong> {totalSum} MDL</p>
          </div>
          <button className='spectacle__pdf-button' onClick={handleDownloadPDF} style={{ marginTop: '10px' }}>
            Descarcă PDF
          </button>
        </div>
      ) : (
        <h3>Nu exista spectacol pe data de {selectedDate}</h3>
      )}
    </div>
  )
}

export default SpectacleReports;
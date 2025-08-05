import './SpectacleReports.scss';
import { useEffect, useState } from 'react';
import { generateSpectacleReportPDF } from '../../../../utils/generateSpectacleReportPDF';
import type { SpectacleReportData } from '../../../../utils/generateSpectacleReportPDF';


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


  useEffect(() => {
    const getSpectacleDate = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/schedule', {
          method: 'GET'
        });

        const data = await response.json();
        setScheduleList(data);
      } catch (error) {
        alert('Eroare la primirea datei spectacolului: ' + error);
      }


    }

    getSpectacleDate()
  }, []);

  const [selectedDate, setDateFrom] = useState<string>(getCurrentDate());
  const [dateTo, setDateTo] = useState<string>(getCurrentDate());
  const [spectaclesList, setSpectaclesList] = useState<string[]>([]);
  const [selectedSpectacle, setSelectedSpectacle] = useState<string>('');
  const [scheduleList, setScheduleList] = useState<{
    date: string,
    id: string,
    type: string,
    time: string,
    title: string
  }[]>([]);

  useEffect(() => {
    const fetchSpectaclesList = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/spectacles', {
          method: 'GET'
        })

        const data = await response.json();
        setSpectaclesList(Array.from(new Set(data.map((sale: { title: string }) => sale.title))));

      } catch (error) {
        alert('Eroare la incarcarea listei spectacolelor: ' + error)
      }
    }

    fetchSpectaclesList();
  }, []);


  const filteredSales = sales.filter(sale => {
    const schedule = scheduleList.find(id => id.id === sale.schedule_id);

    return (
      schedule?.title.toLowerCase() === selectedSpectacle.toLowerCase() &&
      schedule?.date >= selectedDate &&
      schedule?.date <= dateTo
    )
  });

  useEffect(() => {
    console.log(filteredSales)

  }, [filteredSales])

  const groupedByDateAndTitle = filteredSales.reduce<
  Record<string, { tickets: number; amount: number }>
>((acc, sale) => {
  const schedule = scheduleList.find(s => s.id === sale.schedule_id);
  if (!schedule) return acc;

  const key = schedule.date;

  if (!acc[key]) {
    acc[key] = { tickets: 0, amount: 0 };
  }

  acc[key].tickets += sale.quantity;
  acc[key].amount += sale.total_sum;

  return acc;
}, {});




  const spectacleTitle = Array.from(new Set(filteredSales.map(item => item.title))).join('');

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
      <label className='spectacle__label spectacle__label-from' htmlFor="spectacle-date">Selectati data:
        <input className='spectacle__date' type="date" id='spectacle-date' value={selectedDate} onChange={(e) => setDateFrom(e.target.value)} />
      </label>
      <label className='spectacle__label spectacle__label-to' htmlFor="spectacle-date">Selectati data:
        <input className='spectacle__date' type="date" id='spectacle-date' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </label>
      <select name="" id="" value={selectedSpectacle} onChange={(e) => setSelectedSpectacle(e.target.value)}>
        {
          spectaclesList.map(item => {
            return (
              <option value={item.toLocaleLowerCase()} key={item}>{item}</option>
            )
          })
        }
      </select>
      {spectacleTitle !== '' ? (
  <div className='spectacle__summary'>
    <h2>{spectacleTitle} {selectedDate} - {dateTo}</h2>
    
    <div>
      {Object.entries(groupedByDateAndTitle).map(([date, info]) => (
        <p key={date}>
          <strong>{date}</strong>: {info.tickets} bilete — {info.amount} MDL
        </p>
      ))}
    </div>

    <hr/>

    <div>
      <p><strong>Nr. de bilete numerar:</strong> {totalCashTickets}</p>
      <p><strong>Suma pe bilete numerar:</strong> {totalCashSum} MDL</p>
      <p><strong>Nr. de bilete card:</strong> {totalCardTickets}</p>
      <p><strong>Suma pe bilete card:</strong> {totalCardSum} MDL</p>
      <p><strong>Bilete total:</strong> {totalTickets}</p>
      <p><strong>Suma totala:</strong> {totalSum} MDL</p>
    </div>

    <button
      className='spectacle__pdf-button'
      onClick={handleDownloadPDF}
      style={{ marginTop: '10px' }}
      disabled={!selectedSpectacle || selectedDate > dateTo}
    >
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
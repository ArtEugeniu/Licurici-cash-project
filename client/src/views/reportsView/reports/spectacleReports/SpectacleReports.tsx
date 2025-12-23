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

  const formatTime = (time?: string) => {
    if (!time) return '';
    const parts = time.split(':');
    return parts.slice(0, 2).join(':');
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
  const [selectedSpectacle, setSelectedSpectacle] = useState<string>('toate spectacolele');
  const [scheduleList, setScheduleList] = useState<{
    date: string,
    id: string,
    type: string,
    time: string,
    title: string
  }[]>([]);

  useEffect(() => {
    console.log(scheduleList)
  }, [scheduleList])

  useEffect(() => {
    const fetchSpectaclesList = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/spectacles', {
          method: 'GET'
        })

        const data: { title: string }[] = await response.json();
        setSpectaclesList([
          'Toate Spectacolele',
          ...Array.from(new Set(data.map((sale: { title: string }) => sale.title)))
        ]
        );

      } catch (error) {
        alert('Eroare la incarcarea listei spectacolelor: ' + error)
      }
    }

    fetchSpectaclesList();
  }, []);


  const filteredSales = sales.filter(sale => {
    const schedule = scheduleList.find(id => id.id === sale.schedule_id);

    if (!schedule) return false;

    if (selectedSpectacle === 'toate spectacolele') {
      return schedule.date >= selectedDate && schedule.date <= dateTo;
    }


    return (
      schedule.title.toLowerCase() === selectedSpectacle.toLowerCase() &&
      schedule.date >= selectedDate &&
      schedule.date <= dateTo
    )
  });

  const groupedByDateAndTitle = filteredSales.reduce<Record<
    string, {
      id: string,
      date: string,
      time?: string,
      title: string,
      card_method: number,
      card_sum: number,
      cash_method: number,
      cash_sum: number,
      total_tickets: number,
      total_sum: number
    }
  >>((acc, sale) => {
    const spectacle = scheduleList.find(presentation => presentation.id === sale.schedule_id);
    if (!spectacle) return acc;

    // group by schedule id so different shows on the same date are not merged
    const key = spectacle.id;

    if (!acc[key]) {
      acc[key] = {
        id: spectacle.id,
        date: spectacle.date,
        time: spectacle.time,
        title: spectacle.title,
        card_method: 0,
        card_sum: 0,
        cash_method: 0,
        cash_sum: 0,
        total_tickets: 0,
        total_sum: 0
      }
    };

    acc[key].card_method += sale.payment_method === 'card' ? sale.quantity : 0;
    acc[key].card_sum += sale.payment_method === 'card' ? sale.total_sum : 0;
    acc[key].cash_method += sale.payment_method === 'cash' ? sale.quantity : 0;
    acc[key].cash_sum += sale.payment_method === 'cash' ? sale.total_sum : 0;
    acc[key].total_tickets += sale.quantity;
    acc[key].total_sum += sale.total_sum;

    return acc;
  }, {})

  // Turn grouped object into an array and sort by date, time then title
  const sortedEntries = Object.values(groupedByDateAndTitle).sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    if ((a.time || '') < (b.time || '')) return -1;
    if ((a.time || '') > (b.time || '')) return 1;
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  });


  useEffect(() => {
    console.log(groupedByDateAndTitle)

  }, [groupedByDateAndTitle]);

  useEffect(() => {
    console.log(filteredSales)
  }, [filteredSales])




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
    const sortedGroupedData = Object.values(groupedByDateAndTitle)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.title < b.title ? -1 : a.title > b.title ? 1 : 0))
      .map((data) => ({
        date: data.date,
        ...data
      }));

    const data: SpectacleReportData = {
      selectedDate,
      dateTo,
      spectacleTitle,
      totalCashTickets,
      totalCardTickets,
      filteredSales,
      totalCashSum,
      totalCardSum,
      totalSum,
      groupedData: sortedGroupedData,
    };
    generateSpectacleReportPDF(data);
  };

  return (
    <div className='spectacle'>
      <h2 className="spectacle__title">
        Rapoarte dupa Spectacol
      </h2>
      <select className="spectacle__select" name="" id="" value={selectedSpectacle} onChange={(e) => setSelectedSpectacle(e.target.value)}>
        {
          spectaclesList.map(item => {
            return (
              <option value={item.toLocaleLowerCase()} key={item}>{item}</option>
            )
          })
        }
      </select>
      <label className='spectacle__label spectacle__label-from' htmlFor="spectacle-date">Data de la:
        <input className='spectacle__date' type="date" id='spectacle-date' value={selectedDate} onChange={(e) => setDateFrom(e.target.value)} />
      </label>
      <label className='spectacle__label spectacle__label-to' htmlFor="spectacle-date">Data pana la:
        <input className='spectacle__date' type="date" id='spectacle-date' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </label>

      {spectacleTitle !== '' ? (

        <>
          <table className='spectacle__table'>
            <thead>
              <tr>
                <th>Data</th>
                <th>Spectacol</th>
                <th>Nr. bilete numerar</th>
                <th>Suma bilete numerar</th>
                <th>Nr. bilete card</th>
                <th>Suma bilete card</th>
                <th>Nr. total bilete</th>
                <th>Suma totala</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((data) => {
                return (
                  <tr key={data.id}>
                    <td>{data.date.split('-').reverse().join('-')} {formatTime(data.time)}</td>
                    <td>{data.title}</td>
                    <td>{data.cash_method}</td>
                    <td>{data.cash_sum}</td>
                    <td>{data.card_method}</td>
                    <td>{data.card_sum}</td>
                    <td>{data.total_tickets}</td>
                    <td>{data.total_sum}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>


          <div className='spectacle__summary'>


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
        </>
      ) : (
        <h3>Nu au fost gasite spectacole pentru perioada {selectedDate.split('-').reverse().join('-')} - {dateTo.split('-').reverse().join('-')}</h3>
      )}
    </div>
  )
}

export default SpectacleReports;
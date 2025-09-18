import './TicketsReport.scss';
import { useEffect, useState } from 'react';

type TicketReportItem = {
  serial_number: string;
  spectacle: string;
  type: string
  payment_method: string;
  created_at: string;
  price?: number
};

const TicketsReport: React.FC = () => {

  const [report, setReport] = useState<TicketReportItem[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const getDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dayTo = (date.getDate() + 1).toString().padStart(2, '0');

    setStartDate(`${year}-${month}-${day}`);
    setEndDate(`${year}-${month}-${dayTo}`);
  }

  const firstSerial = report.length > 0 ? report[0].serial_number : '';
  const lastSerial = report.length > 0 ? report[report.length - 1].serial_number : '';
  const totalTickets = report.length;

  const getPrice = (type: string) => {
    switch (type) {
      case 'Standart':
        return 100;
      case 'Premiera':
        return 150;
    }
  }

  const fetchReport = async () => {

    if (!startDate || !endDate) return;

    try {
      const res = await fetch(`http://localhost:5000/api/ticketsReport?startDate=${startDate}&endDate=${endDate}`);

      const data = await res.json();

      const formattedData = data.map((item: any) => ({
        ...item,
        price: getPrice(item.type),
      }));

      console.log(formattedData)

      setReport(formattedData);
    } catch (error) {
      alert('Eroare la preluarea raportului epntru bilete')
    }
  }

  useEffect(() => {
    getDate();
  }, []);

  useEffect(() => {
    fetchReport()
  }, [startDate, endDate])

  return (
    <div className='ticketsReport'>
      <h2 className='ticketsReport__title'>Raport pe Bilete</h2>
      <div className="ticketsReport__filters">
        <label>
          De la:
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </label>
        <label>
          Până la:
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </label>
      </div>
      <div className='ticketsReport__table-wrapper'>
        <table className="ticketsReport__table">
          <thead>
            <tr>
              <th>Nr. Serie</th>
              <th>Spectacol</th>
              <th>Preț</th>
              <th>Metodă plată</th>
              <th>Data vânzării</th>
            </tr>
          </thead>
          <tbody>
            {report.map(item => (
              <tr key={item.serial_number + item.created_at}>
                <td>{item.serial_number}</td>
                <td>{item.spectacle}</td>
                <td>{item.price}</td>
                <td>{item.payment_method}</td>
                <td>{item.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
      <div className="ticketsReport__summary">
        <p>Primul numar de serie: {firstSerial}</p>
        <p>ultimul numar de serie: {lastSerial}</p>
        <p>Total bilete: {totalTickets}</p>
      </div>
    </div>
  )
}

export default TicketsReport;
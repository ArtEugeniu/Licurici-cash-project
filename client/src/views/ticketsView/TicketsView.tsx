import { useState, useEffect } from 'react';
import './TicketsView.scss';
import TicketsReport from './ticketsReport/TicketsReport';

interface TicketEntry {
  id: string;
  number_from: string;
  number_to: string;
  total_tickets: number;
  created_at: string;
}

const TicketsView: React.FC = () => {

  const [ticketsNumber, setTicketsNumber] = useState<string>('0');
  const [firstSerial, setFirstSerial] = useState<string>('0');
  const [lastSerial, setLastSerial] = useState<string>('0');
  const [ticketsInList, setTicketInList] = useState<TicketEntry[]>([]);

  useEffect(() => {

    const first = Number(firstSerial);
    const last = first + Number(ticketsNumber) - 1;

    const digits = firstSerial.length;

    if (last <= 0) {
      setLastSerial('0')
    } else {
      setLastSerial(String(last).padStart(digits, '0'));
    }
  }, [ticketsNumber, firstSerial]);

  const fetchTicketsIn = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tickets_in');
      const data = await response.json();
      setTicketInList(data);
    } catch (error) {
      console.error('Eroare la preluarea biletelor:', error);
    }
  }


  const addSerial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ticketsNumber === '0') {
      alert('Selectati numarul de bilete primite');
      return
    }

    const confirmAdd = window.confirm(
      `Sigur doriți să adăugați biletele cu serii ${firstSerial} - ${lastSerial}?`
    );
    if (!confirmAdd) return;

    try {

      const response = await fetch('http://localhost:5000/api/tickets_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstSerial, lastSerial, ticketsNumber })
      });

      const data = await response.json();

      if (!response.ok) {
        return alert(`Eroare: ${data.error}`);
      }

      const serialResp = await fetch('http://localhost:5000/api/ticket_serial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!serialResp.ok) {
        const serialData = await serialResp.json();
        return alert(`Eroare la ticket_serial: ${serialData.error}`);
      }

      alert('Biletele si ticket_serial adaugate cu succes!');
      fetchTicketsIn();
      setFirstSerial('0');
      setLastSerial('0');
      setTicketsNumber('0');

    } catch (err) {
      alert(err);
    }
  };



  useEffect(() => {
    fetchTicketsIn();
  }, []);




  return (
    <div className='tickets'>
      <h2 className="tickets__title">
        Rapoarte Bilete
      </h2>

      <form className="tickets__entry-form">
        <h3 className="tickets__entry-title">
          Primire Bilete
        </h3>
        <div>
          <label htmlFor="tickets-number">Cantitatea biletelor primite: </label>
          <input
            type="number"
            id='tickets-number'
            value={ticketsNumber}
            min={0}
            onChange={(e) => setTicketsNumber(e.target.value)}
            onFocus={() => setTicketsNumber('')}
            onBlur={() => {
              if (ticketsNumber === '') {
                setTicketsNumber('0')
              }
            }}
          />
        </div>
        <div>
          <label htmlFor="tickets-serial">Numarul unic al primului bilet: </label>
          <input
            type="number"
            id='tickets-serial'
            value={firstSerial}
            min={0}
            onChange={(e) => setFirstSerial(e.target.value)}
            onFocus={() => setFirstSerial('')}
            onBlur={() => {
              if (firstSerial === '') {
                setFirstSerial('0')
              }
            }}
          />
        </div>
        <div>
          <label htmlFor="serial-calc">Numarul unic al ultimului bilet: </label>
          <input type="text" id='serial-calc' value={lastSerial} />
        </div>

        <button className='tickets__entry-button' onClick={addSerial}>Adaugă</button>
      </form>

      <div className="tickets__entry-report">
        <table className="tickets__entry-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Număr de serie de la</th>
              <th>Număr de serie pana la</th>
              <th>Numărul de Bilete</th>
            </tr>
          </thead>
          <tbody>
            {ticketsInList.map(ticket => {
              return (
                <tr key={ticket.id}>
                  <td>{
                    ticket.created_at
                      .split(" ")[0]
                      .split("-")
                      .reverse()
                      .join("-")
                  }</td>
                  <td>{ticket.number_from}</td>
                  <td>{ticket.number_to}</td>
                  <td>{ticket.total_tickets}</td>
                </tr>
              )
            })}

          </tbody>
        </table>
      </div>

      <TicketsReport />

    </div>
  )
}

export default TicketsView;
import { useState, useEffect } from 'react';
import './TicketsView.scss';
import TicketsReport from './ticketsReport/TicketsReport';
import { generateTicketsPeriodReportPDF } from '../../utils/generateTicketsPeriodReportPDF';

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
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

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

  // Report preview state
  const [reportData, setReportData] = useState<any | null>(null);

  const fetchPeriodReport = async (from: string, to: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reports/tickets_period?startDate=${from}&endDate=${to}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Eroare la preluarea raportului');
        return null;
      }

      const data = await res.json();
      setReportData(data);
      return data;
    } catch (err) {
      console.error('Error fetching period report', err);
      alert('Eroare la preluarea raportului');
      return null;
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

      <div className="tickets__report-period">
        <h3>Raport pe perioada</h3>
        <div className="period__dates">
          <label>
            De la: <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label>
            Pana la: <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
        </div>
        <div className="period__actions">
          <button
            className="period__preview-button"
            onClick={async () => {
              await fetchPeriodReport(dateFrom, dateTo);
            }}
          >Arată raport</button>

          <button
            className="period__pdf-button"
            onClick={async () => {
              try {
                // If we already have the report data from preview, reuse it
                let data = reportData;
                if (!data) {
                  const res = await fetch(`http://localhost:5000/api/reports/tickets_period?startDate=${dateFrom}&endDate=${dateTo}`);
                  if (!res.ok) {
                    const err = await res.json();
                    alert(err.error || 'Eroare la generarea raportului');
                    return;
                  }
                  data = await res.json();
                }

                generateTicketsPeriodReportPDF(data);
              } catch (error) {
                alert('Eroare la descărcarea raportului: ' + error);
              }
            }}
          >Descarca PDF</button>
        </div>
      </div>

      {/* Preview table for the period report */}
      {reportData && reportData.dailyRows && (
        <div className="tickets__report-preview">
          <h4>Preview raport (doar zile cu încasări)</h4>
          <table className="tickets__report-preview-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Primite</th>
                <th>100 numerar</th>
                <th>100 card</th>
                <th>150 numerar</th>
                <th>150 card</th>
                <th>200 numerar</th>
                <th>200 card</th>
                <th>Vandute</th>
                <th>Suma</th>
              </tr>
            </thead>
            <tbody>
              {reportData.dailyRows.map((r: any) => (
                <tr key={r.date}>
                  <td>{r.date.split('-').reverse().join('-')}</td>
                  <td>{r.tickets_received}</td>
                  <td>{r.sold_100_cash}</td>
                  <td>{r.sold_100_card}</td>
                  <td>{r.sold_150_cash}</td>
                  <td>{r.sold_150_card}</td>
                  <td>{r.sold_200_cash}</td>
                  <td>{r.sold_200_card}</td>
                  <td>{r.sold_total}</td>
                  <td>{r.amount_total} MDL</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="tickets__report-preview-summary">
            <p>Primite total: {reportData.totals.received_total}</p>
            <p>Bilete vandute total: {reportData.totals.sold_total}</p>
            <p>Suma totală: {reportData.totals.amount_total} MDL</p>
            <p>Rămas la casă: {reportData.totals.remaining_on_box} bilete</p>
          </div>
        </div>
      )}

      <TicketsReport />

    </div>
  )
}

export default TicketsView;
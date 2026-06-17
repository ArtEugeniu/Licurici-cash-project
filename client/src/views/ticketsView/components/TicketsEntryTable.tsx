import type { TicketEntry } from '../types';

type TicketsEntryTableProps = {
  ticketsInList: TicketEntry[];
};

const formatDate = (date: string) => {
  return date
    .split(' ')[0]
    .split('-')
    .reverse()
    .join('-');
};

const TicketsEntryTable: React.FC<TicketsEntryTableProps> = ({ ticketsInList }) => {
  return (
    <div className="table-scroll tickets__entry-report">
      <table className="table table--center">
        <thead>
          <tr>
            <th>Data</th>
            <th>Număr de serie de la</th>
            <th>Număr de serie până la</th>
            <th>Numărul de Bilete</th>
          </tr>
        </thead>
        <tbody>
          {ticketsInList.map(ticket => {
            return (
              <tr key={ticket.id}>
                <td>{formatDate(ticket.created_at)}</td>
                <td>{ticket.number_from}</td>
                <td>{ticket.number_to}</td>
                <td>{ticket.total_tickets}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TicketsEntryTable;

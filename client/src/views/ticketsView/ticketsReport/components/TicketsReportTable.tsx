import type { TicketReportItem } from '../types';

type TicketsReportTableProps = {
  report: TicketReportItem[];
};

const TicketsReportTable: React.FC<TicketsReportTableProps> = ({ report }) => {
  return (
    <div className="table-scroll">
      <table className="table table--center">
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
  );
};

export default TicketsReportTable;

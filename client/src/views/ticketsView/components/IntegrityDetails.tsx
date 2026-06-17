import type { IntegrityResult } from '../types';

type IntegrityDetailsProps = {
  integrityResult: IntegrityResult;
  expandedIntegrityKey: string;
};

const formatTicketRange = (batch: any) => {
  return `${batch.number_from}-${batch.number_to} (${batch.total_tickets})`;
};

const IntegrityDetails: React.FC<IntegrityDetailsProps> = ({ integrityResult, expandedIntegrityKey }) => {
  const rows = integrityResult.details[expandedIntegrityKey] || [];
  if (rows.length === 0) return null;

  if (expandedIntegrityKey === 'overlappingTicketRanges') {
    return (
      <table className="tickets__integrity-details-table">
        <thead>
          <tr>
            <th>Lot 1</th>
            <th>Interval 1</th>
            <th>Lot 2</th>
            <th>Interval 2</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${expandedIntegrityKey}-${index}`}>
              <td>{row.first.id}</td>
              <td>{formatTicketRange(row.first)}</td>
              <td>{row.second.id}</td>
              <td>{formatTicketRange(row.second)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (expandedIntegrityKey === 'salesSerialMismatches') {
    return (
      <table className="tickets__integrity-details-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Vânzare</th>
            <th>Spectacol</th>
            <th>Bilete</th>
            <th>Serii</th>
            <th>Diferență</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.created_at}</td>
              <td>{row.id}</td>
              <td>{row.title || '-'}</td>
              <td>{row.quantity}</td>
              <td>{row.serial_rows}</td>
              <td>{row.difference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (expandedIntegrityKey === 'orphanTicketSales') {
    return (
      <table className="tickets__integrity-details-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vânzare</th>
            <th>Lot</th>
            <th>Serie</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.sale_id}</td>
              <td>{row.batch_id}</td>
              <td>{row.serial_number}</td>
              <td>{row.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (expandedIntegrityKey === 'duplicateSerials') {
    return (
      <table className="tickets__integrity-details-table">
        <thead>
          <tr>
            <th>Lot</th>
            <th>Serie</th>
            <th>Dubluri</th>
            <th>Vânzări</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.batch_id}-${row.serial_number}`}>
              <td>{row.batch_id}</td>
              <td>{row.serial_number}</td>
              <td>{row.count}</td>
              <td>{row.sale_ids}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (expandedIntegrityKey === 'batchesWithoutSerialPointer' || expandedIntegrityKey === 'invalidTicketRanges') {
    return (
      <table className="tickets__integrity-details-table">
        <thead>
          <tr>
            <th>Lot</th>
            <th>Interval</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{formatTicketRange(row)}</td>
              <td>{row.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (expandedIntegrityKey === 'serialPointersWithoutBatch') {
    return (
      <table className="tickets__integrity-details-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Lot</th>
            <th>Serie curentă</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.batch_id}</td>
              <td>{row.current_serial_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return null;
};

export default IntegrityDetails;

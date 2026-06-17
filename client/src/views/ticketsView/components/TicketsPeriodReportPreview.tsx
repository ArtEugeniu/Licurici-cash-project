import type { TicketsPeriodReportData } from './ticketsPeriodReportTypes';

type TicketsPeriodReportPreviewProps = {
  data: TicketsPeriodReportData | null;
  loading: boolean;
  error: string;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length >= 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return value;
};

const formatRange = (from?: string, to?: string) => {
  if (!from && !to) return '';
  if (from === to) return from || '';
  return `${from || ''}-${to || ''}`;
};

const formatMonthBreakdown = (rows?: { month: string; count: number }[]) => {
  if (!rows || rows.length === 0) return '';
  return rows.map(row => `${row.month}: ${row.count}`).join(', ');
};

const formatAmountBreakdown = (
  rows: { month: string; cash: number; card: number }[] | undefined,
  field: 'cash' | 'card'
) => {
  if (!rows || rows.length === 0) return '';
  return rows
    .filter(row => row[field] > 0)
    .map(row => `${row.month}: ${row[field]} MDL`)
    .join(', ');
};

const TicketsPeriodReportPreview: React.FC<TicketsPeriodReportPreviewProps> = ({ data, loading, error }) => {
  if (loading) {
    return <p className="tickets__period-preview-message">Se încarcă previzualizarea...</p>;
  }

  if (error) {
    return <p className="tickets__period-preview-error">{error}</p>;
  }

  if (!data) return null;

  const beginningInventory = data.meta?.beginning_inventory || 0;
  const totalAtBox = beginningInventory + (data.totals.received_total || 0);
  const soldByMonth = formatMonthBreakdown(data.sales_by_month);
  const cashByMonth = formatAmountBreakdown(data.sales_amount_by_month, 'cash');
  const cardByMonth = formatAmountBreakdown(data.sales_amount_by_month, 'card');
  const remainingSerials = data.remaining_serials || [];

  return (
    <div className="tickets__period-preview">
      <h4 className="tickets__period-preview-title">Previzualizare PDF</h4>

      <div className="tickets__period-preview-table-wrapper">
        <table className="tickets__period-preview-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Seria de la</th>
              <th>Seria până la</th>
              <th>Bilete</th>
            </tr>
          </thead>
          <tbody>
            {data.beginning_serials_by_month?.map((monthRow) => (
              monthRow.ranges.length > 0
                ? monthRow.ranges.map((range, index) => (
                  <tr key={`${monthRow.month}-${range.from}-${range.to}`}>
                    <td>{index === 0 ? `Stoc inițial ${monthRow.month}` : ''}</td>
                    <td>{range.from}</td>
                    <td>{range.to}</td>
                    <td>{range.count}</td>
                  </tr>
                ))
                : (
                  <tr key={`${monthRow.month}-empty`}>
                    <td>{`Stoc inițial ${monthRow.month}`}</td>
                    <td></td>
                    <td></td>
                    <td>0</td>
                  </tr>
                )
            ))}

            {!data.beginning_serials_by_month?.length && (
              <tr>
                <td>Stoc inițial</td>
                <td></td>
                <td></td>
                <td>{beginningInventory}</td>
              </tr>
            )}

            {data.dailyRows.map((row) => (
              <tr key={`${row.id || row.date}-${row.number_from}-${row.number_to}`}>
                <td>{formatDate(row.date)}</td>
                <td>{row.number_from || ''}</td>
                <td>{row.number_to || ''}</td>
                <td>{row.tickets_received}</td>
              </tr>
            ))}

            <tr className="tickets__period-preview-total-row">
              <td>Total la casă în perioadă</td>
              <td></td>
              <td></td>
              <td>{totalAtBox}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="tickets__period-preview-table-wrapper">
        <table className="tickets__period-preview-table">
          <thead>
            <tr>
              <th>Tip / Metodă</th>
              <th>Bilete</th>
              <th>Suma</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>100 numerar</td>
              <td>{data.totals.sold_100_cash}</td>
              <td>{data.totals.sold_100_cash * 100} MDL</td>
            </tr>
            <tr>
              <td>100 card</td>
              <td>{data.totals.sold_100_card}</td>
              <td>{data.totals.sold_100_card * 100} MDL</td>
            </tr>
            <tr>
              <td>150 numerar</td>
              <td>{data.totals.sold_150_cash}</td>
              <td>{data.totals.sold_150_cash * 150} MDL</td>
            </tr>
            <tr>
              <td>150 card</td>
              <td>{data.totals.sold_150_card}</td>
              <td>{data.totals.sold_150_card * 150} MDL</td>
            </tr>
            <tr>
              <td>200 numerar</td>
              <td>{data.totals.sold_200_cash}</td>
              <td>{data.totals.sold_200_cash * 200} MDL</td>
            </tr>
            <tr>
              <td>200 card</td>
              <td>{data.totals.sold_200_card}</td>
              <td>{data.totals.sold_200_card * 200} MDL</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="tickets__period-preview-summary">
        <p>Total primite: {data.totals.received_total} bilete</p>
        <p>
          Total bilete vândute: {data.totals.sold_total} bilete
          {soldByMonth && ` (${soldByMonth})`}
        </p>
        <p>
          Suma (numerar): {data.totals.amount_cash || 0} MDL
          {cashByMonth && ` (${cashByMonth})`}
        </p>
        <p>
          Suma (card): {data.totals.amount_card || 0} MDL
          {cardByMonth && ` (${cardByMonth})`}
        </p>
        <p>Suma totală: {data.totals.amount_total} MDL</p>
        <p>Rămase la casă: {data.totals.remaining_on_box} bilete</p>
        <p>
          Serii rămase la casă (actual):{' '}
          {remainingSerials.length > 0
            ? remainingSerials.map(range => formatRange(range.from, range.to)).join(', ')
            : 'Nicio serie rămasă.'}
        </p>
      </div>
    </div>
  );
};

export default TicketsPeriodReportPreview;

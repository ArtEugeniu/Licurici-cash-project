import type { TicketsPeriodReportData } from './types';

export const buildInventoryRows = (data: TicketsPeriodReportData) => {
  const { dailyRows, totals, meta } = data;
  const rows: string[][] = [];

  if (data.beginning_serials_by_month?.length) {
    for (const month of data.beginning_serials_by_month) {
      const monthLabel = month.month || month.ym || '';
      const ranges = month.ranges || [];

      if (!ranges.length) {
        rows.push([`Stoc inițial ${monthLabel}`, '', '', '0']);
      } else {
        rows.push([`Stoc inițial ${monthLabel}`, String(ranges[0].from), String(ranges[0].to), String(ranges[0].count)]);

        for (let i = 1; i < ranges.length; i++) {
          rows.push(['', String(ranges[i].from), String(ranges[i].to), String(ranges[i].count)]);
        }
      }
    }
  } else if (meta && (meta.beginning_inventory || meta.beginning_inventory === 0)) {
    rows.push(['Stoc inițial', '', '', String(meta.beginning_inventory)]);
  }

  for (const row of dailyRows) {
    const date = row.date ? row.date.split('-').reverse().join('-') : '';
    rows.push([
      date,
      String(row.number_from || ''),
      String(row.number_to || ''),
      String(row.tickets_received),
    ]);
  }

  const beginning = meta?.beginning_inventory ? Number(meta.beginning_inventory) : 0;
  const totalAtBox = beginning + (totals.received_total || 0);
  rows.push(['Total la casă în perioadă', '', '', String(totalAtBox)]);

  return rows;
};

export const buildSalesRows = (data: TicketsPeriodReportData) => {
  const { totals } = data;

  return [
    ['100 numerar', String(totals.sold_100_cash), `${totals.sold_100_cash * 100} MDL`],
    ['100 card', String(totals.sold_100_card), `${totals.sold_100_card * 100} MDL`],
    ['150 numerar', String(totals.sold_150_cash), `${totals.sold_150_cash * 150} MDL`],
    ['150 card', String(totals.sold_150_card), `${totals.sold_150_card * 150} MDL`],
    ['200 numerar', String(totals.sold_200_cash), `${totals.sold_200_cash * 200} MDL`],
    ['200 card', String(totals.sold_200_card), `${totals.sold_200_card * 200} MDL`],
  ];
};

export const buildSummaryLines = (data: TicketsPeriodReportData) => {
  const { totals } = data;
  const lines = [`Total primite: ${totals.received_total} bilete`];
  const salesByMonth = data.sales_by_month || [];

  let soldLine = `Total bilete vândute: ${totals.sold_total} bilete`;
  if (salesByMonth.length) {
    soldLine += ` (${salesByMonth.map(row => `${row.month}: ${row.count}`).join(', ')})`;
  }
  lines.push(soldLine);

  if (typeof totals.amount_cash !== 'undefined' || typeof totals.amount_card !== 'undefined') {
    const salesAmountByMonth = data.sales_amount_by_month || [];
    const cash = totals.amount_cash || 0;
    const card = totals.amount_card || 0;

    let cashLine = `Suma (numerar): ${cash} MDL`;
    const cashParts = salesAmountByMonth
      .filter(row => row.cash && row.cash > 0)
      .map(row => `${row.month}: ${row.cash} MDL`);
    if (cashParts.length) cashLine += ` (${cashParts.join(', ')})`;
    lines.push(cashLine);

    let cardLine = `Suma (card): ${card} MDL`;
    const cardParts = salesAmountByMonth
      .filter(row => row.card && row.card > 0)
      .map(row => `${row.month}: ${row.card} MDL`);
    if (cardParts.length) cardLine += ` (${cardParts.join(', ')})`;
    lines.push(cardLine);
  }

  lines.push(`Suma totală: ${totals.amount_total} MDL`);
  lines.push(`Rămase la casă: ${totals.remaining_on_box} bilete`);

  return lines;
};

export const buildRemainingSerialsText = (data: TicketsPeriodReportData) => {
  const remaining = data.remaining_serials || [];

  if (remaining.length === 0) {
    return 'Serii rămase la casă (actual): Nicio serie rămasă.';
  }

  const parts = remaining.map(row => row.from === row.to ? row.from : `${row.from}-${row.to}`);
  return `Serii rămase la casă (actual): ${parts.join(', ')}`;
};

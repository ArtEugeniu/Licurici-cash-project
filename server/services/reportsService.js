export async function generateTicketsPeriodReport(db, startDate, endDate) {
  // tickets_in aggregation
  const ticketsInRows = await db.all(
    `SELECT date(created_at) as day, SUM(total_tickets) as tickets_received
     FROM tickets_in
     WHERE date(created_at) BETWEEN ? AND ?
     GROUP BY date(created_at)
     ORDER BY date(created_at) ASC`,
    [startDate, endDate]
  );

  // sales aggregation over the entire period (single row totals)
  const salesTotals = await db.get(
    `SELECT
      SUM(CASE WHEN type='Standart' AND payment_method='cash' THEN quantity ELSE 0 END) as sold_100_cash,
      SUM(CASE WHEN type='Standart' AND payment_method='card' THEN quantity ELSE 0 END) as sold_100_card,
      SUM(CASE WHEN type='Premiera' AND payment_method='cash' THEN quantity ELSE 0 END) as sold_150_cash,
      SUM(CASE WHEN type='Premiera' AND payment_method='card' THEN quantity ELSE 0 END) as sold_150_card,
      SUM(CASE WHEN type='Special' AND payment_method='cash' THEN quantity ELSE 0 END) as sold_200_cash,
      SUM(CASE WHEN type='Special' AND payment_method='card' THEN quantity ELSE 0 END) as sold_200_card,
      SUM(quantity) as sold_total,
      SUM(total_sum) as amount_total
     FROM sales
     WHERE date(created_at) BETWEEN ? AND ?`,
    [startDate, endDate]
  ) || {};

  // compute beginning inventory (tickets available at startDate):
  // total tickets_in before startDate minus total sales before startDate
  const beforeTotals = await db.get(
    `SELECT
      IFNULL(SUM(total_tickets), 0) as tickets_in_before,
      IFNULL(SUM(quantity), 0) as sold_before
     FROM (
       SELECT total_tickets, NULL as quantity, created_at FROM tickets_in WHERE date(created_at) < ?
       UNION ALL
       SELECT NULL as total_tickets, quantity, created_at FROM sales WHERE date(created_at) < ?
     ) as combined`,
    [startDate, startDate]
  ) || { tickets_in_before: 0, sold_before: 0 };

  const beginning_inventory = (beforeTotals.tickets_in_before || 0) - (beforeTotals.sold_before || 0);
  // sold_from_prev will be computed after we know salesTotals (use salesTotals.sold_total)


  const dailyRows = [];
  const totals = {
    received_total: 0,
    sold_100_cash: 0,
    sold_100_card: 0,
    sold_150_cash: 0,
    sold_150_card: 0,
    sold_200_cash: 0,
    sold_200_card: 0,
    sold_total: 0,
    amount_total: 0,
  };

  for (const entry of ticketsInRows) {
    const day = entry.day;
    const received = entry.tickets_received || 0;

    dailyRows.push({
      date: day,
      tickets_received: received,
    });

    totals.received_total += received;
  }

  // Fill totals with salesTotals (aggregated over the whole period)
  totals.sold_100_cash = salesTotals.sold_100_cash || 0;
  totals.sold_100_card = salesTotals.sold_100_card || 0;
  totals.sold_150_cash = salesTotals.sold_150_cash || 0;
  totals.sold_150_card = salesTotals.sold_150_card || 0;
  totals.sold_200_cash = salesTotals.sold_200_cash || 0;
  totals.sold_200_card = salesTotals.sold_200_card || 0;
  totals.sold_total = salesTotals.sold_total || 0;
  totals.amount_total = salesTotals.amount_total || 0;

  // remaining on box should account for beginning inventory + received during period - sold during period
  totals.remaining_on_box = (beginning_inventory || 0) + totals.received_total - totals.sold_total;

  // Extra fields for the client report layout
  const sold_from_prev = Math.min(beginning_inventory > 0 ? beginning_inventory : 0, salesTotals.sold_total || 0);
  const sold_from_new = (salesTotals.sold_total || 0) - sold_from_prev;

  const meta = {
    beginning_inventory,
    sold_from_prev,
    sold_from_new,
  };

  return { startDate, endDate, dailyRows, totals, meta, generated_at: new Date().toISOString() };
}

export default generateTicketsPeriodReport;

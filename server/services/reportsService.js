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

  // sales aggregation grouped by date
  const salesRows = await db.all(
    `SELECT date(created_at) as day,
      SUM(CASE WHEN type='Standart' AND payment_method='cash' THEN quantity ELSE 0 END) as sold_100_cash,
      SUM(CASE WHEN type='Standart' AND payment_method='card' THEN quantity ELSE 0 END) as sold_100_card,
      SUM(CASE WHEN type='Premiera' AND payment_method='cash' THEN quantity ELSE 0 END) as sold_150_cash,
      SUM(CASE WHEN type='Premiera' AND payment_method='card' THEN quantity ELSE 0 END) as sold_150_card,
      SUM(CASE WHEN type='Special' AND payment_method='cash' THEN quantity ELSE 0 END) as sold_200_cash,
      SUM(CASE WHEN type='Special' AND payment_method='card' THEN quantity ELSE 0 END) as sold_200_card,
      SUM(quantity) as sold_total,
      SUM(total_sum) as amount_total
     FROM sales
     WHERE date(created_at) BETWEEN ? AND ?
     GROUP BY date(created_at)
     ORDER BY date(created_at) ASC`,
    [startDate, endDate]
  );

  const salesMap = new Map();
  for (const r of salesRows) salesMap.set(r.day, r);

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
    const sales = salesMap.get(day) || {};

    const sold_100_cash = sales.sold_100_cash || 0;
    const sold_100_card = sales.sold_100_card || 0;
    const sold_150_cash = sales.sold_150_cash || 0;
    const sold_150_card = sales.sold_150_card || 0;
    const sold_200_cash = sales.sold_200_cash || 0;
    const sold_200_card = sales.sold_200_card || 0;
    const sold_total = sales.sold_total || 0;
    const amount_total = sales.amount_total || 0;

    dailyRows.push({
      date: day,
      tickets_received: received,
      sold_100_cash,
      sold_100_card,
      sold_150_cash,
      sold_150_card,
      sold_200_cash,
      sold_200_card,
      sold_total,
      amount_total
    });

    totals.received_total += received;
    totals.sold_100_cash += sold_100_cash;
    totals.sold_100_card += sold_100_card;
    totals.sold_150_cash += sold_150_cash;
    totals.sold_150_card += sold_150_card;
    totals.sold_200_cash += sold_200_cash;
    totals.sold_200_card += sold_200_card;
    totals.sold_total += sold_total;
    totals.amount_total += amount_total;
  }

  totals.remaining_on_box = totals.received_total - totals.sold_total;

  return { startDate, endDate, dailyRows, totals, generated_at: new Date().toISOString() };
}

export default generateTicketsPeriodReport;

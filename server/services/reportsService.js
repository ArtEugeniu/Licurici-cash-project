export async function generateTicketsPeriodReport(db, startDate, endDate) {
  // tickets_in entries (keep individual receipts with serials)
  const ticketsInRows = await db.all(
    `SELECT id, number_from, number_to, total_tickets as tickets_received, created_at
     FROM tickets_in
     WHERE date(created_at) BETWEEN ? AND ?
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
      SUM(total_sum) as amount_total,
      SUM(CASE WHEN payment_method='cash' THEN total_sum ELSE 0 END) as amount_cash,
      SUM(CASE WHEN payment_method='card' THEN total_sum ELSE 0 END) as amount_card
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
    amount_cash: 0,
    amount_card: 0,
  };

  for (const entry of ticketsInRows) {
    // entry.created_at like 'YYYY-MM-DD hh:mm:ss'
    const day = String(entry.created_at).split(' ')[0];
    const received = entry.tickets_received || 0;

    dailyRows.push({
      id: entry.id,
      date: day,
      tickets_received: received,
      number_from: entry.number_from,
      number_to: entry.number_to,
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
  totals.amount_cash = salesTotals.amount_cash || 0;
  totals.amount_card = salesTotals.amount_card || 0;

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

  // Compute remaining serial ranges as of now (current DB state)
  // We'll consider two sources of sold information:
  //  - exact per-serial rows in tickets_sales
  //  - aggregated sales in sales (some old sales may not have tickets_sales entries)
  // Strategy:
  // 1) Build per-batch remaining segments from tickets_in
  // 2) Subtract exact tickets_sales serials (if any)
  // 3) Compute missing = total_sold_up_to_now - count(tickets_sales); allocate missing across batches by tickets_in.created_at (oldest first)

  const batchesAll = await db.all(`SELECT id, number_from, number_to, created_at FROM tickets_in ORDER BY datetime(created_at) ASC`);
  let maxWidth = 0;
  const perBatchSegs = new Map();
  for (const b of batchesAll) {
    const nf = Number(b.number_from);
    const nt = Number(b.number_to);
    if (isNaN(nf) || isNaN(nt) || nf > nt) continue;
    perBatchSegs.set(String(b.id), [{ from: nf, to: nt }]);
    if (b.number_from && b.number_from.length > maxWidth) maxWidth = b.number_from.length;
  }

  // subtract exact sold serials per batch
  const soldRows = await db.all(`SELECT batch_id, serial_number FROM tickets_sales ORDER BY batch_id ASC, serial_number ASC`);
  for (const r of soldRows) {
    const bid = String(r.batch_id);
    const num = Number(r.serial_number);
    if (!perBatchSegs.has(bid) || isNaN(num)) continue;
    const segs = perBatchSegs.get(bid);
    const newSegs = [];
    for (const seg of segs) {
      if (num < seg.from || num > seg.to) {
        newSegs.push(seg);
        continue;
      }
      if (num === seg.from && num === seg.to) {
        // remove whole
      } else if (num === seg.from) {
        newSegs.push({ from: seg.from + 1, to: seg.to });
      } else if (num === seg.to) {
        newSegs.push({ from: seg.from, to: seg.to - 1 });
      } else {
        newSegs.push({ from: seg.from, to: num - 1 });
        newSegs.push({ from: num + 1, to: seg.to });
      }
    }
    perBatchSegs.set(bid, newSegs);
  }

  // compute missing sold count (sales without per-serial records)
  const totalSoldRow = await db.get(`SELECT IFNULL(SUM(quantity),0) as total_sold FROM sales WHERE date(created_at) <= date('now')`);
  const ticketsSalesCountRow = await db.get(`SELECT IFNULL(COUNT(*),0) as tickets_sales_count FROM tickets_sales`);
  let missing = (totalSoldRow.total_sold || 0) - (ticketsSalesCountRow.tickets_sales_count || 0);
  if (missing < 0) missing = 0;

  // allocate missing across batches in created_at order (oldest receipts first)
  for (const b of batchesAll) {
    if (missing <= 0) break;
    const bid = String(b.id);
    const segs = perBatchSegs.get(bid) || [];
    if (!segs.length) continue;
    // consume from the start (lowest serials)
    let i = 0;
    while (i < segs.length && missing > 0) {
      const seg = segs[i];
      const segCount = seg.to - seg.from + 1;
      if (segCount <= missing) {
        // remove whole segment
        missing -= segCount;
        segs.splice(i, 1);
      } else {
        // shrink from the front
        seg.from = seg.from + missing;
        missing = 0;
        i++;
      }
    }
    perBatchSegs.set(bid, segs);
  }

  // collect all remaining segments across batches and merge contiguous ranges
  const allSegs = [];
  for (const [bid, segs] of perBatchSegs.entries()) {
    for (const s of segs) allSegs.push({ from: s.from, to: s.to });
  }
  allSegs.sort((a, b) => a.from - b.from);
  const merged = [];
  for (const seg of allSegs) {
    if (merged.length === 0) merged.push({ ...seg });
    else {
      const last = merged[merged.length - 1];
      if (seg.from <= last.to + 1) last.to = Math.max(last.to, seg.to);
      else merged.push({ ...seg });
    }
  }

  const pad = (n) => String(n).padStart(maxWidth || 1, '0');
  // Ensure the resulting remaining count matches totals.remaining_on_box (avoid off-by-one due to allocation)
  const remainingSum = merged.reduce((acc, s) => acc + (s.to - s.from + 1), 0);
  const expected = totals.remaining_on_box || 0;
  let diff = remainingSum - expected;
  if (diff > 0 && merged.length > 0) {
    // trim from the last (highest) segment
    for (let i = merged.length - 1; i >= 0 && diff > 0; i--) {
      const seg = merged[i];
      const segCount = seg.to - seg.from + 1;
      if (segCount <= diff) {
        // remove entire segment
        diff -= segCount;
        merged.splice(i, 1);
      } else {
        // shrink the end
        seg.to = seg.to - diff;
        diff = 0;
      }
    }
  }

  const remaining_serials = merged.map(s => ({ from: pad(s.from), to: pad(s.to), count: s.to - s.from + 1 }));

  // Aggregate sales by month (year-month) within the requested period so the client can render a breakdown
  // Aggregate sales by the month of the scheduled performance (schedule.date),
  // but only for sales that happened within the requested report period (sales.created_at BETWEEN startDate and endDate).
  // This ensures totals.sold_total (which is computed by sales.created_at) matches the sum of sales_by_month counts.
  const salesByMonthRows = await db.all(
    `SELECT strftime('%Y-%m', sch.date) as ym, IFNULL(SUM(sa.quantity),0) as count
     FROM sales sa
     LEFT JOIN schedule sch ON sa.schedule_id = sch.id
     WHERE date(sa.created_at) BETWEEN ? AND ?
     GROUP BY ym
     ORDER BY ym ASC`,
    [startDate, endDate]
  );
  const roMonths = [
    'ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'
  ];

  // Also aggregate amounts by month and payment method so the client can display cash/card breakdown per performance month
  const salesAmountByMonthRows = await db.all(
    `SELECT strftime('%Y-%m', sch.date) as ym, sa.payment_method as pm, IFNULL(SUM(sa.total_sum),0) as amount
     FROM sales sa
     LEFT JOIN schedule sch ON sa.schedule_id = sch.id
     WHERE date(sa.created_at) BETWEEN ? AND ?
     GROUP BY ym, pm
     ORDER BY ym ASC`,
    [startDate, endDate]
  );

  // pivot rows into objects { month: 'octombrie 2025', cash: 0, card: 0 }
  const amountByMonthMap = new Map();
  for (const r of salesAmountByMonthRows) {
    const ym = r.ym || 'unknown';
    const entry = amountByMonthMap.get(ym) || { ym, cash: 0, card: 0 };
    if (r.pm === 'cash') entry.cash = r.amount || 0;
    else if (r.pm === 'card') entry.card = r.amount || 0;
    amountByMonthMap.set(ym, entry);
  }

  const sales_amount_by_month = Array.from(amountByMonthMap.values()).map(r => {
    const [year, month] = (r.ym || '').split('-');
    const mIndex = Number(month) - 1;
    const monthLabel = (roMonths[mIndex] ? `${roMonths[mIndex]} ${year}` : r.ym);
    return { month: monthLabel, cash: r.cash || 0, card: r.card || 0 };
  });

  const sales_by_month = (salesByMonthRows || []).map(r => {
    const [year, month] = (r.ym || '').split('-');
    const mIndex = Number(month) - 1;
    const monthLabel = (roMonths[mIndex] ? `${roMonths[mIndex]} ${year}` : r.ym);
    return { month: monthLabel, count: r.count };
  });

  return { startDate, endDate, dailyRows, totals, meta, remaining_serials, sales_by_month, sales_amount_by_month, generated_at: new Date().toISOString() };
}

export default generateTicketsPeriodReport;

export async function generateTicketsPeriodReport(db, startDate, endDate) {
  const serialTrackingStartDate = '2025-10-01';

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

  // Compute remaining serial ranges from explicit serial data only.
  // Typographic gaps are naturally handled because only ranges from tickets_in exist.
  // Sales without tickets_sales rows are reported by totals, but should not silently
  // consume guessed serial numbers in the remaining-series list.

  const batchesAll = await db.all(
    `SELECT id, number_from, number_to, created_at
     FROM tickets_in
     WHERE date(created_at) >= ?
     ORDER BY datetime(created_at) ASC`,
    [serialTrackingStartDate]
  );
  let maxWidth = 0;
  const perBatchSegs = new Map();
  for (const b of batchesAll) {
    const nf = Number(b.number_from);
    const nt = Number(b.number_to);
    if (isNaN(nf) || isNaN(nt) || nf > nt) continue;
    perBatchSegs.set(String(b.id), [{ from: nf, to: nt }]);
    if (b.number_from && b.number_from.length > maxWidth) maxWidth = b.number_from.length;
  }

  // Helper to compute remaining segments as of a cutoff date (date string YYYY-MM-DD)
  async function computeRemainingSegmentsAt(cutoffDate) {
    // Build segments only from tickets_in that were received before the cutoffDate
    const batchesFiltered = batchesAll.filter(b => String(b.created_at).split(' ')[0] < cutoffDate);
    const segsMap = new Map();
    let localMaxWidth = 0;
    for (const b of batchesFiltered) {
      const nf = Number(b.number_from);
      const nt = Number(b.number_to);
      if (isNaN(nf) || isNaN(nt) || nf > nt) continue;
      segsMap.set(String(b.id), [{ from: nf, to: nt }]);
      if (b.number_from && b.number_from.length > localMaxWidth) localMaxWidth = b.number_from.length;
    }

    // subtract exact sold serials up to cutoffDate
    const soldRowsCutoff = await db.all(
      `SELECT ts.batch_id, ts.serial_number FROM tickets_sales ts JOIN sales sa ON ts.sale_id = sa.id WHERE date(sa.created_at) < ? ORDER BY ts.batch_id ASC, ts.serial_number ASC`,
      [cutoffDate]
    );
    for (const r of soldRowsCutoff) {
      const bid = String(r.batch_id);
      const num = Number(r.serial_number);
      if (!segsMap.has(bid) || isNaN(num)) continue;
      const segs = segsMap.get(bid);
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
      segsMap.set(bid, newSegs);
    }
    // collect and merge from filtered map
    const allSegsCutoff = [];
    for (const [bid, segs] of segsMap.entries()) {
      for (const s of segs) allSegsCutoff.push({ from: s.from, to: s.to });
    }
    allSegsCutoff.sort((a, b) => a.from - b.from);
    const mergedCutoff = [];
    for (const seg of allSegsCutoff) {
      if (mergedCutoff.length === 0) mergedCutoff.push({ ...seg });
      else {
        const last = mergedCutoff[mergedCutoff.length - 1];
        if (seg.from <= last.to + 1) last.to = Math.max(last.to, seg.to);
        else mergedCutoff.push({ ...seg });
      }
    }

    const pad = (n) => String(n).padStart(localMaxWidth || maxWidth || 1, '0');
    return mergedCutoff.map(s => ({ from: pad(s.from), to: pad(s.to), count: s.to - s.from + 1 }));
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

  // Build beginning serial ranges for each month start within the requested period
  const beginning_serials_by_month = [];
  try {
    const sd = new Date(startDate + 'T00:00:00');
    const ed = new Date(endDate + 'T00:00:00');
    // normalize to first day of month for start
    let cur = new Date(sd.getFullYear(), sd.getMonth(), 1);
    while (cur <= ed) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const monthStart = `${y}-${String(m+1).padStart(2,'0')}-01`;
      const ranges = await computeRemainingSegmentsAt(monthStart);
      const monthLabel = `${roMonths[m]} ${y}`;
      beginning_serials_by_month.push({ ym: `${y}-${String(m+1).padStart(2,'0')}`, month: monthLabel, ranges });
      // advance month
      cur = new Date(y, m+1, 1);
    }
  } catch (e) {
    console.error('Error computing beginning_serials_by_month:', e);
  }

  return { startDate, endDate, dailyRows, totals, meta, remaining_serials, sales_by_month, sales_amount_by_month, beginning_serials_by_month, generated_at: new Date().toISOString() };
}

export default generateTicketsPeriodReport;

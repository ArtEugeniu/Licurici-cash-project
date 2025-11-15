#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  const bid = process.argv[2] || '4';
  console.log('Debug batch id:', bid);
  const b = await db.get('SELECT id, number_from, number_to, created_at FROM tickets_in WHERE id = ?', [bid]);
  console.log('Batch:', b);
  const nf = Number(b.number_from);
  const nt = Number(b.number_to);
  let segs = [{ from: nf, to: nt }];
  console.log('Initial segs:', segs);

  const soldRows = await db.all('SELECT batch_id, serial_number FROM tickets_sales WHERE batch_id = ? ORDER BY serial_number ASC', [bid]);
  console.log('Sold rows count for batch:', soldRows.length);
  // show if serial 001021 exists among soldRows
  const found = soldRows.filter(r => String(r.serial_number) === '001021' || Number(r.serial_number) === 1021);
  console.log('Found rows matching 001021:', found.length);
  for (const r of found) console.log(r);

  // subtract
  for (const r of soldRows) {
    const num = Number(r.serial_number);
    const newSegs = [];
    for (const seg of segs) {
      if (num < seg.from || num > seg.to) { newSegs.push(seg); continue; }
      if (num === seg.from && num === seg.to) {
        // remove
      } else if (num === seg.from) newSegs.push({ from: seg.from + 1, to: seg.to });
      else if (num === seg.to) newSegs.push({ from: seg.from, to: seg.to - 1 });
      else { newSegs.push({ from: seg.from, to: num - 1 }); newSegs.push({ from: num + 1, to: seg.to }); }
    }
    segs = newSegs;
  }
  console.log('Segs after subtracting tickets_sales:', segs);

  // compute total sold and tickets_sales count
  const totalSoldRow = await db.get("SELECT IFNULL(SUM(quantity),0) as total_sold FROM sales WHERE date(created_at) <= date('now')");
  const ticketsSalesCountRow = await db.get('SELECT IFNULL(COUNT(*),0) as tickets_sales_count FROM tickets_sales');
  console.log('total_sold:', totalSoldRow.total_sold, 'tickets_sales_count:', ticketsSalesCountRow.tickets_sales_count);
  let missing = (totalSoldRow.total_sold || 0) - (ticketsSalesCountRow.tickets_sales_count || 0);
  if (missing < 0) missing = 0;
  console.log('missing:', missing);

  // allocate missing across this batch only for demo (in real code we allocate across all batches)
  if (missing > 0) {
    console.log('Allocating missing to this batch only (demo)');
    let i = 0;
    while (i < segs.length && missing > 0) {
      const seg = segs[i];
      const segCount = seg.to - seg.from + 1;
      if (segCount <= missing) { missing -= segCount; segs.splice(i, 1); }
      else { seg.from = seg.from + missing; missing = 0; i++; }
    }
  }
  console.log('Segs after allocating missing to this batch:', segs);

  process.exit(0);
}

run();

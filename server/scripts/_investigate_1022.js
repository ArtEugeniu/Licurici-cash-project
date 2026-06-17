#!/usr/bin/env node
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SERIAL = '001022';
const SN = 1022;
const d = dirname(fileURLToPath(import.meta.url));
const db = await open({ filename: join(d, '../db/tickets.db'), driver: sqlite3.Database });

console.log('='.repeat(72));
console.log('INVESTIGATION: serial', SERIAL);
console.log('='.repeat(72));

// All tickets_sales for this serial (any batch)
const allTs = await db.all(`
  SELECT ts.id, ts.sale_id, ts.batch_id, ts.serial_number, ts.schedule_id, ts.created_at,
         ti.number_from, ti.number_to, ti.created_at as batch_received
  FROM tickets_sales ts
  JOIN tickets_in ti ON ts.batch_id = ti.id
  WHERE CAST(ts.serial_number AS INTEGER) = ?
  ORDER BY ts.id`, [SN]);
console.log('\n1. ALL tickets_sales rows for', SERIAL, ':', allTs.length);
allTs.forEach(r => {
  console.log(JSON.stringify(r, null, 2));
});

// Full sale details for each
console.log('\n2. SALES linked to each tickets_sales row');
for (const row of allTs) {
  const sale = await db.get(`SELECT * FROM sales WHERE id = ?`, [row.sale_id]);
  const sched = sale?.schedule_id
    ? await db.get(`SELECT date, time, title FROM schedule WHERE id = ?`, [sale.schedule_id])
    : null;
  console.log('\n--- tickets_sales id', row.id, 'batch', row.batch_id, '---');
  console.log('sale:', sale);
  console.log('schedule:', sched);
  console.log('ts.created_at:', row.created_at, '| sale.created_at:', sale?.created_at);
}

// Batch 4 vs 5 context
console.log('\n3. BATCHES containing', SERIAL);
const batches = await db.all(`
  SELECT id, number_from, number_to, total_tickets, created_at
  FROM tickets_in
  WHERE CAST(number_from AS INTEGER) <= ? AND CAST(number_to AS INTEGER) >= ?`, [SN, SN]);
batches.forEach(b => console.log(b));

// ticket_serial pointers for batch 4 and 5
for (const bid of [4, 5]) {
  const ptr = await db.get(`SELECT * FROM ticket_serial WHERE batch_id = ?`, [bid]);
  console.log('\nticket_serial batch', bid, ':', ptr);
}

// Other serials in same sale(s)
for (const row of allTs) {
  const siblings = await db.all(`
    SELECT batch_id, serial_number, created_at FROM tickets_sales
    WHERE sale_id = ? ORDER BY CAST(serial_number AS INTEGER), batch_id`, [row.sale_id]);
  console.log('\n4. All serials in sale', row.sale_id, '(', siblings.length, 'rows):');
  siblings.forEach(s => console.log(`  batch ${s.batch_id} ${s.serial_number} ts_at=${s.created_at}`));
}

// Chronology: first and last use of 1022 in system
const firstLast = await db.all(`
  SELECT ts.id, ts.batch_id, ts.serial_number, sa.created_at as sale_at, ts.created_at as ts_at
  FROM tickets_sales ts JOIN sales sa ON ts.sale_id = sa.id
  WHERE CAST(ts.serial_number AS INTEGER) = ?
  ORDER BY datetime(sa.created_at)`, [SN]);
console.log('\n5. CHRONOLOGY by sale date');
firstLast.forEach(r => console.log(r));

// Suspicious signs of manual insert
console.log('\n6. MANUAL INSERT SIGNALS');
for (const row of allTs) {
  const flags = [];
  if (row.created_at && row.sale_id) {
    const sale = await db.get(`SELECT created_at FROM sales WHERE id=?`, [row.sale_id]);
    if (sale && row.created_at !== sale.created_at) {
      const tsDate = row.created_at.split(' ')[0];
      const saleDate = sale.created_at.split(' ')[0];
      if (tsDate !== saleDate) flags.push(`ts.created_at (${row.created_at}) != sale day (${sale.created_at})`);
    }
  }
  // id gap vs neighbors
  const neighbors = await db.all(`
    SELECT id, batch_id, serial_number, sale_id FROM tickets_sales
    WHERE id BETWEEN ? AND ? ORDER BY id`, [row.id - 3, row.id + 3]);
  if (allTs.length === 1 && row.batch_id === 5) flags.push('only batch5 row - batch4 also sold 1022 in big Oct 10 sale');
  console.log('  row id', row.id, 'batch', row.batch_id, flags.length ? flags.join('; ') : 'no obvious flags');
}

// Compare batch4 sale 09ad99e6 - does it include 1022?
const bigSale = await db.get(`
  SELECT sa.id, sa.created_at, sa.quantity, sa.title,
    (SELECT COUNT(*) FROM tickets_sales WHERE sale_id=sa.id) as ts_count,
    (SELECT COUNT(*) FROM tickets_sales WHERE sale_id=sa.id AND CAST(serial_number AS INTEGER)=1022) as has_1022
  FROM sales sa
  WHERE sa.id = '09ad99e6-806f-4e5a-817e-98cb023c88d6'`);
console.log('\n7. Big batch4 sale (Oct 10, 74 tickets):', bigSale);

const b4_1022 = await db.get(`
  SELECT * FROM tickets_sales WHERE sale_id='09ad99e6-806f-4e5a-817e-98cb023c88d6'
    AND batch_id=4 AND CAST(serial_number AS INTEGER)=1022`);
console.log('   batch4 001022 in that sale:', b4_1022 ? 'YES id='+b4_1022.id : 'NO');

// batch 5 only sale for 1022
const b5only = allTs.filter(r => r.batch_id === 5);
if (b5only.length === 1) {
  const s = await db.get(`SELECT * FROM sales WHERE id=?`, [b5only[0].sale_id]);
  console.log('\n8. BATCH 5 ONLY sale for 001022:');
  console.log('   sale:', s);
  const near = await db.all(`
    SELECT serial_number, batch_id FROM tickets_sales WHERE sale_id=? ORDER BY serial_number`, [s.id]);
  console.log('   all serials in this sale:', near);
}

// Max id tickets_sales - recently added rows often have high ids
console.log('\n9. tickets_sales id range for 001022 rows vs global max');
const maxId = await db.get(`SELECT MAX(id) as m FROM tickets_sales`);
console.log('   max tickets_sales.id:', maxId.m);
allTs.forEach(r => console.log(`   001022 row id ${r.id} batch ${r.batch_id}`));

await db.close();

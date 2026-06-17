import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const d = dirname(fileURLToPath(import.meta.url));
const db = await open({ filename: join(d, '../db/tickets.db'), driver: sqlite3.Database });

const b5sold = await db.all(
  'SELECT serial_number, sale_id, created_at FROM tickets_sales WHERE batch_id=5 ORDER BY CAST(serial_number AS INTEGER)'
);
console.log('Batch 5 tickets_sales count:', b5sold.length);
console.log('Serials:', b5sold.map((r) => r.serial_number).join(', '));

const used = new Set(b5sold.map((r) => r.serial_number));
const missing = [];
for (let i = 1001; i <= 1022; i++) {
  const s = String(i).padStart(6, '0');
  if (!used.has(s)) missing.push(s);
}
console.log('Missing in batch5 [1001-1022]:', missing);

const overlap = await db.get(`
  SELECT COUNT(*) c FROM tickets_sales t4
  JOIN tickets_sales t5 ON t4.serial_number=t5.serial_number AND t4.batch_id=4 AND t5.batch_id=5
  WHERE CAST(t4.serial_number AS INTEGER) BETWEEN 1001 AND 1022`);
console.log('Overlap sold in BOTH batches (1001-1022):', overlap.c);

const o1022 = await db.get(`
  SELECT t4.sale_id s4, t5.sale_id s5, sa4.created_at d4, sa5.created_at d5
  FROM tickets_sales t4
  JOIN tickets_sales t5 ON t4.serial_number=t5.serial_number AND t4.batch_id=4 AND t5.batch_id=5
  JOIN sales sa4 ON sa4.id=t4.sale_id
  JOIN sales sa5 ON sa5.id=t5.sale_id
  WHERE t4.serial_number='001022'`);
console.log('1022 dual sales:', o1022);

// Neighbors: 1020 and 1021 in batch 5
for (const sn of ['001020', '001021', '001022']) {
  const row = await db.get('SELECT * FROM tickets_sales WHERE batch_id=5 AND serial_number=?', [sn]);
  console.log(`batch5 ${sn}:`, row ? `sold sale=${row.sale_id.slice(0,8)}... at ${row.created_at}` : 'NOT SOLD');
}

await db.close();

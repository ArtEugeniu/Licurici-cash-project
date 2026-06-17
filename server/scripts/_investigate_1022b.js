import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const d = dirname(fileURLToPath(import.meta.url));

async function checkDb(path, label) {
  try {
    const db = await open({ filename: path, driver: sqlite3.Database });
    const b5 = await db.get('SELECT * FROM tickets_in WHERE id=5');
    const ts5_1022 = await db.get(`SELECT * FROM tickets_sales WHERE batch_id=5 AND serial_number='001022'`);
    const sale = ts5_1022 ? await db.get('SELECT * FROM sales WHERE id=?', [ts5_1022.sale_id]) : null;
    console.log(label, { b5, ts5_1022: !!ts5_1022, sale: sale?.created_at });
    await db.close();
  } catch (e) {
    console.log(label, 'not available:', e.message);
  }
}

await checkDb(join(d, '../db/tickets.db'), 'CURRENT');
await checkDb(join(d, '../db/tickets.db.backup_2026-06-12_backfill'), 'BACKUP backfill');

// Oct 18 batch 5 sales timeline
const db = await open({ filename: join(d, '../db/tickets.db'), driver: sqlite3.Database });
const timeline = await db.all(`
  SELECT sa.created_at, sa.id, sa.quantity, sa.title, ts.serial_number, ts.batch_id
  FROM sales sa
  JOIN tickets_sales ts ON ts.sale_id=sa.id AND ts.batch_id=5
  WHERE date(sa.created_at)='2025-10-18'
  ORDER BY sa.created_at, ts.serial_number`);
console.log('\nOct 18 batch 5 timeline:');
timeline.forEach(r => console.log(`  ${r.created_at} | ${r.serial_number} | qty=${r.quantity} | ${r.title}`));

// Is sale 7a78f543 only batch5 1022?
const saleDetail = await db.get(`SELECT COUNT(*) c FROM tickets_sales WHERE sale_id='7a78f543-04b5-4fbd-97dc-7d1cd96b586f'`);
console.log('\nSale 7a78f543 tickets_sales count:', saleDetail.c);

await db.close();

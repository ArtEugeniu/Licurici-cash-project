#!/usr/bin/env node
/**
 * Backfill 4 missing tickets_sales rows for orphan sales (Oct 2025).
 * Does NOT modify sales or ticket_serial.
 */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = await open({
  filename: join(__dirname, '../db/tickets.db'),
  driver: sqlite3.Database,
});

const inserts = [
  {
    sale_id: 'b8e14904-bd41-4e9d-9131-09e0e833e2ad',
    batch_id: 4,
    serial_number: '000140',
    schedule_id: 'a5d08d72-309a-4366-a371-07a1abb73ca2',
    created_at: '2025-10-05 08:05:15',
  },
  {
    sale_id: 'b8e14904-bd41-4e9d-9131-09e0e833e2ad',
    batch_id: 4,
    serial_number: '000141',
    schedule_id: 'a5d08d72-309a-4366-a371-07a1abb73ca2',
    created_at: '2025-10-05 08:05:15',
  },
  {
    sale_id: 'f87a3c2a-9de9-428e-84e3-3603e7da74d3',
    batch_id: 5,
    serial_number: '001004',
    schedule_id: 'd21f3b97-f1e9-4d61-a73d-e808e9b045ee',
    created_at: '2025-10-18 08:48:23',
  },
  {
    sale_id: 'r32g3c2a-9de9-428e-84e3-3603e7da74d3',
    batch_id: 5,
    serial_number: '001021',
    schedule_id: 'd21f3b97-f1e9-4d61-a73d-e808e9b045ee',
    created_at: '2025-10-18 08:48:23',
  },
];

async function countGap() {
  const sales = await db.get(
    `SELECT IFNULL(SUM(quantity),0) as q FROM sales WHERE date(created_at) >= date('2025-10-01')`
  );
  const ts = await db.get(
    `SELECT COUNT(*) as c FROM tickets_sales ts JOIN sales sa ON ts.sale_id=sa.id
     WHERE date(sa.created_at) >= date('2025-10-01')`
  );
  const mismatches = await db.all(`
    SELECT sa.id FROM sales sa
    WHERE date(sa.created_at) >= date('2025-10-01')
      AND sa.quantity != (SELECT COUNT(*) FROM tickets_sales ts WHERE ts.sale_id=sa.id)
  `);
  return { salesQty: sales.q, tsRows: ts.c, gap: sales.q - ts.c, mismatches: mismatches.length };
}

console.log('BEFORE:', await countGap());

for (const row of inserts) {
  const existing = await db.get(
    `SELECT id FROM tickets_sales WHERE batch_id=? AND serial_number=?`,
    [row.batch_id, row.serial_number]
  );
  if (existing) {
    console.error(`ABORT: serial ${row.serial_number} batch ${row.batch_id} already taken (id=${existing.id})`);
    process.exit(2);
  }

  const sale = await db.get(`SELECT id, quantity FROM sales WHERE id=?`, [row.sale_id]);
  if (!sale) {
    console.error(`ABORT: sale ${row.sale_id} not found`);
    process.exit(2);
  }
}

await db.run('BEGIN');
try {
  for (const row of inserts) {
    await db.run(
      `INSERT INTO tickets_sales (sale_id, batch_id, serial_number, schedule_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [row.sale_id, row.batch_id, row.serial_number, row.schedule_id, row.created_at]
    );
    console.log(`INSERTED sale=${row.sale_id} batch=${row.batch_id} serial=${row.serial_number}`);
  }
  await db.run('COMMIT');
} catch (err) {
  await db.run('ROLLBACK');
  console.error('ROLLBACK:', err);
  process.exit(1);
}

const after = await countGap();
console.log('AFTER:', after);

if (after.gap !== 0 || after.mismatches !== 0) {
  console.error('VERIFY FAILED');
  process.exit(1);
}

console.log('BACKFILL OK');
await db.close();

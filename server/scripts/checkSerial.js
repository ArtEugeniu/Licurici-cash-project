#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  const serialArg = process.argv[2] || '001021';
  const num = Number(serialArg);
  try {
    const rowsExact = await db.all(
      `SELECT ts.sale_id, ts.batch_id, ts.serial_number, s.created_at, s.id as sale_id_full
       FROM tickets_sales ts
       JOIN sales s ON ts.sale_id = s.id
       WHERE ts.serial_number = ?
       ORDER BY s.created_at ASC`,
      [serialArg]
    );

    const rowsNumeric = await db.all(
      `SELECT ts.sale_id, ts.batch_id, ts.serial_number, s.created_at
       FROM tickets_sales ts
       JOIN sales s ON ts.sale_id = s.id
       WHERE CAST(ts.serial_number AS INTEGER) = ?
       ORDER BY s.created_at ASC`,
      [isNaN(num) ? null : num]
    );

    console.log(`Searching for serial: '${serialArg}' (numeric ${num})`);
    console.log('Exact string matches:', rowsExact.length);
    for (const r of rowsExact) console.log(r);
    console.log('Numeric matches:', rowsNumeric.length);
    for (const r of rowsNumeric) console.log(r);

    // If not found in tickets_sales, check sales aggregated that could explain missing per-serial rows
    if (rowsExact.length === 0 && rowsNumeric.length === 0) {
      const salesRows = await db.all(
        `SELECT id, quantity, total_sum, type, payment_method, created_at FROM sales WHERE date(created_at) BETWEEN ? AND ? ORDER BY created_at ASC`,
        ['2025-10-01','2025-10-31']
      );
      console.log('\nSales in October (sample):', salesRows.length);
      for (const s of salesRows.slice(0,10)) console.log(s);
    }

  } catch (err) {
    console.error('Error checking serial:', err);
  }
  process.exit(0);
}

run();

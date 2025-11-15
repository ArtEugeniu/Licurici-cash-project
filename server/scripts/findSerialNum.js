#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  const num = Number(process.argv[2]);
  if (isNaN(num)) {
    console.error('Usage: node findSerialNum.js <number>');
    process.exit(1);
  }
  try {
    const rows = await db.all(
      `SELECT ts.sale_id, ts.batch_id, ts.serial_number, s.created_at FROM tickets_sales ts JOIN sales s ON ts.sale_id = s.id WHERE CAST(ts.serial_number AS INTEGER) = ? ORDER BY s.created_at ASC`,
      [num]
    );
    console.log(`Found ${rows.length} tickets_sales rows for serial ${num}:`);
    for (const r of rows) console.log(r);
  } catch (err) {
    console.error('Error querying tickets_sales:', err);
  }
  process.exit(0);
}

run();

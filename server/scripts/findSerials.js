#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  const min = process.argv[2] || '189001';
  const max = process.argv[3] || '189500';
  try {
    const rows = await db.all(
      `SELECT ts.sale_id, ts.batch_id, ts.serial_number, s.created_at FROM tickets_sales ts JOIN sales s ON ts.sale_id = s.id WHERE ts.serial_number BETWEEN ? AND ? ORDER BY s.created_at ASC`,
      [min, max]
    );
    console.log(`Found ${rows.length} tickets_sales rows between ${min} and ${max}:`);
    for (const r of rows) console.log(r);
  } catch (err) {
    console.error('Error querying tickets_sales:', err);
  }
  process.exit(0);
}

run();

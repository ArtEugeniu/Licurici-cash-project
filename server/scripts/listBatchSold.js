#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  const bid = Number(process.argv[2] || 4);
  try {
    const rows = await db.all(
      `SELECT sale_id, batch_id, serial_number, (CAST(serial_number AS INTEGER)) as serial_int, s.created_at FROM tickets_sales ts JOIN sales s ON ts.sale_id = s.id WHERE batch_id = ? ORDER BY serial_int ASC LIMIT 200`,
      [bid]
    );
    console.log(`Found ${rows.length} rows for batch ${bid}`);
    for (const r of rows) console.log(r);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

run();

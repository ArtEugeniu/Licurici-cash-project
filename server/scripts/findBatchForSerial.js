#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  const serialArg = process.argv[2] || '001022';
  const num = Number(serialArg);
  try {
    const batches = await db.all(
      `SELECT id, number_from, number_to, total_tickets, created_at FROM tickets_in WHERE CAST(number_from AS INTEGER) <= ? AND CAST(number_to AS INTEGER) >= ? ORDER BY created_at ASC`,
      [num, num]
    );
    console.log(`Batches containing ${serialArg}:`, batches.length);
    for (const b of batches) console.log(b);

    const sales = await db.all(
      `SELECT ts.sale_id, ts.batch_id, ts.serial_number, s.created_at FROM tickets_sales ts JOIN sales s ON ts.sale_id = s.id WHERE ts.serial_number = ? ORDER BY s.created_at ASC`,
      [serialArg]
    );
    console.log(`tickets_sales matching ${serialArg}:`, sales.length);
    for (const s of sales) console.log(s);

  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

run();

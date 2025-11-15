#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  const date = process.argv[2] || '2025-10-01';

  try {
    const ticketsInBefore = await db.get(
      `SELECT IFNULL(SUM(total_tickets),0) as tickets_in_before FROM tickets_in WHERE date(created_at) < ?`,
      [date]
    );

    const soldBefore = await db.get(
      `SELECT IFNULL(SUM(quantity),0) as sold_before FROM sales WHERE date(created_at) < ?`,
      [date]
    );

    console.log('Date cutoff:', date);
    console.log('tickets_in_before:', ticketsInBefore.tickets_in_before);
    console.log('sold_before:', soldBefore.sold_before);
    console.log('beginning_inventory:', ticketsInBefore.tickets_in_before - soldBefore.sold_before);

    console.log('\nLast 20 sales before cutoff:');
    const salesRows = await db.all(
      `SELECT id, quantity, total_sum, type, payment_method, created_at FROM sales WHERE date(created_at) < ? ORDER BY created_at DESC LIMIT 20`,
      [date]
    );
    for (const r of salesRows) console.log(r);

    console.log('\nLast 20 tickets_in before cutoff:');
    const inRows = await db.all(
      `SELECT id, number_from, number_to, total_tickets, created_at FROM tickets_in WHERE date(created_at) < ? ORDER BY created_at DESC LIMIT 20`,
      [date]
    );
    for (const r of inRows) console.log(r);

  } catch (err) {
    console.error('Error inspecting DB:', err);
  }
  process.exit(0);
}

run();

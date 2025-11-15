#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  try {
    const totalSold = await db.get(`SELECT IFNULL(SUM(quantity),0) as total_sold FROM sales WHERE date(created_at) <= date('now')`);
    const ticketsSalesCount = await db.get(`SELECT IFNULL(COUNT(*),0) as tickets_sales_count FROM tickets_sales`);
    const minSerial = await db.get(`SELECT MIN(CAST(serial_number AS INTEGER)) as min_serial FROM tickets_sales`);
    const maxSerial = await db.get(`SELECT MAX(CAST(serial_number AS INTEGER)) as max_serial FROM tickets_sales`);
    console.log('total_sold (sales table):', totalSold.total_sold);
    console.log('tickets_sales rows:', ticketsSalesCount.tickets_sales_count);
    console.log('tickets_sales serial min/max:', minSerial.min_serial, maxSerial.max_serial);

    const examples = await db.all(`SELECT id, number_from, number_to, total_tickets, created_at FROM tickets_in ORDER BY date(created_at) ASC LIMIT 20`);
    console.log('\nFirst 20 tickets_in batches:');
    for (const r of examples) console.log(r);

  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

run();

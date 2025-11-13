#!/usr/bin/env node
import { initDB, db } from '../db/index.js';
import generateTicketsPeriodReport from '../services/reportsService.js';

async function run() {
  await initDB();
  const start = '2025-01-01';
  const end = '2025-12-31';
  try {
    const r = await generateTicketsPeriodReport(db, start, end);

    const expectedRemaining = r.totals.received_total - r.totals.sold_total;
    if (r.totals.remaining_on_box !== expectedRemaining) {
      throw new Error(`remaining_on_box mismatch: got ${r.totals.remaining_on_box}, expected ${expectedRemaining}`);
    }

    for (const d of r.dailyRows) {
      const sumParts = (d.sold_100_cash || 0) + (d.sold_100_card || 0) + (d.sold_150_cash || 0) + (d.sold_150_card || 0) + (d.sold_200_cash || 0) + (d.sold_200_card || 0);
      if (d.sold_total !== sumParts) {
        throw new Error(`sold_total mismatch on ${d.date}: got ${d.sold_total}, sumParts ${sumParts}`);
      }
    }

    console.log('SMOKE TEST PASS');
    process.exit(0);
  } catch (err) {
    console.error('SMOKE TEST FAIL:', err);
    process.exit(2);
  }
}

run();

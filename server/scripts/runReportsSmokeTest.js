#!/usr/bin/env node
import { initDB, db } from '../db/index.js';
import generateTicketsPeriodReport from '../services/reportsService.js';

async function run() {
  await initDB();
  const start = '2025-01-01';
  const end = '2025-12-31';
  try {
    const r = await generateTicketsPeriodReport(db, start, end);
    // Check totals consistency: remaining = received_total - sold_total
    const expectedRemaining = r.totals.received_total - r.totals.sold_total;
    if (r.totals.remaining_on_box !== expectedRemaining) {
      throw new Error(`remaining_on_box mismatch: got ${r.totals.remaining_on_box}, expected ${expectedRemaining}`);
    }

    // Check that dailyRows sum up to received_total
    const sumReceived = r.dailyRows.reduce((s, d) => s + (d.tickets_received || 0), 0);
    if (sumReceived !== r.totals.received_total) {
      throw new Error(`received_total mismatch: rows sum ${sumReceived} vs totals.received_total ${r.totals.received_total}`);
    }

    console.log('SMOKE TEST PASS');
    process.exit(0);
  } catch (err) {
    console.error('SMOKE TEST FAIL:', err);
    process.exit(2);
  }
}

run();

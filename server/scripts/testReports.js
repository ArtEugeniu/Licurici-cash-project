#!/usr/bin/env node
import { initDB, db } from '../db/index.js';
import generateTicketsPeriodReport from '../services/reportsService.js';

async function run() {
  await initDB();
  const start = process.argv[2] || '2025-01-01';
  const end = process.argv[3] || '2025-12-31';
  try {
    const report = await generateTicketsPeriodReport(db, start, end);
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('Error running testReports:', err);
  }
  process.exit(0);
}

run();

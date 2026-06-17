import { initDB, db } from '../db/index.js';
import generateTicketsPeriodReport from '../services/reportsService.js';

async function main() {
  await initDB();
  const res = await generateTicketsPeriodReport(db, '2025-10-01', '2026-06-12');
  console.log('beginning_serials_by_month length:', (res.beginning_serials_by_month || []).length);
  if (res.beginning_serials_by_month && res.beginning_serials_by_month.length) {
    console.log(JSON.stringify(res.beginning_serials_by_month.slice(0,3), null, 2));
  }
}

main().catch(err => { console.error(err); process.exit(1); });

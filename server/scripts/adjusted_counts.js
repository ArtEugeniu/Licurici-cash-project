import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const [,, startDate, endDate, excludeSaleIdsArg] = process.argv;
  if (!startDate || !endDate) {
    console.error('Usage: node adjusted_counts.js YYYY-MM-DD YYYY-MM-DD [excludeSaleId1,excludeSaleId2]');
    process.exit(2);
  }
  const excludeSaleIds = excludeSaleIdsArg ? excludeSaleIdsArg.split(',').map(s=>s.trim()).filter(Boolean) : [];

  const db = await open({ filename: join(__dirname, '..', 'db', 'tickets.db'), driver: sqlite3.Database });

  const salesSumRow = await db.get(
    `SELECT IFNULL(SUM(quantity),0) as sum_qty, IFNULL(SUM(total_sum),0) as sum_amount FROM sales WHERE date(created_at) BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const ticketsSalesCountRow = await db.get(
    `SELECT IFNULL(COUNT(ts.id),0) as tickets_rows FROM tickets_sales ts JOIN sales sa ON ts.sale_id = sa.id WHERE date(sa.created_at) BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  let adjustedSum = salesSumRow.sum_qty;
  if (excludeSaleIds.length) {
    const placeholders = excludeSaleIds.map(()=>'?').join(',');
    const row = await db.get(
      `SELECT IFNULL(SUM(quantity),0) as excluded_qty FROM sales WHERE id IN (${placeholders}) AND date(created_at) BETWEEN ? AND ?`,
      [...excludeSaleIds, startDate, endDate]
    );
    adjustedSum = adjustedSum - (row.excluded_qty || 0);
  }

  console.log(JSON.stringify({ startDate, endDate, sum_qty: salesSumRow.sum_qty, tickets_rows: ticketsSalesCountRow.tickets_rows, excludeSaleIds, adjusted_sum_qty: adjustedSum }, null, 2));
  await db.close();
}

main().catch(err=>{ console.error(err); process.exit(1); });

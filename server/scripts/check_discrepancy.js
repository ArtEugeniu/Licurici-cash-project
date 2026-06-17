import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const [,, startDate, endDate] = process.argv;
  if (!startDate || !endDate) {
    console.error('Usage: node check_discrepancy.js YYYY-MM-DD YYYY-MM-DD');
    process.exit(2);
  }

  const db = await open({ filename: join(__dirname, '..', 'db', 'tickets.db'), driver: sqlite3.Database });

  const salesSumRow = await db.get(
    `SELECT IFNULL(SUM(quantity),0) as sum_qty, IFNULL(SUM(total_sum),0) as sum_amount FROM sales WHERE date(created_at) BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const ticketsSalesCountRow = await db.get(
    `SELECT IFNULL(COUNT(ts.id),0) as tickets_rows FROM tickets_sales ts JOIN sales sa ON ts.sale_id = sa.id WHERE date(sa.created_at) BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const mismatchSales = await db.all(
    `SELECT sa.id as sale_id, sa.created_at, sa.schedule_id, sa.quantity as sale_quantity, IFNULL(COUNT(ts.id),0) as tickets_rows
     FROM sales sa
     LEFT JOIN tickets_sales ts ON ts.sale_id = sa.id
     WHERE date(sa.created_at) BETWEEN ? AND ?
     GROUP BY sa.id
     HAVING sale_quantity != tickets_rows
     ORDER BY sa.created_at ASC`,
    [startDate, endDate]
  );

  console.log(JSON.stringify({ startDate, endDate, salesSumRow, ticketsSalesCountRow, mismatchSales }, null, 2));
  await db.close();
}

main().catch(err => { console.error(err); process.exit(1); });

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function pad(n, width) {
  return String(n).padStart(width, '0');
}

async function main() {
  const [,, startDate, endDate] = process.argv;
  if (!startDate || !endDate) {
    console.error('Usage: node find_missing_serials.js YYYY-MM-DD YYYY-MM-DD');
    process.exit(2);
  }

  const db = await open({ filename: join(__dirname, '..', 'db', 'tickets.db'), driver: sqlite3.Database });

  const batches = await db.all('SELECT id, number_from, number_to FROM tickets_in ORDER BY id ASC');
  const batchMap = new Map();
  let maxWidth = 0;
  for (const b of batches) {
    const nf = Number(b.number_from);
    const nt = Number(b.number_to);
    if (isNaN(nf) || isNaN(nt)) continue;
    batchMap.set(String(b.id), { id: String(b.id), from: nf, to: nt, width: String(b.number_from).length });
    if (String(b.number_from).length > maxWidth) maxWidth = String(b.number_from).length;
  }

  // initialize current pointers to (from - 1)
  const cur = {};
  for (const [bid, b] of batchMap.entries()) cur[bid] = b.from - 1;

  // load all existing tickets_sales into a set
  const tsRows = await db.all('SELECT sale_id, batch_id, serial_number FROM tickets_sales');
  const tsSet = new Set(tsRows.map(r => `${r.sale_id}|${r.batch_id}|${r.serial_number}`));

  // load sales in period ordered by created_at
  const sales = await db.all(`SELECT id, quantity, created_at FROM sales WHERE date(created_at) BETWEEN ? AND ? ORDER BY datetime(created_at) ASC`, [startDate, endDate]);

  const problems = [];

  for (const s of sales) {
    let needed = Number(s.quantity || 0);
    const allocs = [];
    // allocate across batches in batch id order (ascending)
    for (const [bid, b] of [...batchMap.entries()]) {
      if (needed <= 0) break;
      if (cur[bid] >= b.to) continue; // batch exhausted
      const available = b.to - cur[bid];
      const take = Math.min(available, needed);
      for (let x = 1; x <= take; x++) {
        const serialNum = cur[bid] + x;
        allocs.push({ batch_id: bid, serial: pad(serialNum, b.width) });
      }
      cur[bid] += take;
      needed -= take;
    }

    if (needed > 0) {
      // not enough tickets overall; record as error but continue
      problems.push({ sale_id: s.id, created_at: s.created_at, error: 'Not enough tickets available to allocate', needed_left: needed });
      continue;
    }

    // check which allocated serials are missing in tickets_sales
    const missing = allocs.filter(a => !tsSet.has(`${s.id}|${a.batch_id}|${a.serial}`)).map(a => ({ batch_id: a.batch_id, serial: a.serial }));
    if (missing.length > 0) {
      problems.push({ sale_id: s.id, created_at: s.created_at, quantity: s.quantity, missing });
    }
  }

  const outPath = join(__dirname, 'find_missing_serials_result.json');
  const fs = await import('fs');
  fs.writeFileSync(outPath, JSON.stringify({ startDate, endDate, problems }, null, 2), { encoding: 'utf8' });
  await db.close();
  console.log('WROTE', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });

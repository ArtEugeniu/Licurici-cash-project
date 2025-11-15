#!/usr/bin/env node
import { initDB, db } from '../db/index.js';

async function run() {
  await initDB();
  const batchId = process.argv[2];
  const serialArg = process.argv[3];
  if (!batchId || !serialArg) {
    console.error('Usage: node removeSerialFromBatch.js <batchId> <serial> (serial can be padded)');
    process.exit(1);
  }

  const serialNum = Number(serialArg);
  if (isNaN(serialNum)) {
    console.error('Serial must be numeric (after stripping padding)');
    process.exit(1);
  }

  try {
    const batch = await db.get('SELECT id, number_from, number_to, total_tickets FROM tickets_in WHERE id = ?', [batchId]);
    if (!batch) {
      console.error('Batch not found:', batchId);
      process.exit(1);
    }

    const nf = Number(batch.number_from);
    const nt = Number(batch.number_to);
    if (isNaN(nf) || isNaN(nt) || serialNum < nf || serialNum > nt) {
      console.error('Serial not within batch range:', nf, nt);
      process.exit(1);
    }

    // Cases: remove at edges or split in middle
    if (nf === nt && nf === serialNum) {
      // delete entire row
      await db.run('DELETE FROM tickets_in WHERE id = ?', [batchId]);
      console.log('Deleted batch row entirely (single-serial batch).');
    } else if (serialNum === nf) {
      const newFrom = String(nf + 1).padStart(String(batch.number_from).length, '0');
      const newTotal = (batch.total_tickets || (nt - nf + 1)) - 1;
      await db.run('UPDATE tickets_in SET number_from = ?, total_tickets = ? WHERE id = ?', [newFrom, newTotal, batchId]);
      console.log(`Removed serial ${serialArg} at start; updated number_from -> ${newFrom}, total_tickets -> ${newTotal}`);
    } else if (serialNum === nt) {
      const newTo = String(nt - 1).padStart(String(batch.number_to).length, '0');
      const newTotal = (batch.total_tickets || (nt - nf + 1)) - 1;
      await db.run('UPDATE tickets_in SET number_to = ?, total_tickets = ? WHERE id = ?', [newTo, newTotal, batchId]);
      console.log(`Removed serial ${serialArg} at end; updated number_to -> ${newTo}, total_tickets -> ${newTotal}`);
    } else {
      // split into two: update original to nf..serial-1, insert new serial+1..nt
      const leftTo = serialNum - 1;
      const rightFrom = serialNum + 1;
      const leftCount = leftTo - nf + 1;
      const rightCount = nt - rightFrom + 1;
      const leftToStr = String(leftTo).padStart(String(batch.number_from).length, '0');
      const rightFromStr = String(rightFrom).padStart(String(batch.number_from).length, '0');
      const rightToStr = String(nt).padStart(String(batch.number_to).length, '0');

      // update original to left segment
      await db.run('UPDATE tickets_in SET number_to = ?, total_tickets = ? WHERE id = ?', [leftToStr, leftCount, batchId]);
      // insert new row for right segment
      await db.run('INSERT INTO tickets_in (number_from, number_to, total_tickets, created_at) VALUES (?, ?, ?, datetime(?))', [rightFromStr, rightToStr, rightCount, batch.created_at || new Date().toISOString()]);

      console.log(`Split batch ${batchId}: removed ${serialArg}, left ${batch.number_from}-${leftToStr} (${leftCount}), right ${rightFromStr}-${rightToStr} (${rightCount})`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

run();

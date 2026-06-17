function rangesOverlap(aFrom, aTo, bFrom, bTo) {
  return aFrom <= bTo && bFrom <= aTo;
}

export async function runIntegrityCheck(db, options = {}) {
  const fromDate = options.fromDate || '2025-10-01';

  const salesSerialMismatches = await db.all(`
    SELECT sa.id,
           sa.created_at,
           sa.quantity,
           COUNT(ts.serial_number) AS serial_rows,
           sa.quantity - COUNT(ts.serial_number) AS difference,
           sa.payment_method,
           sa.type,
           sa.title,
           sa.schedule_id
    FROM sales sa
    LEFT JOIN tickets_sales ts ON ts.sale_id = sa.id
    WHERE date(sa.created_at) >= ?
    GROUP BY sa.id
    HAVING difference <> 0
    ORDER BY sa.created_at ASC
  `, [fromDate]);

  const orphanTicketSales = await db.all(`
    SELECT ts.id,
           ts.sale_id,
           ts.batch_id,
           ts.serial_number,
           ts.schedule_id,
           ts.created_at
    FROM tickets_sales ts
    LEFT JOIN sales sa ON sa.id = ts.sale_id
    WHERE sa.id IS NULL
      AND date(ts.created_at) >= ?
    ORDER BY ts.id ASC
  `, [fromDate]);

  const duplicateSerials = await db.all(`
    SELECT batch_id,
           serial_number,
           COUNT(*) AS count,
           GROUP_CONCAT(sale_id, ',') AS sale_ids
    FROM tickets_sales ts
    JOIN tickets_in ti ON ti.id = ts.batch_id
    WHERE date(ti.created_at) >= ?
    GROUP BY ts.batch_id, ts.serial_number
    HAVING count > 1
    ORDER BY ts.batch_id ASC, CAST(ts.serial_number AS INTEGER) ASC
  `, [fromDate]);

  const batchesWithoutSerialPointer = await db.all(`
    SELECT ti.id,
           ti.number_from,
           ti.number_to,
           ti.total_tickets,
           ti.created_at
    FROM tickets_in ti
    LEFT JOIN ticket_serial ts ON ts.batch_id = ti.id
    WHERE ts.id IS NULL
      AND date(ti.created_at) >= ?
    ORDER BY ti.id ASC
  `, [fromDate]);

  const serialPointersWithoutBatch = await db.all(`
    SELECT ts.id,
           ts.batch_id,
           ts.current_serial_number
    FROM ticket_serial ts
    LEFT JOIN tickets_in ti ON ti.id = ts.batch_id
    WHERE ti.id IS NULL
    ORDER BY ts.id ASC
  `);

  const invalidTicketRanges = await db.all(`
    SELECT id,
           number_from,
           number_to,
           total_tickets,
           created_at
    FROM tickets_in
    WHERE date(created_at) >= ?
      AND (
        CAST(number_from AS INTEGER) > CAST(number_to AS INTEGER)
        OR total_tickets <> CAST(number_to AS INTEGER) - CAST(number_from AS INTEGER) + 1
      )
    ORDER BY id ASC
  `, [fromDate]);

  const batches = await db.all(`
    SELECT id,
           number_from,
           number_to,
           total_tickets,
           created_at
    FROM tickets_in
    WHERE date(created_at) >= ?
    ORDER BY CAST(number_from AS INTEGER) ASC, id ASC
  `, [fromDate]);

  const overlappingTicketRanges = [];
  for (let i = 0; i < batches.length; i++) {
    const current = batches[i];
    const currentFrom = Number(current.number_from);
    const currentTo = Number(current.number_to);

    if (!Number.isFinite(currentFrom) || !Number.isFinite(currentTo)) continue;

    for (let j = i + 1; j < batches.length; j++) {
      const other = batches[j];
      const otherFrom = Number(other.number_from);
      const otherTo = Number(other.number_to);

      if (!Number.isFinite(otherFrom) || !Number.isFinite(otherTo)) continue;
      if (otherFrom > currentTo) break;

      if (rangesOverlap(currentFrom, currentTo, otherFrom, otherTo)) {
        overlappingTicketRanges.push({
          first: current,
          second: other,
        });
      }
    }
  }

  const criticalSummary = {
    salesSerialMismatches: salesSerialMismatches.length,
    orphanTicketSales: orphanTicketSales.length,
    duplicateSerials: duplicateSerials.length,
    batchesWithoutSerialPointer: batchesWithoutSerialPointer.length,
    serialPointersWithoutBatch: serialPointersWithoutBatch.length,
    invalidTicketRanges: invalidTicketRanges.length,
  };

  const warningSummary = {
    overlappingTicketRanges: overlappingTicketRanges.length,
  };

  return {
    ok: Object.values(criticalSummary).every((count) => count === 0),
    checkedFrom: fromDate,
    summary: {
      ...criticalSummary,
      ...warningSummary,
    },
    criticalSummary,
    warningSummary,
    details: {
      salesSerialMismatches,
      orphanTicketSales,
      duplicateSerials,
      batchesWithoutSerialPointer,
      serialPointersWithoutBatch,
      invalidTicketRanges,
      overlappingTicketRanges,
    },
  };
}

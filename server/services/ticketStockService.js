export async function getTicketStockSummary(db) {
  const totals = await db.get(
    `SELECT COALESCE(SUM(CAST(ti.number_to AS INTEGER) - CAST(ts.current_serial_number AS INTEGER)), 0) as remaining
     FROM ticket_serial ts
     JOIN tickets_in ti ON ts.batch_id = ti.id
     WHERE CAST(ts.current_serial_number AS INTEGER) < CAST(ti.number_to AS INTEGER)`
  );

  const currentRollRow = await db.get(
    `SELECT ts.batch_id,
            ts.current_serial_number,
            ti.number_from,
            ti.number_to
     FROM ticket_serial ts
     JOIN tickets_in ti ON ts.batch_id = ti.id
     WHERE CAST(ts.current_serial_number AS INTEGER) < CAST(ti.number_to AS INTEGER)
     ORDER BY ts.batch_id ASC
     LIMIT 1`
  );

  let currentRoll = null;

  if (currentRollRow) {
    const current = Number(currentRollRow.current_serial_number);
    const numberTo = Number(currentRollRow.number_to);
    const serialWidth = String(currentRollRow.number_to).length;

    currentRoll = {
      remaining: numberTo - current,
      serialFrom: String(currentRollRow.number_from),
      serialTo: String(currentRollRow.number_to),
      nextSerial: String(current + 1).padStart(serialWidth, '0'),
    };
  }

  return {
    remaining: Number(totals?.remaining ?? 0),
    currentRoll,
  };
}

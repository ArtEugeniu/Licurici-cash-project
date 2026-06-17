export async function getTicketsIn(db) {
  return db.all('SELECT * FROM tickets_in ORDER BY created_at DESC');
}

export async function createTicketsBatch(db, batch) {
  const { firstSerial, lastSerial, ticketsNumber } = batch;
  const firstSerialValue = Number(firstSerial);
  const lastSerialValue = Number(lastSerial);
  const ticketsNumberValue = Number(ticketsNumber);

  if (!Number.isFinite(firstSerialValue) || !Number.isFinite(lastSerialValue) || !Number.isFinite(ticketsNumberValue)) {
    const error = new Error('Datele biletelor nu sunt valide');
    error.statusCode = 400;
    throw error;
  }

  if (ticketsNumberValue <= 0 || lastSerialValue < firstSerialValue) {
    const error = new Error('Intervalul biletelor nu este valid');
    error.statusCode = 400;
    throw error;
  }

  const expectedTicketsNumber = lastSerialValue - firstSerialValue + 1;
  if (ticketsNumberValue !== expectedTicketsNumber) {
    const error = new Error(`Cantitatea nu corespunde intervalului. Corect: ${expectedTicketsNumber}`);
    error.statusCode = 400;
    throw error;
  }

  await db.exec('BEGIN IMMEDIATE');

  try {
    const result = await db.run(
      'INSERT INTO tickets_in (number_from, number_to, total_tickets) VALUES (?, ?, ?)',
      [firstSerial, lastSerial, ticketsNumberValue]
    );

    const batchId = result.lastID;
    const startSerial = firstSerialValue - 1;

    await db.run(
      'INSERT INTO ticket_serial (batch_id, current_serial_number) VALUES (?, ?)',
      [batchId, startSerial]
    );

    const tickets = await db.all('SELECT * FROM tickets_in ORDER BY created_at DESC');

    await db.exec('COMMIT');

    return { tickets, batchId, currentSerialNumber: startSerial };
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

import { printTicket } from '../ticketPrinter.js';

export async function getSales(db) {
  return db.all('SELECT * FROM sales');
}

export async function createSale(db, sale, printData = null) {
  const { id, payment_method, quantity, type, total_sum, title, schedule_id } = sale;
  const quantityValue = Number(quantity);

  if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
    const error = new Error('Alegeti un numar valid de bilete');
    error.statusCode = 400;
    throw error;
  }

  await db.exec('BEGIN IMMEDIATE');

  try {
    const batch = await db.get(
      `SELECT ts.batch_id,
              ts.current_serial_number,
              ti.number_to
       FROM ticket_serial ts
       JOIN tickets_in ti ON ts.batch_id = ti.id
       WHERE ts.current_serial_number < ti.number_to
       ORDER BY ts.batch_id ASC
       LIMIT 1`
    );

    if (!batch) {
      const error = new Error('Nu exista bilete disponibile la casa de bilete');
      error.statusCode = 400;
      throw error;
    }

    const availableInBatch = Number(batch.number_to) - Number(batch.current_serial_number);

    if (quantityValue > availableInBatch) {
      const error = new Error(`Nu sunt suficiente bilete in rola. Ramase: ${availableInBatch}`);
      error.statusCode = 400;
      throw error;
    }

    await db.run(
      `INSERT INTO sales (id, quantity, payment_method, total_sum, type, title, schedule_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, quantityValue, payment_method, total_sum, type, title, schedule_id]
    );

    for (let i = 1; i <= quantityValue; i++) {
      const serialStr = String(Number(batch.current_serial_number) + i).padStart(
        String(batch.number_to).length,
        '0'
      );

      await db.run(
        `INSERT INTO tickets_sales (sale_id, batch_id, serial_number, schedule_id)
         VALUES (?, ?, ?, ?)`,
        [id, batch.batch_id, serialStr, schedule_id]
      );
    }

    await db.run(
      `UPDATE ticket_serial
       SET current_serial_number = ?
       WHERE batch_id = ?`,
      [Number(batch.current_serial_number) + quantityValue, batch.batch_id]
    );

    if (printData) {
      await printTicket({
        ...printData,
        quantity: quantityValue,
      });
    }

    await db.exec('COMMIT');

    return { success: true };
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

import express from 'express';
import { db } from '../db/index.js';

export const routerSales = express.Router();

routerSales.get('/', async (req, res) => {
  try {
    const sales = await db.all('SELECT * FROM sales');
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greseala la primirea datelor' });
  }
});

routerSales.post('/', async (req, res) => {

  const { id, payment_method, quantity, type, total_sum, title, schedule_id } = req.body;
  try {

    const batch = await db.get(`
        SELECT ts.batch_id,
               ts.current_serial_number,
               ti.number_to
        FROM ticket_serial ts
        JOIN tickets_in ti ON ts.batch_id = ti.id
        WHERE ts.current_serial_number < ti.number_to
        ORDER BY ts.batch_id ASC
        LIMIT 1
      `);

    if (!batch) {
      return res.status(400).json({ error: `Nu exista bilete disponibile la casa de bilete` });
    }

    const availableInBatch = batch.number_to - batch.current_serial_number;

    if (quantity > availableInBatch) {
      return res.status(400).json({ error: `Nu sunt suficiente bilete in rola. Ramase: ${availableInBatch}` });
    }

    for (let i = 1; i <= quantity; i++) {

      const serialStr = String(batch.current_serial_number + i).padStart(String(batch.number_to).length, '0')

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
      [batch.current_serial_number + quantity, batch.batch_id]
    );



    await db.run(
      `INSERT INTO sales (id, quantity, payment_method, total_sum, type, title, schedule_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, quantity, payment_method, total_sum, type, title, schedule_id]
    );

    res.status(201).json({ succes: true });
  } catch (error) {
    console.error('Eroare la adaugarea vanzarii:', error);
    res.status(500).json({ error: 'Eroare la adaugarea vanzarii' });
  }
});
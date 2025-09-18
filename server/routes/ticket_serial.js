import express from 'express';
import { db } from '../db/index.js';

export const routerTicketSerial = express.Router();

routerTicketSerial.get('/', async (req, res) => {
  try {
    const tickets = await db.all('SELECT * FROM ticket_serial ORDER BY id ASC');
    res.json(tickets);
  } catch (error) {
    console.error('Eroare la preluarea biletelor:', error);
    res.status(500).json({ error: 'Eroare la preluarea biletelor' });
  }
})

routerTicketSerial.post('/', async (req, res) => {
  try {
    const lastBatch = await db.get('SELECT id, number_from FROM tickets_in ORDER BY id DESC LIMIT 1');
    if (!lastBatch) {
      return res.status(400).json({ error: 'Nu exista pachet de bilete' });
    }

    const batchId = lastBatch.id;
    const startSerial = Number(lastBatch.number_from) - 1;

    await db.run(
      'INSERT INTO ticket_serial (batch_id, current_serial_number) VALUES (?, ?)',
      [batchId, startSerial]
    );

    res.status(201).json({ success: true, batchId, currentSerialNumber: startSerial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la crearea ticket_serial' });
  }
})
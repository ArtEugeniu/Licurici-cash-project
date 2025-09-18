import express from 'express';
import { db } from '../db/index.js'

export const routerTicketsIn = express.Router();

routerTicketsIn.get('/', async (req, res) => {
  try {
    const tickets = await db.all('SELECT * FROM tickets_in ORDER BY created_at DESC');
    res.json(tickets);
  } catch (error) {
    console.error('Eroare la preluarea biletelor:', error);
    res.status(500).json({ error: 'Eroare la preluarea biletelor' });
  }
});

routerTicketsIn.post("/", async (req, res) => {
  try {
    const { firstSerial, lastSerial, ticketsNumber } = req.body;

    await db.run('INSERT INTO tickets_in (number_from, number_to, total_tickets) VALUES (?, ?, ?)', [firstSerial, lastSerial, ticketsNumber]);

    const data = await db.all('SELECT * FROM tickets_in');
    res.json(data)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la adaugarea pachetului de bilete' })
  }
});
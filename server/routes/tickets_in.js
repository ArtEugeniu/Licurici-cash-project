import express from 'express';
import { db } from '../db/index.js'
import { createTicketsBatch, getTicketsIn } from '../services/ticketsInService.js';

export const routerTicketsIn = express.Router();

routerTicketsIn.get('/', async (req, res) => {
  try {
    const tickets = await getTicketsIn(db);
    res.json(tickets);
  } catch (error) {
    console.error('Eroare la preluarea biletelor:', error);
    res.status(500).json({ error: 'Eroare la preluarea biletelor' });
  }
});

routerTicketsIn.post("/", async (req, res) => {
  try {
    const result = await createTicketsBatch(db, req.body);
    res.json(result.tickets)
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Eroare la adaugarea pachetului de bilete' })
  }
});

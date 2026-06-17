import express from 'express';
import { db } from '../db/index.js';
import { createSale, getSales } from '../services/salesService.js';

export const routerSales = express.Router();

routerSales.get('/', async (req, res) => {
  try {
    const sales = await getSales(db);
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greseala la primirea datelor' });
  }
});

routerSales.post('/', async (req, res) => {
  try {
    const { print, ...sale } = req.body;
    await createSale(db, sale, print ?? null);
    res.status(201).json({ success: true, succes: true });
  } catch (error) {
    console.error('Eroare la adaugarea vanzarii:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Eroare la adaugarea vanzarii' });
  }
});

import express from 'express';
import { db } from '../db/index.js';
import { runIntegrityCheck } from '../services/integrityService.js';

export const routerIntegrity = express.Router();

routerIntegrity.get('/', async (req, res) => {
  try {
    const fromDate = req.query.fromDate ? String(req.query.fromDate) : '2025-10-01';
    const result = await runIntegrityCheck(db, { fromDate });

    res.json(result);
  } catch (error) {
    console.error('Error running integrity check:', error);
    res.status(500).json({ error: 'Eroare la verificarea bazei de date' });
  }
});

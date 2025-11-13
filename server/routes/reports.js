import express from 'express';
import { db } from '../db/index.js';
import { generateTicketsPeriodReport } from '../services/reportsService.js';

export const routerReports = express.Router();

// GET /api/reports/tickets_period?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
routerReports.get('/tickets_period', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    if (String(startDate) > String(endDate)) {
      return res.status(400).json({ error: 'startDate must be <= endDate' });
    }

    const report = await generateTicketsPeriodReport(db, String(startDate), String(endDate));
    res.json(report);

  } catch (error) {
    console.error('Error generating tickets_period report:', error);
    res.status(500).json({ error: 'Eroare la generarea raportului' });
  }
});

export default routerReports;

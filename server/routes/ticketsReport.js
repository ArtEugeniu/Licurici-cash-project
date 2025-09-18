import express from 'express';
import { db } from '../db/index.js';

export const routerTicketsReport = express.Router()

routerTicketsReport.get('/', async (req, res) => {
  const { startDate, endDate, scheduleId } = req.query;

  let query = `
    SELECT
      ts.serial_number,
      s.title AS spectacle,
      sa.type,            -- берем type из sales
      sa.payment_method,
      sa.created_at
    FROM tickets_sales ts
    JOIN sales sa ON ts.sale_id = sa.id
    JOIN schedule s ON ts.schedule_id = s.id
    WHERE sa.created_at BETWEEN ? AND ?
  `;

  const params = [startDate, endDate];

  if (scheduleId) {
    query += ` AND s.id = ?`;
    params.push(scheduleId);
  }

  query += ` ORDER BY sa.created_at ASC`;

  try {
    const report = await db.all(query, params);
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la generarea raportului' });
  }
})
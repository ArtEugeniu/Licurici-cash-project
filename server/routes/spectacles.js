import express from 'express';
import { db } from '../db/index.js';

export const routerSpectacles = express.Router();

// GET /api/spectacles
routerSpectacles.get('/', async (req, res) => {
  try {
    const spectacles = await db.all('SELECT * FROM spectacles');
    res.json(spectacles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greseala la primirea datelor' });
  }
});

// POST /api/spectacles
routerSpectacles.post('/', async (req, res) => {
  try {
    const { id, title, type } = req.body;

    await db.run(
      'INSERT INTO spectacles (id, title, type) VALUES (?, ?, ?)',
      id,
      title,
      type
    );

    const spectacles = await db.all('SELECT * FROM spectacles');
    res.json(spectacles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la adaugarea spectacolului' });
  }
});

// DELETE /api/spectacles/:id
routerSpectacles.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.run('DELETE FROM spectacles WHERE id = ?', id);

    const spectacles = await db.all('SELECT * FROM spectacles');
    res.json(spectacles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greseala la stergerea spectacolului' });
  }
});

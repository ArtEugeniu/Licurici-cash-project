import express from 'express';
import { db } from '../db/index.js';

export const routerSchedule = express.Router();

routerSchedule.get('/', async (req, res) => {
  try {
    const spectacles = await db.all('SELECT * FROM schedule');
    res.json(spectacles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greseala la primirea datelor' });
  }
});

routerSchedule.post('/', async (req, res) => {
  try {
    const { id, title, type, date, time } = req.body;

    const existing = await db.get(
      'SELECT * FROM schedule WHERE date = ? AND time = ?',
      [date, time]
    );

    if (existing) {
      return res.status(400).json({ error: 'Spectacol deja există în acea zi și la acea oră!' });
    }

    await db.run(
      'INSERT INTO schedule (id, title, type, date, time) VALUES (?, ?, ?, ?, ?)',
      id,
      title,
      type,
      date,
      time
    );

    res.sendStatus(200);
  } catch (error) {
    res.json({ error: error })
  }
});

routerSchedule.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.run('DELETE FROM schedule WHERE id = ?', id);
    const spectacles = await db.all('SELECT * FROM schedule');
    res.json(spectacles);
  } catch (error) {
    res.json(error)
  }
})

routerSchedule.put('/:id', async (req, res) => {

  const { title, type } = req.body;
  const { id } = req.params;

  try {
    const query = 'UPDATE schedule SET title = ?, type = ? WHERE id = ?';
    const result = await db.run(query, [title, type, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Spectacolul nu a fost gasit' })
    }

    res.json({ succes: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Eroare la editarea spectacollului' })
  }
})
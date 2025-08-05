import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: './db/tickets.db',
  driver: sqlite3.Database
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/spectacles', async (req, res) => {
  try {
    const spectacles = await db.all('SELECT * FROM spectacles');
    res.json(spectacles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greseala la primirea datelor' });
  }
});

app.post('/api/spectacles', async (req, res) => {
  try {
    const { id, title, type } = req.body;

    await db.run(
      'INSERT INTO spectacles (id, title, type) VALUES (?, ?, ?)',
      id,
      title,
      type
    )

    const spectacles = await db.all('SELECT * FROM spectacles');

    res.json(spectacles)
  } catch (error) {
    console.log(error)
  }
});

app.delete('/api/spectacles/:id', async (req, res) => {
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

app.get('/api/schedule', async (req, res) => {
  try {
    const spectacles = await db.all('SELECT * FROM schedule');
    res.json(spectacles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greseala la primirea datelor' });
  }
});

app.post('/api/schedule', async (req, res) => {
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

app.delete('/api/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.run('DELETE FROM schedule WHERE id = ?', id);
    const spectacles = await db.all('SELECT * FROM schedule');
    res.json(spectacles);
  } catch (error) {
    res.json(error)
  }
})

app.put('/api/schedule/:id', async (req, res) => {

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

app.get('/api/sales', async (req, res) => {
  try {
    const sales = await db.all('SELECT * FROM sales');
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greseala la primirea datelor' });
  }
});

app.post('/api/sales', async (req, res) => {
  console.log('POST /api/sales BODY:', req.body);
  const { id, payment_method, quantity, type, total_sum, title, schedule_id } = req.body;
  try {
    await db.run(
      `INSERT INTO sales (id, quantity, payment_method, total_sum, type, title, schedule_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, quantity, payment_method, total_sum, type, title, schedule_id]
    );


    res.status(201).json({ succes: true })
  } catch (error) {
    console.error('Ошибка при добавлении продажи:', error);
    res.status(500).json({ error: 'Eroare la adaugarea vanzarii' });
  }
});


app.listen(5000, () => console.log('Server running on http://localhost:5000'));

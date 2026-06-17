import { initDB, db } from '../db/index.js';

const rowsToInsert = [
  {
    sale_id: 'b8e14904-bd41-4e9d-9131-09e0e833e2ad',
    batch_id: 4,
    serial_number: '000140',
    schedule_id: 'a5d08d72-309a-4366-a371-07a1abb73ca2',
  },
  {
    sale_id: 'b8e14904-bd41-4e9d-9131-09e0e833e2ad',
    batch_id: 4,
    serial_number: '000141',
    schedule_id: 'a5d08d72-309a-4366-a371-07a1abb73ca2',
  },
  {
    sale_id: 'f87a3c2a-9de9-428e-84e3-3603e7da74d3',
    batch_id: 5,
    serial_number: '001004',
    schedule_id: 'd21f3b97-f1e9-4d61-a73d-e808e9b045ee',
  },
  {
    sale_id: 'r32g3c2a-9de9-428e-84e3-3603e7da74d3',
    batch_id: 5,
    serial_number: '001021',
    schedule_id: 'd21f3b97-f1e9-4d61-a73d-e808e9b045ee',
  },
];

await initDB();
await db.exec('BEGIN');

try {
  for (const row of rowsToInsert) {
    const existingSerial = await db.get(
      'SELECT id, sale_id FROM tickets_sales WHERE batch_id = ? AND serial_number = ?',
      [row.batch_id, row.serial_number]
    );

    if (existingSerial) {
      throw new Error(`Serial already exists: batch ${row.batch_id}, serial ${row.serial_number}`);
    }

    const sale = await db.get('SELECT id FROM sales WHERE id = ?', [row.sale_id]);
    if (!sale) {
      throw new Error(`Sale not found: ${row.sale_id}`);
    }

    await db.run(
      `INSERT INTO tickets_sales (sale_id, batch_id, serial_number, schedule_id)
       VALUES (?, ?, ?, ?)`,
      [row.sale_id, row.batch_id, row.serial_number, row.schedule_id]
    );
  }

  await db.exec('COMMIT');
} catch (error) {
  await db.exec('ROLLBACK');
  throw error;
}

const insertedRows = await db.all(`
  SELECT ts.id, ts.sale_id, ts.batch_id, ts.serial_number, ts.schedule_id, ts.created_at,
         sa.created_at AS sale_created_at, sa.quantity, sa.payment_method, sa.title
  FROM tickets_sales ts
  JOIN sales sa ON sa.id = ts.sale_id
  WHERE (ts.batch_id = 4 AND ts.serial_number IN ('000140','000141'))
     OR (ts.batch_id = 5 AND ts.serial_number IN ('001004','001021'))
  ORDER BY ts.batch_id, ts.serial_number
`);

console.log(JSON.stringify({ insertedRows }, null, 2));

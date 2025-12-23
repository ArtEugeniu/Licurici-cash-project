import { initDB, db } from '../db/index.js';

(async () => {
  try {
    await initDB();
    const rows = await db.all('SELECT id, title, date, time FROM schedule ORDER BY date, time');
    console.log('SCHEDULE ROWS:');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

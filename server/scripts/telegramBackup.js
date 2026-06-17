import '../config/env.js';
import { initDB } from '../db/index.js';
import { runTelegramDbBackup } from '../services/dbBackupService.js';

await initDB();

try {
  const result = await runTelegramDbBackup('manual');
  if (result.skipped) {
    console.log('Backup omis:', result.reason);
    process.exit(result.reason === 'not_configured' ? 1 : 0);
  }
  console.log('Backup trimis:', result.fileName);
} catch (error) {
  console.error('Backup eșuat:', error.message || error);
  process.exit(1);
}

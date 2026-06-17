import express from 'express';
import cors from 'cors';
import './config/env.js';
import { initDB } from './db/index.js';
import { routerSpectacles } from './routes/spectacles.js';
import { routerSchedule } from './routes/schedule.js';
import { routerSales } from './routes/sales.js';
import { routerPrint } from './routes/print.js';
import { routerTicketsIn } from './routes/tickets_in.js';
import { routerTicketSerial } from './routes/ticket_serial.js';
import { routerTicketsReport } from './routes/ticketsReport.js';
import { routerReports } from './routes/reports.js';
import { routerIntegrity } from './routes/integrity.js';
import {
  clearBackupSchedule,
  initTelegramBackups,
  runTelegramDbBackup,
} from './services/dbBackupService.js';
import { envBool } from './config/env.js';
import { isTelegramBackupConfigured, isTelegramBotTokenConfigured } from './services/telegramService.js';
import {
  processPendingTelegramMessages,
  startTelegramBotListener,
  stopTelegramBotListener,
} from './services/telegramBotListener.js';

const app = express();
app.use(cors());
app.use(express.json());

await initDB();
await initTelegramBackups();

if (isTelegramBotTokenConfigured()) {
  await processPendingTelegramMessages();
  startTelegramBotListener();
}

app.use('/api/spectacles', routerSpectacles);
app.use('/api/schedule', routerSchedule);
app.use('/api/sales', routerSales);
app.use('/api/print', routerPrint);
app.use('/api/tickets_in', routerTicketsIn);
app.use('/api/ticket_serial', routerTicketSerial);
app.use('/api/ticketsReport', routerTicketsReport);
app.use('/api/reports', routerReports);
app.use('/api/integrity', routerIntegrity);

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`[server] Oprire (${signal})...`);
  stopTelegramBotListener();
  clearBackupSchedule();
  const forceExitTimer = setTimeout(() => {
    console.error('[server] Oprirea dureaza prea mult, inchidere fortata.');
    process.exit(1);
  }, 30000);

  if (typeof forceExitTimer.unref === 'function') {
    forceExitTimer.unref();
  }

  if (isTelegramBackupConfigured() && envBool('BACKUP_ON_SHUTDOWN', true)) {
    try {
      await runTelegramDbBackup('shutdown');
    } catch (error) {
      console.error('[backup] Eroare la oprire:', error.message || error);
    }
  }

  server.close((error) => {
    clearTimeout(forceExitTimer);

    if (error) {
      console.error('[server] Eroare la inchiderea serverului:', error.message || error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGBREAK', () => shutdown('SIGBREAK'));
process.once('SIGHUP', () => shutdown('SIGHUP'));
process.once('SIGUSR2', () => shutdown('SIGUSR2'));

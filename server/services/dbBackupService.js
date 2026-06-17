import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { envBool, envNumber } from '../config/env.js';
import { isTelegramBackupConfigured, isTelegramBotTokenConfigured, sendTelegramDocument } from './telegramService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'db');
const BACKUP_DIR = path.join(DB_DIR, 'backups');
const LOCAL_BACKUP_LIMIT = envNumber('BACKUP_LOCAL_KEEP', 7);

let backupInProgress = false;
let backupTimer = null;

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function ensureBackupDir() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function pruneLocalBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith('tickets_') && name.endsWith('.db'))
    .map((name) => ({
      name,
      fullPath: path.join(BACKUP_DIR, name),
      mtime: fs.statSync(path.join(BACKUP_DIR, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const file of files.slice(LOCAL_BACKUP_LIMIT)) {
    fs.unlinkSync(file.fullPath);
  }
}

const DB_PATH = path.join(DB_DIR, 'tickets.db');

async function createSqliteBackupFile(reason = 'manual') {
  ensureBackupDir();

  const fileName = `tickets_${formatTimestamp()}.db`;
  const backupPath = path.join(BACKUP_DIR, fileName);

  try {
    await db.run('PRAGMA wal_checkpoint(FULL)');
  } catch {
    // ignore if WAL mode is not enabled
  }

  fs.copyFileSync(DB_PATH, backupPath);
  pruneLocalBackups();

  return {
    backupPath,
    fileName,
    reason,
  };
}

export async function runTelegramDbBackup(reason = 'manual') {
  if (!isTelegramBackupConfigured()) {
    console.log('[backup] Telegram nu este configurat, backup omis.');
    return { skipped: true, reason: 'not_configured' };
  }

  if (backupInProgress) {
    console.log('[backup] Un backup rulează deja, se omite dublura.');
    return { skipped: true, reason: 'in_progress' };
  }

  backupInProgress = true;

  try {
    const { backupPath, fileName } = await createSqliteBackupFile(reason);
    const sizeKb = Math.round(fs.statSync(backupPath).size / 1024);
    const caption = [
      'Licurici DB backup',
      `Motiv: ${reason}`,
      `Fișier: ${fileName}`,
      `Mărime: ${sizeKb} KB`,
      new Date().toLocaleString('ro-RO'),
      'Pentru Saved Messages: redirecționați mesajul la «Mesaje salvate».',
    ].join('\n');

    await sendTelegramDocument(backupPath, caption);
    console.log(`[backup] Trimis în Telegram: ${fileName}`);

    return {
      skipped: false,
      fileName,
      backupPath,
      sizeKb,
    };
  } catch (error) {
    console.error('[backup] Eroare:', error.message || error);
    throw error;
  } finally {
    backupInProgress = false;
  }
}

export function scheduleTelegramBackups() {
  if (!isTelegramBackupConfigured()) {
    return;
  }

  const intervalHours = envNumber('BACKUP_INTERVAL_HOURS', 24);

  if (intervalHours <= 0) {
    return;
  }

  const intervalMs = intervalHours * 60 * 60 * 1000;

  backupTimer = setInterval(() => {
    runTelegramDbBackup('interval').catch(() => {});
  }, intervalMs);

  if (typeof backupTimer.unref === 'function') {
    backupTimer.unref();
  }

  console.log(`[backup] Programat la fiecare ${intervalHours} ore.`);
}

export async function initTelegramBackups() {
  if (!isTelegramBotTokenConfigured()) {
    console.log('[backup] Pentru Telegram: setați TELEGRAM_BOT_TOKEN în server/.env');
    return;
  }

  if (!isTelegramBackupConfigured()) {
    console.log('[backup] TELEGRAM_CHAT_ID lipsește — trimiteți /start botului @LicuriciBackUpBot');
  }

  if (isTelegramBackupConfigured() && envBool('BACKUP_ON_START', false)) {
    await runTelegramDbBackup('startup').catch(() => {});
  }

  if (isTelegramBackupConfigured()) {
    scheduleTelegramBackups();
  }
}

export function clearBackupSchedule() {
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
  }
}

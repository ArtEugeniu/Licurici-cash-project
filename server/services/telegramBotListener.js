import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { envBool } from '../config/env.js';
import { deleteTelegramWebhook, fetchTelegramUpdates, sendTelegramMessage } from './telegramApi.js';
import { getTelegramBotToken, isTelegramBotTokenConfigured } from './telegramService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', '.env');

let listenerActive = false;
let updateOffset = 0;

function buildStartReply(chatId) {
  return [
    'Licurici Backup — bot activ.',
    '',
    `Chat ID-ul tău: ${chatId}`,
    '',
    'Copiați în server/.env:',
    `TELEGRAM_CHAT_ID=${chatId}`,
    '',
    'Backup-urile DB vor fi trimise aici la oprirea serverului.',
    'Pentru Mesaje salvate: redirecționați fișierul manual.',
  ].join('\n');
}

function saveChatIdToEnv(chatId) {
  const current = process.env.TELEGRAM_CHAT_ID?.trim();
  if (current === String(chatId)) {
    return false;
  }

  process.env.TELEGRAM_CHAT_ID = String(chatId);

  if (!fs.existsSync(ENV_PATH)) {
    return false;
  }

  const lines = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  let found = false;

  const updated = lines.map((line) => {
    if (line.startsWith('TELEGRAM_CHAT_ID=')) {
      found = true;
      return `TELEGRAM_CHAT_ID=${chatId}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`TELEGRAM_CHAT_ID=${chatId}`);
  }

  fs.writeFileSync(ENV_PATH, updated.join('\n'));
  console.log(`[telegram] TELEGRAM_CHAT_ID salvat automat: ${chatId}`);
  return true;
}

function getAllowedChatId() {
  return process.env.TELEGRAM_ALLOWED_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim() || null;
}

function isAuthorizedChat(chatId) {
  const allowedChatId = getAllowedChatId();
  return !allowedChatId || String(chatId) === allowedChatId;
}

async function handleUpdate(update) {
  const message = update.message || update.edited_message;
  if (!message?.chat?.id) {
    return;
  }

  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (!isAuthorizedChat(chatId)) {
    console.log(`[telegram] Mesaj ignorat de la chat neautorizat: ${chatId}`);
    return;
  }

  if (text.startsWith('/start') || text.toLowerCase() === 'start') {
    await sendTelegramMessage(chatId, buildStartReply(chatId));
    saveChatIdToEnv(chatId);
    return;
  }

  if (text === '/id') {
    await sendTelegramMessage(chatId, `Chat ID: ${chatId}`);
    saveChatIdToEnv(chatId);
    return;
  }

  await sendTelegramMessage(
    chatId,
    'Comenzi: /start — configurare backup, /id — afișează chat ID.'
  );
}

async function pollOnce(timeout = 25) {
  const updates = await fetchTelegramUpdates(updateOffset, timeout);

  for (const update of updates) {
    updateOffset = update.update_id + 1;
    await handleUpdate(update).catch((error) => {
      console.error('[telegram] Eroare la procesarea mesajului:', error.message || error);
    });
  }
}

async function listenLoop() {
  while (listenerActive) {
    try {
      await pollOnce(25);
    } catch (error) {
      console.error('[telegram] Eroare polling:', error.message || error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export async function startTelegramBotListener() {
  if (!isTelegramBotTokenConfigured() || listenerActive) {
    return;
  }

  if (!envBool('TELEGRAM_BOT_LISTEN', true)) {
    return;
  }

  await deleteTelegramWebhook();
  listenerActive = true;
  listenLoop();
  console.log('[telegram] Bot ascultă mesaje (/start, /id). Deschideți @LicuriciBackUpBot');
}

export function stopTelegramBotListener() {
  listenerActive = false;
}

export async function processPendingTelegramMessages() {
  if (!isTelegramBotTokenConfigured()) {
    return;
  }

  await deleteTelegramWebhook();

  const updates = await fetchTelegramUpdates(0, 0);
  for (const update of updates) {
    updateOffset = Math.max(updateOffset, update.update_id + 1);
    await handleUpdate(update).catch(() => {});
  }
}

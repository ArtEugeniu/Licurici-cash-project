import fs from 'fs';
import path from 'path';

function getTelegramBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

function getTelegramConfig() {
  const token = getTelegramBotToken();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return null;
  }

  return { token, chatId };
}

export function isTelegramBackupConfigured() {
  return getTelegramConfig() !== null;
}

export function isTelegramBotTokenConfigured() {
  return getTelegramBotToken() !== null;
}

export { getTelegramBotToken };

export async function sendTelegramDocument(filePath, caption = '') {
  const config = getTelegramConfig();

  if (!config) {
    throw new Error('Telegram backup nu este configurat (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Fișierul de backup nu există: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('chat_id', config.chatId);
  formData.append('document', new Blob([fileBuffer]), path.basename(filePath));

  if (caption) {
    formData.append('caption', caption);
  }

  const response = await fetch(
    `https://api.telegram.org/bot${config.token}/sendDocument`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    const message = data.description || `Telegram API error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function getTelegramBotUpdates() {
  const token = getTelegramBotToken();

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN lipsește din .env');
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates`
  );
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || 'Nu s-au putut citi update-urile Telegram');
  }

  return data.result ?? [];
}

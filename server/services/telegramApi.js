import { getTelegramBotToken } from './telegramService.js';

async function telegramApi(method, body) {
  const token = getTelegramBotToken();
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN lipsește');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API error ${response.status}`);
  }

  return data;
}

export async function sendTelegramMessage(chatId, text) {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text,
  });
}

export async function fetchTelegramUpdates(offset, timeout = 0) {
  const token = getTelegramBotToken();
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN lipsește');
  }

  const params = new URLSearchParams();
  if (offset) {
    params.set('offset', String(offset));
  }
  if (timeout > 0) {
    params.set('timeout', String(timeout));
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates?${params.toString()}`
  );
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || 'Nu s-au putut citi update-urile Telegram');
  }

  return data.result ?? [];
}

export async function deleteTelegramWebhook() {
  const token = getTelegramBotToken();
  if (!token) {
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
}

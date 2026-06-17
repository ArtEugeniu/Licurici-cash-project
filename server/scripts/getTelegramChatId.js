import '../config/env.js';
import { getTelegramBotUpdates, isTelegramBotTokenConfigured } from '../services/telegramService.js';

if (!isTelegramBotTokenConfigured()) {
  console.error('Setați TELEGRAM_BOT_TOKEN în server/.env');
  process.exit(1);
}

const updates = await getTelegramBotUpdates();

if (updates.length === 0) {
  console.log('Nu există mesaje încă.');
  console.log('1. Deschideți botul în Telegram');
  console.log('2. Apăsați Start sau trimiteți /start');
  console.log('3. Rulați din nou: npm run backup:chat-id');
  process.exit(0);
}

const seen = new Set();

console.log('Chat ID-uri găsite:');
for (const update of updates) {
  const message = update.message || update.edited_message;
  if (!message?.chat) {
    continue;
  }

  const { id, type, username, first_name, title } = message.chat;
  const key = String(id);

  if (seen.has(key)) {
    continue;
  }

  seen.add(key);

  const label =
    type === 'private'
      ? `${first_name || ''} ${username ? `@${username}` : ''}`.trim()
      : title || type;

  console.log(`- chat_id: ${id} (${type}${label ? `, ${label}` : ''})`);
}

console.log('\nCopiați chat_id în server/.env ca TELEGRAM_CHAT_ID=');

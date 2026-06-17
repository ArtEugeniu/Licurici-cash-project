import '../config/env.js';
import { processPendingTelegramMessages, startTelegramBotListener } from '../services/telegramBotListener.js';
import { isTelegramBotTokenConfigured } from '../services/telegramService.js';

if (!isTelegramBotTokenConfigured()) {
  console.error('Setați TELEGRAM_BOT_TOKEN în server/.env');
  process.exit(1);
}

console.log('Bot pornit. Deschideți @LicuriciBackUpBot și trimiteți /start');
console.log('Oprire: Ctrl+C');

await processPendingTelegramMessages();
startTelegramBotListener();

process.on('SIGINT', () => process.exit(0));

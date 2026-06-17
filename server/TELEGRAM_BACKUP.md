# Backup DB în Telegram

Baza `tickets.db` se copiază corect (SQLite backup) și se trimite ca fișier în Telegram.

## Configurare (5 minute)

### 1. Creați botul

1. Deschideți [@BotFather](https://t.me/BotFather) în Telegram
2. `/newbot` → alegeți nume și username
3. Copiați **tokenul** (ex: `7123456789:AAH...`)

### 2. Porniți conversația cu botul

1. Deschideți botul creat
2. Apăsați **Start** (sau trimiteți `/start`)

### 3. Aflați chat_id

```bash
cd server
copy .env.example .env
# lipiți TELEGRAM_BOT_TOKEN în .env

npm run backup:chat-id
```

Copiați `chat_id` în `.env`:

```
TELEGRAM_CHAT_ID=123456789
```

### 4. Test manual

```bash
npm run backup:telegram
```

În Telegram ar trebui să primiți fișierul `.db`.

## Mesaje salvate (Saved Messages)

Botul Telegram **nu poate trimite direct** în «Mesaje salvate» — doar în chatul cu botul (sau într-un canal privat).

**Varianta simplă:** primiți fișierul în chatul cu botul → **Redirecționați** → **Mesaje salvate** (2 atingeri).

**Varianta arhivă:** creați un **canal privat**, adăugați botul ca administrator, folosiți `chat_id`-ul canalului (număr negativ) ca `TELEGRAM_CHAT_ID`.

## Când se face backup automat

| Eveniment | Setare | Implicit |
|-----------|--------|----------|
| La pornirea serverului | `BACKUP_ON_START` | `false` |
| La oprirea serverului | `BACKUP_ON_SHUTDOWN` | `true` |
| La fiecare N ore | `BACKUP_INTERVAL_HOURS=24` | `24` (`0` = dezactivat) |

Copii locale: `server/db/backups/` (ultimele 7 implicit).

## Variabile .env

| Variabilă | Implicit | Descriere |
|-----------|----------|-----------|
| `TELEGRAM_BOT_TOKEN` | — | Token de la BotFather |
| `TELEGRAM_CHAT_ID` | — | ID-ul dvs. sau al canalului privat |
| `BACKUP_ON_START` | `false` | Backup la pornirea serverului |
| `BACKUP_ON_SHUTDOWN` | `true` | Backup la oprire (Ctrl+C) |
| `BACKUP_INTERVAL_HOURS` | `24` | `0` = dezactivat |
| `BACKUP_LOCAL_KEEP` | `7` | Copii locale păstrate |

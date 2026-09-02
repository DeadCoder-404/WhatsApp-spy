# WhatsApp Multi-Device Automation Bot (Terminal & Python CLI)

A Python CLI and command-line automation bot for WhatsApp Multi-Device with **Phone Number Pairing Code (No QR scan required)**, Profile updates, WhatsApp Status broadcasts, Automated Replies, Gemini AI smart responses, and Live Message Listening.

---

## Quick Start in Terminal

### 1. Run Interactive CLI Shell
```bash
python3 scripts/whatsapp_bot.py
```

### 2. Link WhatsApp Account using Phone Number (Pairing Code)
```bash
python3 scripts/whatsapp_bot.py --link +1234567890
```
> The bot will generate an 8-character pairing code (e.g. `ABCD-1234`).
> Go to **WhatsApp > Settings > Linked Devices > Link a Device > Link with phone number instead** and enter the code.

---

## Command Line Interface (CLI) Arguments

| Command / Flag | Description | Example |
|---|---|---|
| `--link <PHONE>` | Request 8-digit Pairing Code | `python3 scripts/whatsapp_bot.py --link +1234567890` |
| `--status` | Check connection & account health | `python3 scripts/whatsapp_bot.py --status` |
| `--profile-name <NAME>` | Change WhatsApp account name | `python3 scripts/whatsapp_bot.py --profile-name "My Bot"` |
| `--profile-status <BIO>` | Change WhatsApp About/Status bio | `python3 scripts/whatsapp_bot.py --profile-status "Available 24/7"` |
| `--story <TEXT>` | Post WhatsApp Status Story broadcast | `python3 scripts/whatsapp_bot.py --story "Hello from Terminal!"` |
| `--send <NUM> --message <MSG>` | Send automated WhatsApp message | `python3 scripts/whatsapp_bot.py --send +1234567890 --message "Hi!"` |
| `--listen` | Live stream all incoming messages | `python3 scripts/whatsapp_bot.py --listen` |
| `--ai <on\|off>` | Toggle Gemini AI smart auto-responder | `python3 scripts/whatsapp_bot.py --ai on` |
| `-i, --interactive` | Launch interactive REPL terminal shell | `python3 scripts/whatsapp_bot.py -i` |

---

## Interactive Shell Commands (`whatsapp-bot> `)

Once inside the interactive terminal shell (`python3 scripts/whatsapp_bot.py`):
```text
whatsapp-bot> link +1234567890
whatsapp-bot> status
whatsapp-bot> profile name TechSupport Bot
whatsapp-bot> profile about Automated Support 24/7
whatsapp-bot> story Exciting news! We are live.
whatsapp-bot> send +1234567890 Welcome to our channel!
whatsapp-bot> listen
whatsapp-bot> rules
whatsapp-bot> rules add price Our pricing starts at $10/mo
whatsapp-bot> ai on
whatsapp-bot> logout
```

---

## Remote Management & VPS Deployment

To connect remotely to a self-hosted instance:
```bash
export WHATSAPP_BOT_URL="https://your-bot-app.run.app"
python3 scripts/whatsapp_bot.py --status
```

For Running it in Localhost (WebApp or Desktop) use the Following Commands:

run_desktop.bat (Windows)
run_desktop.sh  (Linux)

start_localhost.bat (Windows)
start_localhost.sh  (Linux)

auto_run.py (for Auto Install)
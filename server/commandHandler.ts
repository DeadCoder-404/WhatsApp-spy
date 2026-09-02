import { botEngine } from './whatsapp';
import { storage } from './storage';
import { terminal, TerminalManager } from './terminal';

export async function executeTerminalCommand(input: string): Promise<void> {
  const trimmed = input.trim();
  if (!trimmed) return;

  // Echo user command
  terminal.log(
    'system',
    `${TerminalManager.BOLD}${TerminalManager.BRIGHT_CYAN}whatsapp-bot> ${TerminalManager.WHITE}${trimmed}${TerminalManager.RESET}`
  );

  const parts = trimmed.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'help':
    case '?': {
      const helpText = [
        `\r\n${TerminalManager.BOLD}${TerminalManager.BRIGHT_GREEN}Available WhatsApp Bot Commands:${TerminalManager.RESET}`,
        `  ${TerminalManager.BRIGHT_YELLOW}login <phone_number>${TerminalManager.RESET}     Link account with phone number (e.g. login +1234567890)`,
        `  ${TerminalManager.BRIGHT_YELLOW}pair <phone_number>${TerminalManager.RESET}      Alias for login with pairing code`,
        `  ${TerminalManager.BRIGHT_YELLOW}status${TerminalManager.RESET}                   Show WhatsApp connection and bot health`,
        `  ${TerminalManager.BRIGHT_YELLOW}session${TerminalManager.RESET}                  Inspect stored session persistence & health`,
        `  ${TerminalManager.BRIGHT_YELLOW}session export${TerminalManager.RESET}           Export portable Session Token (no-login migration)`,
        `  ${TerminalManager.BRIGHT_YELLOW}session import <token>${TerminalManager.RESET}   Restore WhatsApp session from token without login`,
        `  ${TerminalManager.BRIGHT_YELLOW}session reconnect${TerminalManager.RESET}        Force reconnect stored session socket`,
        `  ${TerminalManager.BRIGHT_YELLOW}profile name <new_name>${TerminalManager.RESET}  Change WhatsApp account display name`,
        `  ${TerminalManager.BRIGHT_YELLOW}profile about <new_bio>${TerminalManager.RESET}  Change WhatsApp Bio / About status`,
        `  ${TerminalManager.BRIGHT_YELLOW}story <message_text>${TerminalManager.RESET}    Publish WhatsApp Status Story to broadcast`,
        `  ${TerminalManager.BRIGHT_YELLOW}send <number> <message>${TerminalManager.RESET}  Send direct message to any phone number`,
        `  ${TerminalManager.BRIGHT_YELLOW}listen${TerminalManager.RESET}                   Display live message listener status & recent hits`,
        `  ${TerminalManager.BRIGHT_YELLOW}rules${TerminalManager.RESET}                    List all automated reply rules`,
        `  ${TerminalManager.BRIGHT_YELLOW}rules add <match> <text>${TerminalManager.RESET} Add quick keyword auto-reply`,
        `  ${TerminalManager.BRIGHT_YELLOW}ai <on|off>${TerminalManager.RESET}              Toggle Gemini AI smart auto-replies`,
        `  ${TerminalManager.BRIGHT_YELLOW}ai prompt <text>${TerminalManager.RESET}         Set AI system instruction persona`,
        `  ${TerminalManager.BRIGHT_YELLOW}history [count]${TerminalManager.RESET}          View recent incoming message logs`,
        `  ${TerminalManager.BRIGHT_YELLOW}logout${TerminalManager.RESET}                   Disconnect and clear session keys`,
        `  ${TerminalManager.BRIGHT_YELLOW}clear${TerminalManager.RESET}                    Clear terminal screen`,
        '',
      ].join('\r\n');
      terminal.log('system', helpText);
      break;
    }

    case 'login':
    case 'pair': {
      if (args.length === 0) {
        terminal.log('error', `Usage: ${command} <phone_number> (e.g. ${command} +1234567890)`);
        return;
      }
      const phone = args.join('');
      terminal.log('system', `Requesting 8-digit Pairing Code for: ${phone}...`);
      await botEngine.linkWithPhoneNumber(phone);
      break;
    }

    case 'status': {
      const st = botEngine.getStatus();
      const config = storage.getConfig();
      const statusText = [
        `\r\n${TerminalManager.BOLD}${TerminalManager.WHITE}=== WHATSAPP BOT STATUS ===${TerminalManager.RESET}`,
        `• ${TerminalManager.BOLD}Connection State:${TerminalManager.RESET} ${st.connected ? `${TerminalManager.BRIGHT_GREEN}CONNECTED (Online)${TerminalManager.RESET}` : `${TerminalManager.RED}${st.state.toUpperCase()}${TerminalManager.RESET}`}`,
        `• ${TerminalManager.BOLD}User Name:${TerminalManager.RESET} ${st.userName || 'Not Linked'}`,
        `• ${TerminalManager.BOLD}User JID:${TerminalManager.RESET} ${st.userJid || 'N/A'}`,
        `• ${TerminalManager.BOLD}Status Bio:${TerminalManager.RESET} ${st.userStatus || 'N/A'}`,
        `• ${TerminalManager.BOLD}Pairing Code:${TerminalManager.RESET} ${st.pairingCode ? `${TerminalManager.BRIGHT_YELLOW}${st.pairingCode}${TerminalManager.RESET}` : 'None'}`,
        `• ${TerminalManager.BOLD}Uptime:${TerminalManager.RESET} ${st.uptimeSeconds}s`,
        `• ${TerminalManager.BOLD}Auto-Reply:${TerminalManager.RESET} ${config.autoReplyGlobalEnabled ? `${TerminalManager.GREEN}Enabled${TerminalManager.RESET}` : `${TerminalManager.GRAY}Disabled${TerminalManager.RESET}`}`,
        `• ${TerminalManager.BOLD}AI Agent (${config.aiModel}):${TerminalManager.RESET} ${config.aiAutoReplyEnabled ? `${TerminalManager.BRIGHT_CYAN}Active${TerminalManager.RESET}` : `${TerminalManager.GRAY}Inactive${TerminalManager.RESET}`}`,
        '',
      ].join('\r\n');
      terminal.log('system', statusText);
      break;
    }

    case 'session': {
      const sub = args[0]?.toLowerCase();
      const meta = botEngine.getSessionMetadata();

      if (sub === 'export') {
        const token = botEngine.exportSessionToken();
        if (token) {
          terminal.log(
            'success',
            `\r\n${TerminalManager.BG_EMERALD} >>> PORTABLE WHATSAPP SESSION TOKEN <<< ${TerminalManager.RESET}\r\n` +
            `${TerminalManager.BOLD}${TerminalManager.BRIGHT_GREEN}${token}${TerminalManager.RESET}\r\n\r\n` +
            `${TerminalManager.DIM}Copy this token to restore this session on any other instance or server with: session import <token>${TerminalManager.RESET}\r\n`
          );
        } else {
          terminal.log('error', 'No stored session found to export. Link an account first.');
        }
      } else if (sub === 'import') {
        const token = args.slice(1).join('');
        if (!token) {
          terminal.log('error', 'Usage: session import <session_token_string>');
          return;
        }
        terminal.log('system', 'Importing session token and restoring cryptographic keys...');
        const res = await botEngine.importSessionToken(token);
        if (res.success) {
          terminal.log('success', res.message);
        } else {
          terminal.log('error', res.message);
        }
      } else if (sub === 'reconnect') {
        terminal.log('system', 'Triggering session reconnect...');
        await botEngine.forceReconnect();
      } else {
        // Show session metadata overview
        const sessionInfo = [
          `\r\n${TerminalManager.BOLD}${TerminalManager.WHITE}=== PERSISTENT SESSION VAULT ===${TerminalManager.RESET}`,
          `• ${TerminalManager.BOLD}Session Stored:${TerminalManager.RESET} ${meta.isStored ? `${TerminalManager.BRIGHT_GREEN}YES (Zero-Login Enabled)${TerminalManager.RESET}` : `${TerminalManager.RED}NO (Not linked)${TerminalManager.RESET}`}`,
          `• ${TerminalManager.BOLD}Account:${TerminalManager.RESET} ${meta.userName || 'N/A'} (${meta.phoneNumber ? '+' + meta.phoneNumber : 'N/A'})`,
          `• ${TerminalManager.BOLD}Auto-Restore on Boot:${TerminalManager.RESET} ${TerminalManager.GREEN}ACTIVE (Persists on reload/restart)${TerminalManager.RESET}`,
          `• ${TerminalManager.BOLD}Stored Auth Keys:${TerminalManager.RESET} ${meta.keysCount} cryptographic key files`,
          `• ${TerminalManager.BOLD}Credentials File Size:${TerminalManager.RESET} ${(meta.credsSize / 1024).toFixed(1)} KB`,
          `• ${TerminalManager.BOLD}Last Vault Snapshot:${TerminalManager.RESET} ${meta.storedAt ? new Date(meta.storedAt).toLocaleString() : 'N/A'}`,
          `\r\n${TerminalManager.CYAN}Subcommands:${TerminalManager.RESET}`,
          `  ${TerminalManager.YELLOW}session export${TerminalManager.RESET}           Get single-line session token string`,
          `  ${TerminalManager.YELLOW}session import <token>${TerminalManager.RESET}   Restore session without phone pairing`,
          `  ${TerminalManager.YELLOW}session reconnect${TerminalManager.RESET}        Force reconnect socket`,
          '',
        ].join('\r\n');
        terminal.log('system', sessionInfo);
      }
      break;
    }

    case 'profile': {
      const sub = args[0]?.toLowerCase();
      if (!sub) {
        terminal.log('error', 'Usage: profile <name|about|bio> <value>');
        return;
      }

      const value = args.slice(1).join(' ');
      if (!value) {
        terminal.log('error', `Please provide a value for "profile ${sub}"`);
        return;
      }

      if (sub === 'name') {
        const res = await botEngine.updateProfileName(value);
        if (!res.success) terminal.log('error', res.message);
      } else if (sub === 'about' || sub === 'bio' || sub === 'status') {
        const res = await botEngine.updateProfileStatus(value);
        if (!res.success) terminal.log('error', res.message);
      } else {
        terminal.log('error', `Unknown profile property "${sub}". Options: name, about, bio.`);
      }
      break;
    }

    case 'story':
    case 'status-story': {
      if (args.length === 0) {
        terminal.log('error', 'Usage: story <message_to_publish>');
        return;
      }
      const storyText = args.join(' ');
      const res = await botEngine.postStatusStory(storyText);
      if (!res.success) terminal.log('error', res.message);
      break;
    }

    case 'send': {
      if (args.length < 2) {
        terminal.log('error', 'Usage: send <phone_number> <message>');
        return;
      }
      const targetNumber = args[0];
      const message = args.slice(1).join(' ');
      const res = await botEngine.sendMessage(targetNumber, message);
      if (!res.success) terminal.log('error', res.message);
      break;
    }

    case 'listen': {
      const messages = storage.getMessages(5);
      terminal.log(
        'system',
        `\r\n${TerminalManager.BOLD}${TerminalManager.BRIGHT_CYAN}=== INCOMING MESSAGE LISTENER STATUS ===${TerminalManager.RESET}\r\n` +
        `• Active listener listening on direct chats and groups.\r\n` +
        `• Total captured in session: ${storage.getMessages(500).length} messages.\r\n` +
        `Recent 5 entries:\r\n` +
        (messages.length === 0 ? '  (No messages captured yet)\r\n' :
          messages.map(m => `  • [${new Date(m.timestamp).toLocaleTimeString()}] +${m.senderNumber} (${m.senderName}): "${m.text}"`).join('\r\n'))
      );
      break;
    }

    case 'rules': {
      const sub = args[0]?.toLowerCase();
      if (sub === 'add') {
        if (args.length < 3) {
          terminal.log('error', 'Usage: rules add <triggerKeyword> <replyText>');
          return;
        }
        const trigger = args[1];
        const reply = args.slice(2).join(' ');
        storage.addRule({
          name: `Quick Rule (${trigger})`,
          enabled: true,
          matchType: 'contains',
          triggerPattern: trigger,
          replyText: reply,
          applyTo: 'all',
          delaySeconds: 1,
          priority: 5,
        });
        terminal.log('success', `Created auto-reply rule for "${trigger}" -> "${reply}"`);
      } else {
        const rules = storage.getRules();
        terminal.log(
          'system',
          `\r\n${TerminalManager.BOLD}${TerminalManager.WHITE}=== ACTIVE AUTO-REPLY RULES ===${TerminalManager.RESET}\r\n` +
          rules.map((r, i) => `  ${i + 1}. [${r.enabled ? `${TerminalManager.GREEN}ON${TerminalManager.RESET}` : `${TerminalManager.RED}OFF${TerminalManager.RESET}`}] [${r.matchType.toUpperCase()}] "${TerminalManager.BRIGHT_YELLOW}${r.triggerPattern}${TerminalManager.RESET}" -> "${r.replyText || '(AI Dynamic Reply)'}" (Triggered: ${r.triggerCount})`).join('\r\n') + '\r\n'
        );
      }
      break;
    }

    case 'ai': {
      const sub = args[0]?.toLowerCase();
      if (sub === 'on') {
        storage.updateConfig({ aiAutoReplyEnabled: true });
        terminal.log('success', 'Gemini AI Auto-Reply agent enabled globally.');
      } else if (sub === 'off') {
        storage.updateConfig({ aiAutoReplyEnabled: false });
        terminal.log('warn', 'Gemini AI Auto-Reply agent disabled.');
      } else if (sub === 'prompt') {
        const newPrompt = args.slice(1).join(' ');
        if (!newPrompt) {
          terminal.log('error', 'Usage: ai prompt <system_instruction>');
          return;
        }
        storage.updateConfig({ aiSystemPrompt: newPrompt });
        terminal.log('success', `Updated AI system instruction to: "${newPrompt}"`);
      } else {
        terminal.log('system', `Usage: ai <on|off|prompt <text>>`);
      }
      break;
    }

    case 'history': {
      const count = parseInt(args[0], 10) || 10;
      const list = storage.getMessages(count);
      terminal.log(
        'system',
        `\r\n${TerminalManager.BOLD}${TerminalManager.WHITE}=== RECENT MESSAGES (${list.length}) ===${TerminalManager.RESET}\r\n` +
        (list.length === 0 ? '  (No messages stored)\r\n' :
          list.map(m => `  • [${new Date(m.timestamp).toLocaleTimeString()}] ${m.fromMe ? '[OUT]' : '[IN]'} +${m.senderNumber} (${m.senderName}): "${m.text}"`).join('\r\n'))
      );
      break;
    }

    case 'clear':
    case 'cls': {
      terminal.clear();
      break;
    }

    case 'logout': {
      const res = await botEngine.logout();
      if (res.success) {
        terminal.log('success', 'Logged out successfully.');
      } else {
        terminal.log('error', res.message);
      }
      break;
    }

    default: {
      terminal.log('error', `Command not recognized: "${command}". Type "help" or "?" for available commands.`);
      break;
    }
  }
}

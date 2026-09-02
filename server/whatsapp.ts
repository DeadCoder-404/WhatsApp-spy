import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  WAMessage,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { IncomingMessage, WhatsAppStatus, WhatsAppStory } from '../src/types';
import { storage } from './storage';
import { generateSmartReply } from './ai';
import { terminal, TerminalManager } from './terminal';
import { sessionVault, SessionMetadata } from './sessionVault';

const AUTH_DIR = path.join(process.cwd(), 'auth_info_baileys');

class WhatsAppBotEngine {
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private status: WhatsAppStatus = {
    connected: false,
    state: 'disconnected',
    pairingCode: null,
    phoneNumber: null,
    userJid: null,
    userName: null,
    userStatus: null,
    profilePicUrl: null,
    lastConnectedAt: null,
    uptimeSeconds: 0,
  };
  private startTime: number = Date.now();
  private uptimeInterval: NodeJS.Timeout | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private isPairing: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectDelay: number = 20000;
  private pinoLogger = pino({ level: 'silent' });

  constructor() {
    this.startUptimeTracker();
    this.startKeepAlive();

    // Auto-restore session from persistent vault if auth dir is empty
    sessionVault.restoreFromVaultIfEmpty();

    // Attempt auto-reconnect if session exists
    if (this.hasSavedSession()) {
      terminal.log('system', '🔒 Persistent session credentials detected. Auto-reconnecting without requiring login...');
      this.initSocket(false);
    } else {
      terminal.log('system', 'Ready for initial WhatsApp pairing via phone number.');
    }
  }

  private hasSavedSession(): boolean {
    return sessionVault.hasStoredSession();
  }

  private startUptimeTracker(): void {
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
    this.uptimeInterval = setInterval(() => {
      if (this.status.connected) {
        this.status.uptimeSeconds = Math.floor((Date.now() - (this.status.lastConnectedAt ? new Date(this.status.lastConnectedAt).getTime() : this.startTime)) / 1000);
      }
    }, 1000);
  }

  private startKeepAlive(): void {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(async () => {
      if (this.sock && this.status.connected) {
        try {
          // Send light presence heartbeat to prevent socket timeout
          await this.sock.sendPresenceUpdate('available');
        } catch {
          // Silent keepalive catch
        }
      }
    }, 30000);
  }

  getStatus(): WhatsAppStatus {
    return { ...this.status };
  }

  getSessionMetadata(): SessionMetadata {
    return sessionVault.getSessionMetadata();
  }

  exportSessionToken(): string | null {
    return sessionVault.exportSessionToken();
  }

  async importSessionToken(token: string): Promise<{ success: boolean; message: string }> {
    const success = sessionVault.importSessionToken(token);
    if (!success) {
      return { success: false, message: 'Invalid or corrupt session token bundle' };
    }

    // Restart socket with newly imported credentials
    terminal.log('system', 'Rebooting WhatsApp engine with imported session token...');
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch {
        // ignore
      }
      this.sock = null;
    }

    await this.initSocket(false);
    return { success: true, message: 'Session restored successfully. Connecting without login...' };
  }

  async forceReconnect(): Promise<{ success: boolean; message: string }> {
    terminal.log('system', 'Executing forced session reconnection...');
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch {
        // ignore
      }
      this.sock = null;
    }
    await this.initSocket(false);
    return { success: true, message: 'Reconnection initiated.' };
  }

  private updateState(partial: Partial<WhatsAppStatus>): void {
    this.status = { ...this.status, ...partial };
    terminal.broadcastJson('bot_status', this.status);
  }

  async linkWithPhoneNumber(phoneNumber: string): Promise<{ success: boolean; code?: string; message: string }> {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanNumber || cleanNumber.length < 9 || cleanNumber.length > 15) {
      const errMsg = `Invalid phone number format: "${phoneNumber}". Please provide a full international number (e.g. +1234567890).`;
      terminal.log('error', errMsg);
      return { success: false, message: errMsg };
    }

    terminal.log('system', `Initiating WhatsApp Multi-Device pairing for number: ${TerminalManager.BOLD}${TerminalManager.BRIGHT_YELLOW}+${cleanNumber}${TerminalManager.RESET}...`);
    this.updateState({ state: 'pairing', phoneNumber: cleanNumber, pairingCode: null });

    try {
      // Ensure clean state if starting fresh pairing
      if (this.sock) {
        try {
          this.sock.end(undefined);
        } catch {
          // ignore
        }
        this.sock = null;
      }

      await this.initSocket(true, cleanNumber);
      return { success: true, message: 'Pairing code request submitted.' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Pairing failed: ${errorMsg}`);
      this.updateState({ state: 'disconnected', pairingCode: null });
      return { success: false, message: errorMsg };
    }
  }

  private async initSocket(requestPairing = false, targetPhoneNumber?: string): Promise<void> {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as [number, number, number] }));

    terminal.log('system', `Loaded Baileys Engine (WhatsApp Protocol v${version.join('.')})`);

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.pinoLogger),
      },
      logger: this.pinoLogger,
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '22.04.4'],
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    this.sock = sock;

    // Handle Pairing Code Generation
    if (requestPairing && targetPhoneNumber && !sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          terminal.log('system', `Requesting 8-digit Pairing Code from WhatsApp multi-device server for +${targetPhoneNumber}...`);
          const code = await sock.requestPairingCode(targetPhoneNumber);
          const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
          
          this.updateState({ pairingCode: formattedCode });

          terminal.log(
            'success',
            `\r\n${TerminalManager.BG_EMERALD} >>> PAIRING CODE GENERATED <<< ${TerminalManager.RESET}\r\n` +
            `${TerminalManager.BOLD}${TerminalManager.BRIGHT_GREEN}CODE: ${formattedCode}${TerminalManager.RESET}\r\n` +
            `${TerminalManager.WHITE}1. Open WhatsApp on your phone\r\n` +
            `2. Tap Settings (or 3 dots) > ${TerminalManager.BOLD}Linked Devices${TerminalManager.RESET}\r\n` +
            `3. Tap ${TerminalManager.BOLD}"Link a Device"${TerminalManager.RESET} > Tap ${TerminalManager.CYAN}"Link with phone number instead"${TerminalManager.RESET}\r\n` +
            `4. Enter the code: ${TerminalManager.BOLD}${TerminalManager.BRIGHT_YELLOW}${formattedCode}${TerminalManager.RESET}\r\n`
          );
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          terminal.log('error', `Could not request pairing code: ${errMsg}`);
        }
      }, 3000);
    }

    // Persist credentials on every update to disk AND to persistent session vault
    sock.ev.on('creds.update', () => {
      saveCreds();
      sessionVault.backupToVault(this.status.phoneNumber, this.status.userJid, this.status.userName);
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !requestPairing) {
        terminal.log('system', 'QR code generated for WhatsApp Web link.');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        terminal.log(
          'warn',
          `Connection closed (${(lastDisconnect?.error as Error)?.message || 'Status Code ' + statusCode}). Auto-reconnect: ${shouldReconnect}`
        );

        if (shouldReconnect) {
          this.reconnectAttempts++;
          const delay = Math.min(3000 * Math.pow(1.5, Math.min(this.reconnectAttempts, 5)), this.maxReconnectDelay);
          this.updateState({ connected: false, state: 'reconnecting' });
          terminal.log('system', `Re-establishing persistent WhatsApp session in ${(delay / 1000).toFixed(1)}s (Attempt #${this.reconnectAttempts})...`);
          setTimeout(() => this.initSocket(false), delay);
        } else {
          this.updateState({ connected: false, state: 'logged_out', pairingCode: null });
          terminal.log('error', 'WhatsApp session was explicitly logged out from device. Please link again with pairing code.');
        }
      } else if (connection === 'open') {
        this.reconnectAttempts = 0;
        const user = sock.user;
        const jid = user?.id || '';
        const name = user?.name || user?.notify || 'WhatsApp Bot';
        
        terminal.log(
          'success',
          `🎉 ${TerminalManager.BOLD}${TerminalManager.BRIGHT_GREEN}WhatsApp Bot Session Active & Connected!${TerminalManager.RESET} Account: ${name} (${jid})`
        );

        // Fetch user status bio
        let bio = 'Online';
        try {
          const statusRes: any = await sock.fetchStatus(jid);
          if (statusRes && typeof statusRes.status === 'string') {
            bio = statusRes.status;
          } else if (Array.isArray(statusRes) && statusRes[0]?.status) {
            bio = statusRes[0].status;
          }
        } catch {
          // fallback
        }

        const phone = jid.split(':')[0].replace(/[^0-9]/g, '');

        this.updateState({
          connected: true,
          state: 'connected',
          pairingCode: null,
          userJid: jid,
          userName: name,
          userStatus: bio,
          phoneNumber: phone || this.status.phoneNumber,
          lastConnectedAt: new Date().toISOString(),
        });

        // Backup to persistent vault
        sessionVault.backupToVault(phone || this.status.phoneNumber, jid, name);
      }
    });

    // Listen to ALL incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' && type !== 'append') return;

      for (const m of messages) {
        await this.handleIncomingMessage(m);
      }
    });
  }

  private async handleIncomingMessage(m: WAMessage): Promise<void> {
    if (!m.message) return;

    const messageContent = m.message;
    const isFromMe = m.key.fromMe || false;
    const remoteJid = m.key.remoteJid || '';
    const isGroup = remoteJid.endsWith('@g.us');
    const senderJid = m.key.participant || remoteJid;
    const senderNumber = senderJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const senderName = m.pushName || senderNumber || 'Unknown';

    // Extract text content
    let text = '';
    let messageType: IncomingMessage['messageType'] = 'text';
    let hasMedia = false;

    if (messageContent.conversation) {
      text = messageContent.conversation;
      messageType = 'text';
    } else if (messageContent.extendedTextMessage?.text) {
      text = messageContent.extendedTextMessage.text;
      messageType = 'text';
    } else if (messageContent.imageMessage) {
      text = messageContent.imageMessage.caption || '[Image]';
      messageType = 'image';
      hasMedia = true;
    } else if (messageContent.videoMessage) {
      text = messageContent.videoMessage.caption || '[Video]';
      messageType = 'video';
      hasMedia = true;
    } else if (messageContent.audioMessage) {
      text = '[Audio Voice Message]';
      messageType = 'audio';
      hasMedia = true;
    } else if (messageContent.documentMessage) {
      text = `[Document: ${messageContent.documentMessage.fileName || 'file'}]`;
      messageType = 'document';
      hasMedia = true;
    } else if (messageContent.stickerMessage) {
      text = '[Sticker]';
      messageType = 'sticker';
      hasMedia = true;
    } else {
      text = '[Protocol/Media Message]';
      messageType = 'other';
    }

    if (!text.trim()) return;

    const incoming: IncomingMessage = {
      id: m.key.id || `msg-${Date.now()}`,
      senderJid,
      senderName,
      senderNumber,
      fromMe: isFromMe,
      isGroup,
      groupName: isGroup ? 'Group Chat' : undefined,
      text: text.trim(),
      timestamp: typeof m.messageTimestamp === 'number' ? m.messageTimestamp * 1000 : Date.now(),
      messageType,
      hasMedia,
      status: 'received',
    };

    // Store message
    storage.addMessage(incoming);
    terminal.broadcastJson('new_message', incoming);

    // Terminal log
    const origin = isGroup ? `[GROUP ${senderNumber}]` : `[DM +${senderNumber}]`;
    const direction = isFromMe ? `${TerminalManager.GRAY}[SENT]${TerminalManager.RESET}` : `${TerminalManager.CYAN}[INCOMING]${TerminalManager.RESET}`;
    terminal.log(
      isFromMe ? 'outgoing' : 'incoming',
      `${direction} ${TerminalManager.BOLD}${senderName}${TerminalManager.RESET} ${origin}: "${text}"`
    );

    // Ignore self messages for auto-reply loops
    if (isFromMe) return;

    // Check Auto-Reply Engine
    await this.processAutoReplies(remoteJid, senderName, senderNumber, text, isGroup);
  }

  private async processAutoReplies(
    targetJid: string,
    senderName: string,
    senderNumber: string,
    text: string,
    isGroup: boolean
  ): Promise<void> {
    const config = storage.getConfig();
    if (!config.autoReplyGlobalEnabled) return;

    // Filter group / direct per config
    if (isGroup && !config.listenGroups) return;
    if (!isGroup && !config.listenDirect) return;

    const rules = storage.getRules().filter(r => r.enabled);
    const normalizedInput = text.toLowerCase().trim();

    let ruleMatched = false;

    for (const rule of rules) {
      if (rule.applyTo === 'direct' && isGroup) continue;
      if (rule.applyTo === 'groups' && !isGroup) continue;

      let matched = false;

      if (rule.matchType === 'exact') {
        const triggers = rule.triggerPattern.toLowerCase().split(',').map(t => t.trim());
        matched = triggers.includes(normalizedInput);
      } else if (rule.matchType === 'contains') {
        const triggers = rule.triggerPattern.toLowerCase().split(',').map(t => t.trim());
        matched = triggers.some(t => t && normalizedInput.includes(t));
      } else if (rule.matchType === 'startsWith') {
        const triggers = rule.triggerPattern.toLowerCase().split(',').map(t => t.trim());
        matched = triggers.some(t => t && normalizedInput.startsWith(t));
      } else if (rule.matchType === 'regex') {
        try {
          const regex = new RegExp(rule.triggerPattern, 'i');
          matched = regex.test(text);
        } catch {
          matched = false;
        }
      } else if (rule.matchType === 'ai') {
        // AI rule triggers on prefix or if pattern matches
        const triggers = rule.triggerPattern.toLowerCase().split(',').map(t => t.trim());
        matched = triggers.length === 0 || triggers.some(t => t && (normalizedInput.startsWith(t) || normalizedInput.includes(t)));
      }

      if (matched) {
        ruleMatched = true;
        terminal.log('system', `Auto-reply rule matched: ${TerminalManager.BOLD}${rule.name}${TerminalManager.RESET} for +${senderNumber}`);
        storage.incrementRuleTrigger(rule.id);

        let replyText = rule.replyText;

        // If AI Rule
        if (rule.matchType === 'ai' || (!replyText && config.aiAutoReplyEnabled)) {
          const providerName = config.aiProvider === 'gemini' ? `Gemini (${config.aiModel})` : `Groq (${config.groqModel || 'llama-3.1-8b-instant'})`;
          terminal.log('system', `🤖 Generating AI response using ${providerName}...`);
          const aiResponse = await generateSmartReply(
            text,
            senderName,
            senderNumber,
            targetJid,
            rule.aiPrompt || config.aiSystemPrompt
          );

          if (aiResponse) {
            replyText = aiResponse;
          }
        }

        if (replyText) {
          // Format variable tags
          replyText = replyText
            .replace(/{sender}/g, senderName)
            .replace(/{number}/g, senderNumber)
            .replace(/{name}/g, senderName)
            .replace(/{time}/g, new Date().toLocaleTimeString())
            .replace(/{date}/g, new Date().toLocaleDateString())
            .replace(/{message}/g, text);

          await this.sendReplyWithTyping(targetJid, replyText, rule.delaySeconds || 1);
        }

        // Only execute highest priority matching rule
        break;
      }
    }

    // If no static rule matched, but AI Auto-Reply is globally ON, generate AI reply for conversation
    if (!ruleMatched && config.aiAutoReplyEnabled) {
      const providerName = config.aiProvider === 'gemini' ? `Gemini (${config.aiModel})` : `Groq (${config.groqModel || 'llama-3.1-8b-instant'})`;
      terminal.log('system', `🤖 AI Auto-Reply ON: Generating conversation reply via ${providerName} for ${senderName}...`);
      
      const aiResponse = await generateSmartReply(
        text,
        senderName,
        senderNumber,
        targetJid,
        config.aiSystemPrompt
      );

      if (aiResponse) {
        await this.sendReplyWithTyping(targetJid, aiResponse, 1.5);
      }
    }
  }

  private async sendReplyWithTyping(targetJid: string, replyText: string, delaySeconds: number): Promise<void> {
    if (!this.sock || !this.status.connected) {
      terminal.log('warn', `Cannot send automated reply: Socket not connected. Reply queued: "${replyText}"`);
      return;
    }

    try {
      const config = storage.getConfig();
      if (config.typingIndicator) {
        await this.sock.sendPresenceUpdate('composing', targetJid);
      }

      const waitMs = Math.max(500, delaySeconds * 1000);
      await new Promise(res => setTimeout(res, waitMs));

      await this.sock.sendMessage(targetJid, { text: replyText });
      
      if (config.typingIndicator) {
        await this.sock.sendPresenceUpdate('paused', targetJid);
      }

      terminal.log(
        'outgoing',
        `${TerminalManager.MAGENTA}[AUTO-REPLY SENT]${TerminalManager.RESET} -> ${targetJid}: "${replyText}"`
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Failed to send automated reply to ${targetJid}: ${errMsg}`);
    }
  }

  // --- Profile Management ---

  async updateProfileName(name: string): Promise<{ success: boolean; message: string }> {
    if (!this.sock || !this.status.connected) {
      return { success: false, message: 'WhatsApp is not connected.' };
    }
    try {
      terminal.log('system', `Updating WhatsApp Profile Name to: "${name}"...`);
      await this.sock.updateProfileName(name);
      this.updateState({ userName: name });
      terminal.log('success', `Profile name updated to: ${TerminalManager.BOLD}${name}${TerminalManager.RESET}`);
      return { success: true, message: `Profile name changed to "${name}".` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Failed to update profile name: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }

  async updateProfileStatus(statusBio: string): Promise<{ success: boolean; message: string }> {
    if (!this.sock || !this.status.connected) {
      return { success: false, message: 'WhatsApp is not connected.' };
    }
    try {
      terminal.log('system', `Updating WhatsApp Bio / About Status to: "${statusBio}"...`);
      await this.sock.updateProfileStatus(statusBio);
      this.updateState({ userStatus: statusBio });
      terminal.log('success', `WhatsApp Bio / Status updated to: ${TerminalManager.BOLD}${statusBio}${TerminalManager.RESET}`);
      return { success: true, message: `Status bio changed to "${statusBio}".` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Failed to update status bio: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }

  async updateProfilePicture(base64OrBuffer: string | Buffer): Promise<{ success: boolean; message: string }> {
    if (!this.sock || !this.status.connected) {
      return { success: false, message: 'WhatsApp is not connected.' };
    }
    try {
      terminal.log('system', `Uploading new WhatsApp Profile Picture...`);
      const buffer = typeof base64OrBuffer === 'string' 
        ? Buffer.from(base64OrBuffer.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        : base64OrBuffer;

      const jid = this.sock.user?.id;
      if (!jid) throw new Error('User JID not available');

      await this.sock.updateProfilePicture(jid, buffer);
      terminal.log('success', `Profile picture updated successfully!`);
      return { success: true, message: 'Profile picture updated successfully.' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Failed to update profile picture: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }

  // --- Status / Story Posting ---

  async postStatusStory(text: string, backgroundColor = '#075E54', font = 1): Promise<{ success: boolean; message: string; story?: WhatsAppStory }> {
    if (!this.sock || !this.status.connected) {
      return { success: false, message: 'WhatsApp is not connected.' };
    }

    try {
      terminal.log('system', `Publishing new WhatsApp Status Story: "${text}"...`);

      // WhatsApp status broadcast JID
      const statusJid = 'status@broadcast';
      
      const storyMessage = {
        text,
        backgroundColor,
        font,
      };

      await this.sock.sendMessage(statusJid, storyMessage);

      const newStory: WhatsAppStory = {
        id: `story-${Date.now()}`,
        text,
        backgroundColor,
        font,
        timestamp: Date.now(),
        status: 'posted',
      };

      storage.addStory(newStory);
      terminal.broadcastJson('new_story', newStory);

      terminal.log(
        'success',
        `🎉 Status story posted to WhatsApp broadcast! Text: "${TerminalManager.BOLD}${text}${TerminalManager.RESET}"`
      );

      return { success: true, message: 'Status story posted to WhatsApp!', story: newStory };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Failed to post status story: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }

  // --- Direct Messaging ---

  async sendMessage(targetNumberOrJid: string, text: string): Promise<{ success: boolean; message: string }> {
    if (!this.sock || !this.status.connected) {
      return { success: false, message: 'WhatsApp is not connected.' };
    }

    try {
      let jid = targetNumberOrJid.trim();
      if (!jid.includes('@')) {
        const clean = jid.replace(/[^0-9]/g, '');
        jid = `${clean}@s.whatsapp.net`;
      }

      await this.sock.sendMessage(jid, { text });

      terminal.log(
        'outgoing',
        `${TerminalManager.MAGENTA}[OUTGOING MESSAGE]${TerminalManager.RESET} -> ${jid}: "${text}"`
      );

      return { success: true, message: `Message sent to ${jid}` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Failed to send message to ${targetNumberOrJid}: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.sock) {
        try {
          await this.sock.logout();
        } catch {
          // ignore
        }
        this.sock = null;
      }
      sessionVault.clearSession();
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
      this.updateState({
        connected: false,
        state: 'logged_out',
        pairingCode: null,
        userJid: null,
        userName: null,
        userStatus: null,
        phoneNumber: null,
      });
      terminal.log('warn', 'WhatsApp session logged out and persistent credentials cleared.');
      return { success: true, message: 'Logged out successfully.' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, message: errMsg };
    }
  }
}

export const botEngine = new WhatsAppBotEngine();

export interface WhatsAppStatus {
  connected: boolean;
  state: 'disconnected' | 'connecting' | 'pairing' | 'connected' | 'reconnecting' | 'logged_out';
  pairingCode: string | null;
  phoneNumber: string | null;
  userJid: string | null;
  userName: string | null;
  userStatus: string | null;
  profilePicUrl: string | null;
  lastConnectedAt: string | null;
  uptimeSeconds: number;
}

export interface IncomingMessage {
  id: string;
  senderJid: string;
  senderName: string;
  senderNumber: string;
  fromMe: boolean;
  isGroup: boolean;
  groupName?: string;
  text: string;
  timestamp: number;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'other';
  hasMedia: boolean;
  mediaUrl?: string;
  autoReplied?: boolean;
  autoReplyText?: string;
  status?: 'received' | 'read' | 'replied';
}

export interface AutoReplyRule {
  id: string;
  name: string;
  enabled: boolean;
  matchType: 'exact' | 'contains' | 'startsWith' | 'regex' | 'ai';
  triggerPattern: string;
  replyText: string;
  aiPrompt?: string;
  aiThinking?: boolean;
  applyTo: 'all' | 'direct' | 'groups';
  delaySeconds: number;
  priority: number;
  triggerCount: number;
  lastTriggeredAt?: string;
}

export interface WhatsAppStory {
  id: string;
  text: string;
  backgroundColor: string;
  font: number;
  timestamp: number;
  status: 'posted' | 'failed' | 'pending';
}

export interface BotConfig {
  autoReplyGlobalEnabled: boolean;
  aiAutoReplyEnabled: boolean;
  aiProvider: 'groq' | 'gemini';
  groqModel: string;
  groqApiKey?: string;
  groqTemperature: number;
  aiSystemPrompt: string;
  aiModel: 'gemini-3.7-flash' | 'gemini-3.1-pro-preview';
  aiThinkingLevel: 'HIGH' | 'LOW' | 'MINIMAL';
  multiDeviceMode: boolean;
  foreverSession: boolean;
  listenGroups: boolean;
  listenDirect: boolean;
  typingIndicator: boolean;
  readReceipts: boolean;
  prefix: string;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'incoming' | 'outgoing' | 'system';
  message: string;
  rawAnsi?: string;
}

export interface SessionMetadata {
  isStored: boolean;
  phoneNumber: string | null;
  userJid: string | null;
  userName: string | null;
  storedAt: string | null;
  lastSyncAt: string | null;
  keysCount: number;
  credsSize: number;
  foreverSessionActive?: boolean;
  multiDeviceSupported?: boolean;
  sessionToken?: string;
}

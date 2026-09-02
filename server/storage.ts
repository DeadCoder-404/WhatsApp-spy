import fs from 'fs';
import path from 'path';
import { AutoReplyRule, BotConfig, IncomingMessage, WhatsAppStory } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const RULES_FILE = path.join(DATA_DIR, 'rules.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const defaultBotConfig: BotConfig = {
  autoReplyGlobalEnabled: true,
  aiAutoReplyEnabled: false,
  aiProvider: 'groq',
  groqModel: 'llama-3.1-8b-instant',
  groqApiKey: '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',
  groqTemperature: 0.4,
  aiSystemPrompt: 'You are an intelligent, polite, and helpful automated WhatsApp bot assistant. Answer inquiries clearly and concisely. Keep messages within 1-3 short paragraphs.',
  aiModel: 'gemini-3.7-flash',
  aiThinkingLevel: 'HIGH',
  multiDeviceMode: true,
  foreverSession: true,
  listenGroups: true,
  listenDirect: true,
  typingIndicator: true,
  readReceipts: true,
  prefix: '!',
};

export const defaultRules: AutoReplyRule[] = [
  {
    id: 'rule-welcome',
    name: 'Greeting / Welcome',
    enabled: true,
    matchType: 'contains',
    triggerPattern: 'hello,hi,hey,start',
    replyText: 'Hello {sender}! 👋 I am an automated WhatsApp bot assistant. How can I help you today? Type *!help* to see available commands.',
    applyTo: 'all',
    delaySeconds: 1,
    priority: 1,
    triggerCount: 0,
  },
  {
    id: 'rule-status',
    name: 'Status Inquiry',
    enabled: true,
    matchType: 'exact',
    triggerPattern: '!status,status,ping',
    replyText: '🟢 *Bot Status*: Online & Active\n⏰ *Server Time*: {time}\n⚡ *Uptime*: Active',
    applyTo: 'all',
    delaySeconds: 1,
    priority: 2,
    triggerCount: 0,
  },
  {
    id: 'rule-help',
    name: 'Help Menu',
    enabled: true,
    matchType: 'exact',
    triggerPattern: '!help,help,/help',
    replyText: '🤖 *WhatsApp Bot Menu*\n\n• *!status* - Check bot uptime and connection\n• *!about* - View bot information\n• *!ping* - Latency test\n• *!info* - Account details\n\n_Auto-responses powered by WhatsApp Bot CLI_',
    applyTo: 'all',
    delaySeconds: 1,
    priority: 3,
    triggerCount: 0,
  },
  {
    id: 'rule-ai-assistant',
    name: 'AI Smart Assistant (Gemini)',
    enabled: false,
    matchType: 'ai',
    triggerPattern: '!ask,ai:,?ai',
    replyText: '',
    aiPrompt: 'Answer the user query accurately and helpfully.',
    aiThinking: true,
    applyTo: 'direct',
    delaySeconds: 2,
    priority: 10,
    triggerCount: 0,
  }
];

class StorageManager {
  private config: BotConfig;
  private rules: AutoReplyRule[];
  private messages: IncomingMessage[];
  private stories: WhatsAppStory[];

  constructor() {
    this.config = this.loadJSON(CONFIG_FILE, defaultBotConfig);
    this.rules = this.loadJSON(RULES_FILE, defaultRules);
    this.messages = this.loadJSON(MESSAGES_FILE, []);
    this.stories = this.loadJSON(STORIES_FILE, []);
  }

  private loadJSON<T>(filePath: string, fallback: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error(`Error loading ${filePath}:`, e);
    }
    return fallback;
  }

  private saveJSON(filePath: string, data: unknown): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error saving ${filePath}:`, e);
    }
  }

  // Config
  getConfig(): BotConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<BotConfig>): BotConfig {
    this.config = { ...this.config, ...updates };
    this.saveJSON(CONFIG_FILE, this.config);
    return this.config;
  }

  // Rules
  getRules(): AutoReplyRule[] {
    return [...this.rules];
  }

  saveRules(rules: AutoReplyRule[]): void {
    this.rules = rules;
    this.saveJSON(RULES_FILE, this.rules);
  }

  addRule(rule: Omit<AutoReplyRule, 'id' | 'triggerCount'>): AutoReplyRule {
    const newRule: AutoReplyRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      triggerCount: 0,
    };
    this.rules.push(newRule);
    this.saveJSON(RULES_FILE, this.rules);
    return newRule;
  }

  updateRule(id: string, updates: Partial<AutoReplyRule>): AutoReplyRule | null {
    const idx = this.rules.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.rules[idx] = { ...this.rules[idx], ...updates };
    this.saveJSON(RULES_FILE, this.rules);
    return this.rules[idx];
  }

  deleteRule(id: string): boolean {
    const initialLen = this.rules.length;
    this.rules = this.rules.filter(r => r.id !== id);
    if (this.rules.length !== initialLen) {
      this.saveJSON(RULES_FILE, this.rules);
      return true;
    }
    return false;
  }

  incrementRuleTrigger(id: string): void {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      rule.triggerCount = (rule.triggerCount || 0) + 1;
      rule.lastTriggeredAt = new Date().toISOString();
      this.saveJSON(RULES_FILE, this.rules);
    }
  }

  // Messages
  getMessages(limit = 100): IncomingMessage[] {
    return this.messages.slice(-limit).reverse();
  }

  addMessage(msg: IncomingMessage): void {
    this.messages.push(msg);
    // Keep max 500 in memory/storage
    if (this.messages.length > 500) {
      this.messages = this.messages.slice(-500);
    }
    this.saveJSON(MESSAGES_FILE, this.messages);
  }

  clearMessages(): void {
    this.messages = [];
    this.saveJSON(MESSAGES_FILE, this.messages);
  }

  // Stories
  getStories(): WhatsAppStory[] {
    return [...this.stories].reverse();
  }

  addStory(story: WhatsAppStory): void {
    this.stories.push(story);
    if (this.stories.length > 50) {
      this.stories = this.stories.slice(-50);
    }
    this.saveJSON(STORIES_FILE, this.stories);
  }
}

export const storage = new StorageManager();

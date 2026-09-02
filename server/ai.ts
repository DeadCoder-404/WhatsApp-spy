import OpenAI from 'openai';
import { storage } from './storage';
import { generateAiReply as generateGeminiReply } from './gemini';

// In-memory conversation history per contact / chat JID
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const chatHistories: Map<string, ChatMessage[]> = new Map();
const MAX_HISTORY_TURNS = 12;

let groqClient: OpenAI | null = null;

export function getGroqClient(): OpenAI {
  if (!groqClient) {
    const apiKey =
      process.env.GROQ_API_KEY ||
      storage.getConfig().groqApiKey ||
      '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';

    groqClient = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: apiKey,
    });
  }
  return groqClient;
}

export function resetGroqClient(): void {
  groqClient = null;
}

/**
 * Retrieves or initializes multi-turn chat history for a sender JID.
 */
export function getChatHistory(senderJid: string): ChatMessage[] {
  if (!chatHistories.has(senderJid)) {
    chatHistories.set(senderJid, []);
  }
  return chatHistories.get(senderJid)!;
}

/**
 * Clears chat history for a contact or resets all.
 */
export function clearChatHistory(senderJid?: string): void {
  if (senderJid) {
    chatHistories.delete(senderJid);
  } else {
    chatHistories.clear();
  }
}

/**
 * Generates an automated AI response using Groq LLaMA-3.1-8b-instant with full chat history,
 * with optional fallback to Gemini if Groq is unreachable.
 */
export async function generateSmartReply(
  userMessage: string,
  senderName: string,
  senderNumber: string,
  senderJid: string,
  customSystemPrompt?: string
): Promise<string | null> {
  const config紧 = storage.getConfig();
  const provider = config紧.aiProvider || 'groq';

  if (provider === 'gemini') {
    return generateGeminiReply(userMessage, senderName, senderNumber, customSystemPrompt);
  }

  // Use Groq LLaMA-3.1-8b-instant
  try {
    const client = getGroqClient();
    const history = getChatHistory(senderJid);

    const defaultPrompt =
      customSystemPrompt ||
      config紧.aiSystemPrompt ||
      `You are an intelligent, polite, and helpful WhatsApp AI assistant. You are chatting with ${senderName} (+${senderNumber}). Keep your answers concise, direct, helpful, and friendly (1-3 short paragraphs). Use bolding (*text*) for WhatsApp emphasis when suitable.`;

    // Format chat_history array for OpenAI SDK
    const messagesForApi: ChatMessage[] = [
      {
        role: 'system',
        content: defaultPrompt,
      },
      ...history,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Call Groq chat completions with llama-3.1-8b-instant and temperature 0.4
    const response = await client.chat.completions.create({
      model: config紧.groqModel || 'llama-3.1-8b-instant',
      messages: messagesForApi as any,
      temperature: typeof config紧.groqTemperature === 'number' ? config紧.groqTemperature : 0.4,
      max_tokens: 800,
    });

    const replyContent = response.choices?.[0]?.message?.content?.trim();

    if (replyContent) {
      // Append to in-memory history
      history.push({ role: 'user', content: userMessage });
      history.push({ role: 'assistant', content: replyContent });

      // Cap history to keep context optimal
      if (history.length > MAX_HISTORY_TURNS * 2) {
        history.splice(0, history.length - MAX_HISTORY_TURNS * 2);
      }

      return replyContent;
    }

    return null;
  } catch (error: any) {
    console.error('Groq LLaMA generation error, attempting Gemini fallback:', error?.message || error);
    // Fallback to Gemini if Groq fails
    return generateGeminiReply(userMessage, senderName, senderNumber, customSystemPrompt);
  }
}

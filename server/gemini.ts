import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { storage } from './storage';

let aiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function generateAiReply(
  userMessage: string,
  senderName: string,
  senderNumber: string,
  customPrompt?: string,
  useThinking = false
): Promise<string | null> {
  const ai = getGenAI();
  if (!ai) {
    return null;
  }

  const config = storage.getConfig();
  const systemInstruction = customPrompt || config.aiSystemPrompt ||
    'You are a smart, polite, and concise WhatsApp bot assistant That made by Apex (Nasa Cyber Hackers). Provide helpful answers in under 120 words. Format with bold and bullet points if appropriate.';

  try {
    const selectedModel = useThinking ? 'gemini-3.1-pro-preview' : 'gemini-3.7-flash';

    const requestConfig: Record<string, unknown> = {
      systemInstruction,
      temperature: 0.7,
    };

    if (useThinking || config.aiThinkingLevel === 'HIGH') {
      requestConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const promptText = `WhatsApp incoming message from ${senderName} (${senderNumber}):\n"${userMessage}"\n\nPlease formulate an automated, friendly, and helpful response for WhatsApp.`;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: promptText,
      config: requestConfig,
    });

    const reply = response.text?.trim();
    return reply || null;
  } catch (error) {
    console.error('Gemini AI generation error:', error);
    return null;
  }
}

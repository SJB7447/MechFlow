
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPTS } from "../constants";
import { DiagnosticMode } from "../types";

export interface DiagnosticResult {
  text: string;
  sources: { title: string; url: string }[];
}

export class GeminiService {
  async *streamDiagnostic(
    prompt: string, 
    history: { role: string; parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] }[],
    mode: DiagnosticMode,
    image?: { data: string; mimeType: string }
  ) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const userParts: any[] = [{ text: prompt }];
      if (image) {
        userParts.push({
          inlineData: {
            data: image.data,
            mimeType: image.mimeType
          }
        });
      }

      const systemInstruction = SYSTEM_PROMPTS.base + SYSTEM_PROMPTS[mode];

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [
            ...history,
            { role: 'user', parts: userParts }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: mode === 'expert' ? 0.1 : 0.3, // Expert mode requires higher deterministic precision
          tools: [{ googleSearch: {} }]
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        
        const sources: { title: string; url: string }[] = [];
        if (groundingMetadata?.groundingChunks) {
          groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
              sources.push({
                title: chunk.web.title,
                url: chunk.web.uri
              });
            }
          });
        }

        yield { text, sources };
      }
    } catch (error) {
      console.error("MechFlow Engine Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();

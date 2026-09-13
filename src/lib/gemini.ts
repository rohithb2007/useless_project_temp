import { GoogleGenAI, Type } from '@google/genai';
import { ScanAnalysisData, ForensicReport, GeminiForensicPayload, VerdictType } from '../types/forensic';
import { generateFallbackReport } from './fallbackReport';

const SYSTEM_PROMPT = `You are KALLA CHIRI DETECTOR AI, a funny, dramatic Malayalam forensic AI assistant.

You receive numerical facial telemetry and a pre-determined classifier verdict:
- 'YATHARTHA_CHIRI' (Nalla Chiri / Genuine Smile)
- 'KALLA_CHIRI' (Kalla Chiri / Forced or Fake Smile)
- 'NO_SMILE' (No Chiri / Neutral Face)

Your job:
1. Generate a short, hilarious Malayalam-English / Manglish explanation/roast matching the exact verdict provided.
2. DO NOT change or override the verdict provided in the payload.
3. Be funny, suspicious, and dramatic for a college hackathon audience.

Use Malayalam expressions like:
- "Nte ponno, your mouth submitted a smile. Your eyes refused to cooperate."
- "Corporate meeting smile detected. Soul currently unavailable."
- "Chiri vannu... pakshe eyes leave eduthu."

Return ONLY valid JSON matching this exact structure:
{
  "verdict": "YATHARTHA_CHIRI" | "KALLA_CHIRI" | "NO_SMILE",
  "confidence": number (between 65 and 99),
  "summary": string,
  "evidence": [string, string, string],
  "roast": string,
  "interrogation_question": string
}`;

export async function analyzeChiriWithGemini(metrics: ScanAnalysisData): Promise<ForensicReport> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.warn('[Kalla Chiri Detector] VITE_GEMINI_API_KEY not found. Using local fallback engine.');
    return generateFallbackReport(metrics);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const payload: GeminiForensicPayload = {
      mouth_expansion_percent: metrics.mouthExpansionPercent,
      eye_squint_percent: metrics.eyeSquintPercent,
      symmetry_percent: metrics.symmetryPercent,
      smile_duration_seconds: metrics.durationSeconds,
      heuristic_suspicion_score: metrics.heuristicSuspicionScore,
      smile_score: metrics.smileScore,
      verdict: metrics.preliminaryVerdict,
    };

    const promptText = `Analyze these facial landmark telemetry measurements for verdict '${metrics.preliminaryVerdict}':\n${JSON.stringify(payload, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: {
              type: Type.STRING,
              enum: ['YATHARTHA_CHIRI', 'KALLA_CHIRI', 'NO_SMILE'],
            },
            confidence: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            evidence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            roast: { type: Type.STRING },
            interrogation_question: { type: Type.STRING },
          },
          required: ['verdict', 'confidence', 'summary', 'evidence', 'roast', 'interrogation_question'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini AI');
    }

    const parsed = JSON.parse(responseText) as {
      verdict: VerdictType;
      confidence: number;
      summary: string;
      evidence: string[];
      roast: string;
      interrogation_question: string;
    };

    // Ensure Gemini NEVER overrides the classifier verdict
    const verdict = metrics.preliminaryVerdict;

    return {
      verdict,
      confidence: Math.round(parsed.confidence || 88),
      summary: parsed.summary || 'Telemetry analysis complete.',
      evidence: parsed.evidence && parsed.evidence.length > 0 ? parsed.evidence : ['Facial telemetry evaluated'],
      roast: parsed.roast || 'Smile scan under review.',
      interrogation_question: parsed.interrogation_question || 'Care to explain this expression?',
      metrics,
      isFallback: false,
    };
  } catch (error) {
    console.error('[Kalla Chiri Detector] Gemini API call failed. Falling back to local engine:', error);
    return generateFallbackReport(metrics);
  }
}

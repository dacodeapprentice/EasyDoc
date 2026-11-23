import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const SKIPPED_KEYS = new Set<string>([
  'id',
  'photoUrl',
  'logoUrl',
  'sealUrl',
  'email',
  'senderEmail',
  'businessEmail',
  'customerEmail',
  'website',
  'phone',
  'senderPhone',
  'date',
  'surveyDate',
  'issueDate',
  'dateOfAward',
  'censusCode',
  'receiptNumber',
  'certificateId',
  'transactionRef',
  'businessTaxId',
]);

function isNonTranslatableValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  // Pure email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return true;
  // Pure URL
  if (/^https?:\/\/\S+$/i.test(trimmed)) return true;
  // Pure ISO date or ISO period without words (e.g. "2024-05-01" or "2020-01-01 – 2024-05-01")
  if (/^\d{4}-\d{2}-\d{2}(\s*[–\-—to]+\s*\d{4}-\d{2}-\d{2})?$/.test(trimmed)) return true;
  // Pure numbers / currency / phone numbers without letters
  if (/^[\d\s+\-().,/:%$€£]+$/.test(trimmed)) return true;
  return false;
}

function collectTranslatableFields(
  node: unknown,
  currentPath: string,
  out: Record<string, string>
): void {
  if (typeof node === 'string') {
    if (!isNonTranslatableValue(node)) {
      out[currentPath] = node;
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      collectTranslatableFields(item, `${currentPath}.${index}`, out);
    });
    return;
  }

  if (node && typeof node === 'object') {
    for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
      if (SKIPPED_KEYS.has(key)) continue;
      if (val === null || val === undefined || typeof val === 'number' || typeof val === 'boolean') {
        continue;
      }
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      collectTranslatableFields(val, nextPath, out);
    }
  }
}

function setValueAtPath(target: unknown, dotPath: string, value: string): void {
  const parts = dotPath.split('.');
  let cursor: any = target;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (cursor == null || typeof cursor !== 'object') return;
    cursor = cursor[key];
  }

  const lastKey = parts[parts.length - 1];
  if (cursor != null && typeof cursor === 'object' && lastKey in cursor) {
    if (typeof cursor[lastKey] === 'string') {
      cursor[lastKey] = value;
    }
  }
}

function extractErrorDetails(err: unknown): { status: number; message: string; code: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied') ||
    lower.includes('403')
  ) {
    return {
      status: 403,
      code: 'API_KEY_INVALID',
      message: 'Invalid or missing Gemini API key. Check GEMINI_API_KEY in Settings > Secrets.',
    };
  }

  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate limit')) {
    return {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Translation rate limit reached. Please wait a moment and try again.',
    };
  }

  return {
    status: 500,
    code: 'TRANSLATION_FAILED',
    message: rawMessage || 'Failed to translate document content.',
  };
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.post('/api/translate', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({
          error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.',
          code: 'MISSING_API_KEY',
        });
        return;
      }

      const { docType, targetLanguage, content } = req.body ?? {};
      if (
        typeof docType !== 'string' ||
        typeof targetLanguage !== 'string' ||
        !targetLanguage.trim() ||
        !content ||
        typeof content !== 'object'
      ) {
        res.status(400).json({
          error: 'Invalid translation request payload.',
          code: 'INVALID_REQUEST',
        });
        return;
      }

      const translatableFields: Record<string, string> = {};
      collectTranslatableFields(content, '', translatableFields);
      const keys = Object.keys(translatableFields);

      if (keys.length === 0) {
        res.status(400).json({
          error: 'No filled text fields to translate. Fill in template fields or load a saved PDF first.',
          code: 'EMPTY_CONTENT',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = [
        `You are a professional multilingual CV and business document translator.`,
        `Translate all string values in the input JSON dictionary into ${targetLanguage.trim()}.`,
        `Strict rules:`,
        `1. Return ONLY a valid JSON object containing the exact same keys as the input JSON.`,
        `2. Translate job titles, professional summaries, work experience roles, responsibilities/highlights, skills, spoken language names/proficiency labels, academic degrees, locations/country names, and correspondence text naturally using idiomatic ${targetLanguage.trim()} terminology suitable for job applications and official documents.`,
        `3. Keep people's personal names (such as fullName, senderName, recipientName, customerName, signatory names) and company/university proper names recognizable in their original spelling unless translating a generic descriptor word.`,
        `4. Preserve any ISO dates (YYYY-MM-DD), numbers, symbols, punctuation, or formatting tokens inside strings, translating only surrounding words (for example "2021-03-01 – Present" -> keep "2021-03-01 –" and translate "Present").`,
        `5. Do not add extra keys, explanations, or markdown formatting.`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: JSON.stringify(translatableFields),
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text;
      if (!rawText) {
        res.status(502).json({
          error: 'Empty response received from translation model.',
          code: 'EMPTY_MODEL_RESPONSE',
        });
        return;
      }

      let parsedTranslations: Record<string, unknown>;
      try {
        parsedTranslations = JSON.parse(rawText);
      } catch {
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        parsedTranslations = JSON.parse(cleaned);
      }

      const updatedContent = structuredClone(content);
      let translatedCount = 0;

      for (const key of keys) {
        const translatedValue = parsedTranslations[key];
        if (typeof translatedValue === 'string' && translatedValue.trim().length > 0) {
          setValueAtPath(updatedContent, key, translatedValue.trim());
          translatedCount += 1;
        }
      }

      res.json({
        translatedContent: updatedContent,
        translatedCount,
        targetLanguage: targetLanguage.trim(),
      });
    } catch (err) {
      const details = extractErrorDetails(err);
      console.error('Translation endpoint error:', err);
      res.status(details.status).json({
        error: details.message,
        code: details.code,
      });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EasyDoc server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

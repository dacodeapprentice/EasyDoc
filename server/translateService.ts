import { GoogleGenAI } from '@google/genai';

const ALLOWED_DOC_TYPES = new Set<string>([
  'cv',
  'letter',
  'census',
  'receipt',
  'certificate',
]);

const FORBIDDEN_PATH_KEYS = new Set<string>(['__proto__', 'constructor', 'prototype']);

export const SKIPPED_KEYS = new Set<string>([
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

export function isNonTranslatableValue(value: string): boolean {
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

export function collectTranslatableFields(
  node: unknown,
  currentPath: string,
  out: Record<string, string>
): void {
  if (typeof node === 'string') {
    if (currentPath && !isNonTranslatableValue(node)) {
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
      if (SKIPPED_KEYS.has(key) || FORBIDDEN_PATH_KEYS.has(key)) continue;
      if (val === null || val === undefined || typeof val === 'number' || typeof val === 'boolean') {
        continue;
      }
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      collectTranslatableFields(val, nextPath, out);
    }
  }
}

export function setValueAtPath(target: unknown, dotPath: string, value: string): void {
  const parts = dotPath.split('.');
  if (parts.some((part) => FORBIDDEN_PATH_KEYS.has(part))) return;

  let cursor: any = target;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (cursor == null || typeof cursor !== 'object') return;
    if (!Object.prototype.hasOwnProperty.call(cursor, key)) return;
    cursor = cursor[key];
  }

  const lastKey = parts[parts.length - 1];
  if (
    cursor != null &&
    typeof cursor === 'object' &&
    Object.prototype.hasOwnProperty.call(cursor, lastKey) &&
    typeof cursor[lastKey] === 'string'
  ) {
    cursor[lastKey] = value;
  }
}

export function chunkTranslatableFields(
  fields: Record<string, string>,
  maxKeysPerChunk = 25,
  maxCharsPerChunk = 6000
): Array<Record<string, string>> {
  const entries = Object.entries(fields);
  if (entries.length === 0) return [];

  const chunks: Array<Record<string, string>> = [];
  let currentChunk: Record<string, string> = {};
  let currentKeyCount = 0;
  let currentCharCount = 0;

  for (const [key, value] of entries) {
    const entryChars = key.length + value.length + 12;
    if (
      currentKeyCount > 0 &&
      (currentKeyCount >= maxKeysPerChunk || currentCharCount + entryChars > maxCharsPerChunk)
    ) {
      chunks.push(currentChunk);
      currentChunk = {};
      currentKeyCount = 0;
      currentCharCount = 0;
    }
    currentChunk[key] = value;
    currentKeyCount += 1;
    currentCharCount += entryChars;
  }

  if (currentKeyCount > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function buildTranslationSystemInstruction(targetLanguage: string): string {
  const cleanLang = targetLanguage.trim();
  return [
    `You are a professional multilingual CV and business document translator.`,
    `Translate all string values in the input JSON dictionary into ${cleanLang}.`,
    `Strict rules:`,
    `1. Return ONLY a valid JSON object containing the exact same keys as the input JSON.`,
    `2. Translate job titles, professional summaries, work experience roles, responsibilities/highlights, skills, spoken language names/proficiency labels, academic degrees, locations/country names, and correspondence text naturally using idiomatic ${cleanLang} terminology suitable for job applications and official documents.`,
    `3. Keep people's personal names (such as fullName, senderName, recipientName, customerName, signatory names) and company/university proper names recognizable in their original spelling unless translating a generic descriptor word.`,
    `4. Preserve any ISO dates (YYYY-MM-DD), numbers, symbols, punctuation, or formatting tokens inside strings, translating only surrounding words (for example "2021-03-01 – Present" -> keep "2021-03-01 –" and translate "Present").`,
    `5. Do not add extra keys, explanations, or markdown formatting.`,
  ].join('\n');
}

export function extractErrorDetails(err: unknown): { status: number; message: string; code: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('401') ||
    lower.includes('unauthenticated') ||
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

  if (lower.includes('404') || lower.includes('not_found')) {
    return {
      status: 502,
      code: 'MODEL_NOT_FOUND',
      message: 'Translation model is temporarily unavailable. Please try again shortly.',
    };
  }

  return {
    status: 500,
    code: 'TRANSLATION_FAILED',
    message: rawMessage || 'Failed to translate document content.',
  };
}

function parseTranslationJson(rawText: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Translation model returned an unexpected JSON structure.');
  }

  return parsed as Record<string, unknown>;
}

export type TranslateServiceResult =
  | {
      ok: true;
      status: 200;
      data: {
        translatedContent: Record<string, unknown>;
        translatedCount: number;
        targetLanguage: string;
      };
    }
  | {
      ok: false;
      status: number;
      error: string;
      code: string;
    };

export async function translateDocumentRequest(params: {
  apiKey: string | undefined;
  body: unknown;
}): Promise<TranslateServiceResult> {
  try {
    const apiKey = params.apiKey;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return {
        ok: false,
        status: 500,
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      };
    }

    const payload =
      params.body && typeof params.body === 'object' && !Array.isArray(params.body)
        ? (params.body as Record<string, unknown>)
        : {};

    const { docType, targetLanguage, content } = payload;

    if (
      typeof docType !== 'string' ||
      !ALLOWED_DOC_TYPES.has(docType) ||
      typeof targetLanguage !== 'string' ||
      !targetLanguage.trim() ||
      targetLanguage.trim().length > 80 ||
      !content ||
      typeof content !== 'object' ||
      Array.isArray(content)
    ) {
      return {
        ok: false,
        status: 400,
        error: 'Invalid translation request payload.',
        code: 'INVALID_REQUEST',
      };
    }

    const translatableFields: Record<string, string> = {};
    collectTranslatableFields(content, '', translatableFields);
    const keys = Object.keys(translatableFields);

    if (keys.length === 0) {
      return {
        ok: false,
        status: 400,
        error: 'No filled text fields to translate. Fill in template fields or load a saved PDF first.',
        code: 'EMPTY_CONTENT',
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanTargetLanguage = targetLanguage.trim();
    const systemInstruction = buildTranslationSystemInstruction(cleanTargetLanguage);
    const chunks = chunkTranslatableFields(translatableFields);

    const mergedTranslations: Record<string, unknown> = {};

    for (const chunk of chunks) {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: JSON.stringify(chunk),
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text;
      if (!rawText) {
        return {
          ok: false,
          status: 502,
          error: 'Empty response received from translation model.',
          code: 'EMPTY_MODEL_RESPONSE',
        };
      }

      const parsedChunk = parseTranslationJson(rawText);
      Object.assign(mergedTranslations, parsedChunk);
    }

    const updatedContent = structuredClone(content) as Record<string, unknown>;
    let translatedCount = 0;

    for (const key of keys) {
      const translatedValue = mergedTranslations[key];
      if (typeof translatedValue === 'string' && translatedValue.trim().length > 0) {
        setValueAtPath(updatedContent, key, translatedValue.trim());
        translatedCount += 1;
      }
    }

    return {
      ok: true,
      status: 200,
      data: {
        translatedContent: updatedContent,
        translatedCount,
        targetLanguage: cleanTargetLanguage,
      },
    };
  } catch (err) {
    const details = extractErrorDetails(err);
    console.error('Translation service error:', err);
    return {
      ok: false,
      status: details.status,
      error: details.message,
      code: details.code,
    };
  }
}

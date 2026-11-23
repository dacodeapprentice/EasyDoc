import { DocumentType } from '../types/document';
import { TemplateDefaultMap } from '../data/defaultData';

export interface TargetLanguageOption {
  code: string;
  label: string;
  apiName: string;
  flag: string;
}

export const TARGET_LANGUAGES: TargetLanguageOption[] = [
  { code: 'en', label: 'English (UK / US / Intl)', apiName: 'English', flag: '🇬🇧' },
  { code: 'pt', label: 'Português (PT / BR)', apiName: 'Portuguese', flag: '🇵🇹' },
  { code: 'es', label: 'Español (ES / LATAM)', apiName: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'Français (FR / CA)', apiName: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch (DE / AT / CH)', apiName: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano (IT)', apiName: 'Italian', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands (NL / BE)', apiName: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski (PL)', apiName: 'Polish', flag: '🇵🇱' },
  { code: 'sv', label: 'Svenska (SE)', apiName: 'Swedish', flag: '🇸🇪' },
  { code: 'ja', label: '日本語 (Japanese)', apiName: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: '한국어 (Korean)', apiName: 'Korean', flag: '🇰🇷' },
  { code: 'zh', label: '中文 (Simplified Chinese)', apiName: 'Simplified Chinese', flag: '🇨🇳' },
  { code: 'ar', label: 'العربية (Arabic)', apiName: 'Arabic', flag: '🇸🇦' },
];

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

function hasMeaningfulText(node: unknown): boolean {
  if (typeof node === 'string') {
    const trimmed = node.trim();
    if (!trimmed) return false;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
    if (/^https?:\/\/\S+$/i.test(trimmed)) return false;
    if (/^\d{4}-\d{2}-\d{2}(\s*[–\-—to]+\s*\d{4}-\d{2}-\d{2})?$/.test(trimmed)) return false;
    if (/^[\d\s+\-().,/:%$€£]+$/.test(trimmed)) return false;
    return true;
  }
  if (Array.isArray(node)) {
    return node.some(hasMeaningfulText);
  }
  if (node && typeof node === 'object') {
    return Object.entries(node as Record<string, unknown>).some(([key, val]) => {
      if (SKIPPED_KEYS.has(key)) return false;
      return hasMeaningfulText(val);
    });
  }
  return false;
}

export function hasTranslatableContent<T extends DocumentType>(
  _docType: T,
  content: TemplateDefaultMap[T]
): boolean {
  return hasMeaningfulText(content);
}

export interface TranslateResult<T extends DocumentType> {
  translatedContent: TemplateDefaultMap[T];
  translatedCount: number;
  targetLanguage: string;
}

export async function translateDocumentContent<T extends DocumentType>(params: {
  docType: T;
  targetLanguage: string;
  content: TemplateDefaultMap[T];
}): Promise<TranslateResult<T>> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data.error === 'string'
        ? data.error
        : `Translation request failed (${response.status})`;
    throw new Error(message);
  }

  return data as TranslateResult<T>;
}

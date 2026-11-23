import React from 'react';
import { Globe, Loader2, RotateCcw, AlertCircle, X } from 'lucide-react';
import { LanguageCode } from '../types/document';
import { getTranslation } from '../utils/i18n';
import { TARGET_LANGUAGES } from '../utils/translateContent';

interface ContentTranslatorBarProps {
  lang: LanguageCode;
  targetLangCode: string;
  onChangeTargetLang: (code: string) => void;
  onTranslate: () => void;
  onRestoreOriginal?: () => void;
  hasOriginalSnapshot: boolean;
  lastTranslatedLabel?: string | null;
  isTranslating: boolean;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export const ContentTranslatorBar: React.FC<ContentTranslatorBarProps> = ({
  lang,
  targetLangCode,
  onChangeTargetLang,
  onTranslate,
  onRestoreOriginal,
  hasOriginalSnapshot,
  lastTranslatedLabel,
  isTranslating,
  errorMessage,
  onDismissError,
}) => {
  const t = (key: string) => getTranslation(lang, key);

  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 font-sans-title">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-zinc-900 truncate">
            {t('translate_content_title')}
          </span>
        </div>

        {hasOriginalSnapshot && onRestoreOriginal && (
          <button
            type="button"
            onClick={onRestoreOriginal}
            disabled={isTranslating}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-100 px-2 py-1 rounded-md transition-colors shrink-0 disabled:opacity-50"
            title={t('restore_original_tooltip')}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('restore_original')}</span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-zinc-500 leading-snug mb-2.5">
        {t('translate_content_desc')}
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <select
          value={targetLangCode}
          onChange={(e) => onChangeTargetLang(e.target.value)}
          disabled={isTranslating}
          aria-label={t('target_language_label')}
          className="flex-1 min-w-0 h-8 px-2.5 text-xs font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer disabled:opacity-60"
        >
          {TARGET_LANGUAGES.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.flag} {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onTranslate}
          disabled={isTranslating}
          className="h-8 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t('translating_content')}</span>
            </>
          ) : (
            <span>{t('translate_action')}</span>
          )}
        </button>
      </div>

      {lastTranslatedLabel && !errorMessage && (
        <p className="mt-2 text-[11px] text-emerald-700 font-medium">
          {t('translated_to_badge')}: {lastTranslatedLabel}
        </p>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-2.5 flex items-start justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700"
        >
          <div className="flex items-start gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              className="text-rose-500 hover:text-rose-700 p-0.5 rounded shrink-0"
              aria-label={t('cancel')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

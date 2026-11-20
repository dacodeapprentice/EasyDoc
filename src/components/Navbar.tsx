import React from 'react';
import { DocumentType, LanguageCode } from '../types/document';
import {
  Download,
  Loader2,
  RefreshCw,
  Save,
  FolderOpen,
  ArrowLeft,
} from 'lucide-react';
import { LANGUAGES, getTranslation } from '../utils/i18n';
import { TEMPLATE_REGISTRY } from '../data/templateRegistry';

interface NavbarProps {
  currentType: DocumentType;
  paperSizeLabel: string;
  onRequestChangeTemplate: () => void;
  onDownloadPdf: () => void;
  isGeneratingPdf: boolean;
  onResetData: () => void;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  currentLang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentType,
  paperSizeLabel,
  onRequestChangeTemplate,
  onDownloadPdf,
  isGeneratingPdf,
  onResetData,
  onSaveProgress,
  onLoadProgress,
  currentLang,
  onChangeLang,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  const docTitle = t(TEMPLATE_REGISTRY[currentType].titleKey);

  return (
    <header className="no-print h-14 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6 border-b border-zinc-200 bg-white sticky top-0 z-40 shrink-0 w-full max-w-full">
      {/* Zone 1: Brand Wordmark + Document Context + Change Template Trigger */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onRequestChangeTemplate}
          className="text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          EasyDoc
        </button>

        <span className="text-zinc-300 hidden md:inline shrink-0" aria-hidden="true">
          /
        </span>

        <div className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
          <span className="font-medium text-zinc-900 truncate max-w-[170px]">
            {docTitle}
          </span>
          <span className="text-zinc-300 shrink-0" aria-hidden="true">·</span>
          <span className="text-xs font-mono-tabular tabular-nums text-zinc-500 whitespace-nowrap shrink-0">
            {paperSizeLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={onRequestChangeTemplate}
          title={t('change_template')}
          className="inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden sm:inline">{t('change_template')}</span>
          <span className="sm:hidden">{t('templates')}</span>
        </button>
      </div>

      {/* Zone 2: Actions & Language Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-full">
        {/* Language Switcher - Native selector */}
        <div className="relative shrink-0 flex items-center">
          <select
            value={currentLang}
            onChange={(e) => onChangeLang(e.target.value as LanguageCode)}
            className="h-9 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-medium px-2 sm:px-2.5 rounded-lg border border-zinc-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors max-w-[110px] sm:max-w-none"
            title="Change Language"
            aria-label="Change Language"
          >
            {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
              <option key={code} value={code} className="text-zinc-900 bg-white">
                {LANGUAGES[code].flag} {LANGUAGES[code].name}
              </option>
            ))}
          </select>
        </div>

        {/* Save & Load Progress Buttons */}
        <button
          type="button"
          onClick={onSaveProgress}
          title={t('save_progress')}
          className="hidden sm:inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Save className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden 2xl:inline">{t('save_progress')}</span>
        </button>

        <button
          type="button"
          onClick={onLoadProgress}
          title={t('load_progress')}
          className="hidden sm:inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden 2xl:inline">{t('load_progress')}</span>
        </button>

        <button
          type="button"
          onClick={onResetData}
          title={t('reset_template_tooltip')}
          className="hidden md:inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
          <span className="hidden 2xl:inline">{t('preset_data')}</span>
        </button>

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isGeneratingPdf}
          className="inline-flex h-9 items-center gap-1.5 px-3 sm:px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">{t('exporting')}</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('download_pdf')}</span>
              <span className="sm:hidden">PDF</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

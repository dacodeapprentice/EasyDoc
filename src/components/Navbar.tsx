import React, { useState } from 'react';
import { DocumentType, LanguageCode } from '../types/document';
import { Download, Printer, Loader2, Sparkles, Save, FolderOpen, Globe } from 'lucide-react';
import { LANGUAGES, getTranslation } from '../utils/i18n';

interface NavbarProps {
  currentType: DocumentType;
  onSelectType: (type: DocumentType) => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  isGeneratingPdf: boolean;
  onResetData: () => void;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  currentLang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentType,
  onSelectType,
  onDownloadPdf,
  onPrint,
  isGeneratingPdf,
  onResetData,
  onSaveProgress,
  onLoadProgress,
  currentLang,
  onChangeLang,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  return (
    <header className="no-print h-14 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 border-b border-zinc-200 bg-white sticky top-0 z-40 shrink-0 w-full max-w-full">
      {/* Zone 1: Single-element Brand Wordmark */}
      <div className="flex items-center shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          EasyDoc
        </a>
      </div>

      {/* Zone 2: Clean single-line text navigation links (visible on xl screens) */}
      <nav
        aria-label="Document types"
        className="hidden xl:flex items-center gap-5 text-sm font-medium text-zinc-600 shrink min-w-0 overflow-x-auto py-1 custom-scrollbar"
      >
        <button
          type="button"
          onClick={() => onSelectType('cv')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
            currentType === 'cv'
              ? 'text-zinc-900 font-semibold underline decoration-blue-600 decoration-2 underline-offset-4'
              : 'hover:text-zinc-900 hover:underline underline-offset-4'
          }`}
        >
          {t('curriculum_vitae')}
        </button>
        <button
          type="button"
          onClick={() => onSelectType('letter')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
            currentType === 'letter'
              ? 'text-zinc-900 font-semibold underline decoration-blue-600 decoration-2 underline-offset-4'
              : 'hover:text-zinc-900 hover:underline underline-offset-4'
          }`}
        >
          {t('presentation_letter')}
        </button>
        <button
          type="button"
          onClick={() => onSelectType('census')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
            currentType === 'census'
              ? 'text-zinc-900 font-semibold underline decoration-blue-600 decoration-2 underline-offset-4'
              : 'hover:text-zinc-900 hover:underline underline-offset-4'
          }`}
        >
          {t('census_record')}
        </button>
        <button
          type="button"
          onClick={() => onSelectType('receipt')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
            currentType === 'receipt'
              ? 'text-zinc-900 font-semibold underline decoration-blue-600 decoration-2 underline-offset-4'
              : 'hover:text-zinc-900 hover:underline underline-offset-4'
          }`}
        >
          {t('payment_receipt')}
        </button>
        <button
          type="button"
          onClick={() => onSelectType('certificate')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
            currentType === 'certificate'
              ? 'text-zinc-900 font-semibold underline decoration-blue-600 decoration-2 underline-offset-4'
              : 'hover:text-zinc-900 hover:underline underline-offset-4'
          }`}
        >
          {t('certificate_award')}
        </button>
      </nav>

      {/* Zone 3: Actions & Language Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-full">
        {/* Language Switcher - Native selector */}
        <div className="relative shrink-0 flex items-center">
          <select
            value={currentLang}
            onChange={(e) => onChangeLang(e.target.value as LanguageCode)}
            className="h-9 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-medium px-2.5 rounded-lg border border-zinc-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
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
          title="Reload preset realistic example data"
          className="hidden md:inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden 2xl:inline">{t('preset_data')}</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          title="Instant High-Resolution Browser Vector Print / Save PDF"
          className="inline-flex h-9 items-center gap-1.5 px-2.5 sm:px-3 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Printer className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden lg:inline">{t('print_vector')}</span>
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

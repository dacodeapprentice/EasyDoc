import React, { useEffect } from 'react';
import { LanguageCode } from '../types/document';
import { getTranslation } from '../utils/i18n';
import { X, ArrowLeftRight } from 'lucide-react';

interface ChangeTemplateModalProps {
  isOpen: boolean;
  currentDocTitle: string;
  lang: LanguageCode;
  onKeepChanges: () => void;
  onDiscardChanges: () => void;
  onCancel: () => void;
}

export const ChangeTemplateModal: React.FC<ChangeTemplateModalProps> = ({
  isOpen,
  currentDocTitle,
  lang,
  onKeepChanges,
  onDiscardChanges,
  onCancel,
}) => {
  const t = (key: string) => getTranslation(lang, key);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-template-modal-title"
    >
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden font-sans-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ArrowLeftRight className="w-4 h-4 text-blue-600 shrink-0" />
            <h2
              id="change-template-modal-title"
              className="text-base font-semibold text-zinc-900 truncate"
            >
              {t('change_template_title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t('cancel')}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-2.5">
          <div className="text-xs font-medium text-zinc-500">
            {currentDocTitle}
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed">
            {t('change_template_desc')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/70 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 text-xs sm:text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {t('cancel')}
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onDiscardChanges}
              className="h-10 px-4 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            >
              {t('discard_changes')}
            </button>
            <button
              type="button"
              onClick={onKeepChanges}
              className="h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {t('keep_changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

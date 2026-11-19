import React from 'react';
import { DocumentType, LanguageCode } from '../types/document';
import { FileText, Mail, FileSpreadsheet, Receipt, Award } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface DocumentSelectorProps {
  currentType: DocumentType;
  onSelect: (type: DocumentType) => void;
  lang?: LanguageCode;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  currentType,
  onSelect,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);

  const options: Array<{
    type: DocumentType;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      type: 'cv',
      title: t('curriculum_vitae'),
      description: 'Professional resume with career history, education, skills, and optional portrait photo.',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      type: 'letter',
      title: t('presentation_letter'),
      description: 'Formal business correspondence and cover letter with executive letterhead and branding.',
      icon: <Mail className="w-4 h-4" />,
    },
    {
      type: 'census',
      title: t('census_record'),
      description: 'Official household demographic survey with dwelling characteristics and resident roster.',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      type: 'receipt',
      title: t('payment_receipt'),
      description: 'Itemized commercial invoice and payment voucher with tax, discount, and balance totals.',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      type: 'certificate',
      title: t('certificate_award'),
      description: 'Distinguished certificate of achievement, completion, or honor with dual institutional signatories.',
      icon: <Award className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-3 font-sans-title">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
        {t('templates')}
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {options.map((option) => {
          const isSelected = currentType === option.type;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onSelect(option.type)}
              className={`p-3.5 rounded-xl border text-left transition-colors flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              <div
                className={`mt-0.5 shrink-0 transition-colors ${
                  isSelected ? 'text-blue-600' : 'text-zinc-400'
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 leading-tight">
                    {option.title}
                  </h4>
                  {isSelected && (
                    <span className="text-xs font-medium text-blue-600 shrink-0">
                      {lang === 'pt' ? 'Ativo' : lang === 'es' ? 'Activo' : lang === 'fr' ? 'Actif' : 'Active'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1 leading-snug">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { DocumentType, LanguageCode } from '../types/document';
import { TEMPLATE_LIST } from '../data/templateRegistry';
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

  const options = TEMPLATE_LIST.map(({ type, titleKey, descriptionKey, Icon }) => ({
    type,
    title: t(titleKey),
    description: t(descriptionKey),
    icon: <Icon className="w-4 h-4" />,
  }));

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
                      {t('active_badge')}
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

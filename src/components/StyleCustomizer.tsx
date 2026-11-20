import React from 'react';
import { DocumentStyle, LanguageCode } from '../types/document';
import {
  COLOR_THEME_ASSETS,
  DENSITY_ASSETS,
  FONT_ASSETS,
  PAPER_SIZE_ASSETS,
  SELECTABLE_HEADER_ACCENTS,
} from '../assets/documentAssets';
import { Palette, Type, LayoutTemplate, Maximize } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface StyleCustomizerProps {
  style: DocumentStyle;
  onChange: (updated: DocumentStyle) => void;
  lang?: LanguageCode;
}

export const StyleCustomizer: React.FC<StyleCustomizerProps> = ({ style, onChange, lang = 'en' }) => {
  const t = (k: string) => getTranslation(lang, k);

  const updateStyle = <K extends keyof DocumentStyle>(field: K, value: DocumentStyle[K]) => {
    onChange({ ...style, [field]: value });
  };

  const activePaperSize = style.paperSize || 'a4';

  return (
    <div className="space-y-5 text-xs font-sans-title">
      {/* 0. Paper Size Asset Picker */}
      <div>
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
          <Maximize className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('paper_size_title')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.values(PAPER_SIZE_ASSETS).map((spec) => {
            const isSelected = activePaperSize === spec.id;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => updateStyle('paperSize', spec.id)}
                className={`p-2.5 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                }`}
              >
                <div className="text-xs font-semibold text-zinc-900">{spec.name}</div>
                <div className="text-[10px] text-zinc-500 font-mono-tabular tabular-nums mt-0.5">
                  {spec.dimensionsLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Color Palette Asset Picker */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
          <Palette className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('color_palette')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.values(COLOR_THEME_ASSETS).map((theme) => {
            const isSelected = style.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateStyle('themeId', theme.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className="flex items-center -space-x-1 shrink-0">
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: theme.secondary }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 truncate text-[11px] leading-tight">
                    {theme.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Reading Typography Asset Picker */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
          <Type className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('reading_typography')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(FONT_ASSETS).map((fontAsset) => {
            const isSelected = style.fontFamily === fontAsset.id;
            return (
              <button
                key={fontAsset.id}
                type="button"
                onClick={() => updateStyle('fontFamily', fontAsset.id)}
                className={`p-3 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className="font-semibold text-zinc-900 text-xs">{fontAsset.name}</div>
                <div className={`${fontAsset.previewClass} text-[11px] text-zinc-500 mt-1 italic leading-snug`}>
                  {fontAsset.description}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">
          * Titles and headers use modern geometric sans-serif (Plus Jakarta Sans).
        </p>
      </div>

      {/* 3. Layout Density Asset Picker */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('margins_density')}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(DENSITY_ASSETS).map((densityAsset) => {
            const isSelected = style.density === densityAsset.id;
            return (
              <button
                key={densityAsset.id}
                type="button"
                onClick={() => updateStyle('density', densityAsset.id)}
                className={`p-2.5 rounded-xl border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 font-semibold text-blue-700'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                }`}
              >
                <div className="text-xs font-semibold">{t(densityAsset.labelKey)}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{densityAsset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Header Accent Motif Asset Picker */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="font-semibold text-zinc-700 uppercase tracking-wider mb-2.5 text-xs">
          {t('header_accent')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SELECTABLE_HEADER_ACCENTS.map((accentAsset) => {
            const isSelected = style.headerStyle === accentAsset.id;
            return (
              <button
                key={accentAsset.id}
                type="button"
                onClick={() => updateStyle('headerStyle', accentAsset.id)}
                className={`p-2.5 rounded-xl border text-center text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 font-semibold text-blue-700'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                }`}
              >
                {t(accentAsset.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

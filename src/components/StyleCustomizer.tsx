import React from 'react';
import { DocumentStyle, ColorThemeId, FontFamilyChoice, DensityChoice, HeaderStyleChoice, LanguageCode, PaperSizeId } from '../types/document';
import { COLOR_THEMES, PAPER_SIZES } from '../data/defaultData';
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
      {/* 0. Paper Size */}
      <div>
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
          <Maximize className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('paper_size_title')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(PAPER_SIZES) as PaperSizeId[]).map((sizeId) => {
            const spec = PAPER_SIZES[sizeId];
            const isSelected = activePaperSize === sizeId;
            return (
              <button
                key={sizeId}
                type="button"
                onClick={() => updateStyle('paperSize', sizeId)}
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

      {/* 1. Color Palette */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
          <Palette className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('color_palette')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.values(COLOR_THEMES).map((theme) => {
            const isSelected = style.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateStyle('themeId', theme.id as ColorThemeId)}
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

      {/* 2. Reading Typography */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
          <Type className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('reading_typography')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateStyle('fontFamily', 'source-serif' as FontFamilyChoice)}
            className={`p-3 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              style.fontFamily === 'source-serif'
                ? 'border-blue-600 bg-blue-50/50'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="font-semibold text-zinc-900 text-xs">Source Serif 4</div>
            <div className="font-serif-reading text-[11px] text-zinc-500 mt-1 italic leading-snug">
              Crisp, balanced humanist serif for high legibility.
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateStyle('fontFamily', 'lora' as FontFamilyChoice)}
            className={`p-3 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              style.fontFamily === 'lora'
                ? 'border-blue-600 bg-blue-50/50'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="font-semibold text-zinc-900 text-xs">Lora</div>
            <div className="font-serif-lora text-[11px] text-zinc-500 mt-1 italic leading-snug">
              Literary contemporary serif with graceful curves.
            </div>
          </button>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">
          * Titles and headers use modern geometric sans-serif (Plus Jakarta Sans).
        </p>
      </div>

      {/* 3. Layout Density */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('margins_density')}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'compact', label: t('compact'), desc: 'Tight margins' },
            { id: 'standard', label: t('standard'), desc: 'Balanced' },
            { id: 'generous', label: t('generous'), desc: 'Airy spacing' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateStyle('density', item.id as DensityChoice)}
              className={`p-2.5 rounded-xl border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                style.density === item.id
                  ? 'border-blue-600 bg-blue-50/50 font-semibold text-blue-700'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
              }`}
            >
              <div className="text-xs font-semibold">{item.label}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Accent Header Bar */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="font-semibold text-zinc-700 uppercase tracking-wider mb-2.5 text-xs">
          {t('header_accent')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'left-bar', label: t('left_accent') },
            { id: 'banner', label: t('top_banner') },
            { id: 'minimal', label: t('minimal') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateStyle('headerStyle', item.id as HeaderStyleChoice)}
              className={`p-2.5 rounded-xl border text-center text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                style.headerStyle === item.id
                  ? 'border-blue-600 bg-blue-50/50 font-semibold text-blue-700'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

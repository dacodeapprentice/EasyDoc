import React from 'react';
import { DocumentType, LanguageCode } from '../types/document';
import { LANGUAGES, getTranslation } from '../utils/i18n';
import { TEMPLATE_LIST } from '../data/templateRegistry';
import {
  ArrowRight,
  ArrowDown,
  FolderOpen,
} from 'lucide-react';

interface LandingPageProps {
  currentLang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
  onSelectTemplate: (type: DocumentType) => void;
  onLoadProgress: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentLang,
  onChangeLang,
  onSelectTemplate,
  onLoadProgress,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const templates = TEMPLATE_LIST.map(({ type, titleKey, descriptionKey, includesKey, Icon }) => ({
    type,
    title: t(titleKey),
    description: t(descriptionKey),
    includes: t(includesKey),
    icon: <Icon className="w-5 h-5" />,
  }));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans-title w-full max-w-full overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-8 border-b border-zinc-200 bg-white sticky top-0 z-40 shrink-0 w-full">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          EasyDoc
        </button>

        {/* Zone 2: Clean single-line text links */}
        <nav
          aria-label={t('primary_navigation')}
          className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600"
        >
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-zinc-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            {t('nav_how_it_works')}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('template-picker')}
            className="hover:text-zinc-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            {t('nav_templates')}
          </button>
        </nav>

        {/* Zone 3: Language Switcher & Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={currentLang}
            onChange={(e) => onChangeLang(e.target.value as LanguageCode)}
            className="h-9 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-medium px-2.5 rounded-lg border border-zinc-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            title={t('change_language')}
            aria-label={t('change_language')}
          >
            {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
              <option key={code} value={code} className="text-zinc-900 bg-white">
                {LANGUAGES[code].flag} {LANGUAGES[code].name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => scrollToSection('template-picker')}
            className="inline-flex h-9 items-center gap-1.5 px-3 sm:px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span>{t('hero_cta_choose')}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Hero Section: Balanced full-width editorial text placement */}
        <section
          id="how-it-works"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-10 sm:pb-12 scroll-mt-16"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-zinc-500">
              {t('hero_kicker')}
            </p>

            <h1
              style={{ fontSize: 'clamp(2.1rem, 3.8vw, 3.25rem)' }}
              className="font-bold tracking-tight text-zinc-900 leading-[1.1] text-balance mt-2.5"
            >
              {t('hero_headline')}
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl mt-4">
              {t('hero_subheadline')}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('template-picker')}
                className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>{t('hero_cta_choose')}</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onLoadProgress}
                className="h-11 px-4 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <FolderOpen className="w-4 h-4 text-zinc-500" />
                <span>{t('hero_cta_load')}</span>
              </button>
            </div>
          </div>

          {/* 3 Incremental Steps */}
          <div className="mt-10 pt-7 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900">
                {t('hero_step_1_title')}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 leading-relaxed">
                {t('hero_step_1_desc')}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-900">
                {t('hero_step_2_title')}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 leading-relaxed">
                {t('hero_step_2_desc')}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-900">
                {t('hero_step_3_title')}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 leading-relaxed">
                {t('hero_step_3_desc')}
              </p>
            </div>
          </div>
        </section>

        {/* Dividing hairline between explanation and template chooser */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-zinc-200" />
        </div>

        {/* Template Selection Window */}
        <section
          id="template-picker"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 scroll-mt-20"
        >
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
            {/* Window Header */}
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-zinc-200 bg-zinc-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                  {t('choose_template_title')}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  {t('choose_template_subtitle')}
                </p>
              </div>
              <span className="text-xs font-medium text-zinc-500 font-mono-tabular tabular-nums whitespace-nowrap shrink-0">
                5 {t('nav_templates')} · {t('format_a4')}
              </span>
            </div>

            {/* Template Grid */}
            <div className="p-4 sm:p-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <button
                  key={tpl.type}
                  type="button"
                  onClick={() => onSelectTemplate(tpl.type)}
                  className="text-left p-5 rounded-xl border border-zinc-200 bg-white hover:border-blue-600 hover:bg-zinc-50/70 transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="w-9 h-9 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-600 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50/60 transition-colors shrink-0">
                        {tpl.icon}
                      </div>
                      <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">
                        {t('format_a4')}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-zinc-900 group-hover:text-blue-700 transition-colors">
                      {tpl.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mt-1.5">
                      {tpl.description}
                    </p>

                    <p className="text-[11px] text-zinc-400 mt-3 leading-snug">
                      {tpl.includes}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>{t('use_template')}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}

              {/* 6th Card: Resume from Saved PDF (.pdf) */}
              <button
                type="button"
                onClick={onLoadProgress}
                className="text-left p-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 hover:border-blue-600 hover:bg-white transition-all flex flex-col justify-between gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="w-9 h-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-600 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors shrink-0">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 font-mono-tabular">
                      .pdf
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-zinc-900 group-hover:text-blue-700 transition-colors">
                    {t('load_card_title')}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mt-1.5">
                    {t('load_card_desc')}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-200/70 flex items-center justify-between text-xs font-semibold text-zinc-700 group-hover:text-blue-600 transition-colors">
                  <span>{t('load_card_cta')}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-zinc-200 bg-white py-5 px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-900">EasyDoc</span>
          <span>{t('footer_note')}</span>
        </div>
      </footer>
    </div>
  );
};

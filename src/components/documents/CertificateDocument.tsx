import React from 'react';
import { CertificateData, DocumentStyle, ColorTheme, LanguageCode } from '../../types/document';
import { Award, CheckCircle } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { getPaperLayout } from '../../data/defaultData';

interface CertificateDocumentProps {
  data: CertificateData;
  style: DocumentStyle;
  theme: ColorTheme;
  lang?: LanguageCode;
}

export const CertificateDocument: React.FC<CertificateDocumentProps> = ({
  data,
  style,
  theme,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const layout = getPaperLayout(style.paperSize, style.density);
  const { paper, isCompact, isLarge } = layout;
  const fontClass = style.fontFamily === 'lora' ? 'font-serif-lora' : 'font-serif-reading';

  return (
    <div
      className={`bg-white text-slate-900 w-full transition-all relative ${fontClass} flex flex-col justify-between`}
      style={{
        boxSizing: 'border-box',
        minHeight: `${paper.heightPx}px`,
        padding: `${isCompact ? 32 : isLarge ? 72 : 52}px`,
        overflowWrap: 'anywhere',
      }}
    >
      {/* Ornate Double Border */}
      <div
        className={`absolute ${
          isCompact ? 'inset-3' : isLarge ? 'inset-8' : 'inset-5'
        } pointer-events-none border-2`}
        style={{ borderColor: theme.primary }}
      />
      <div
        className={`absolute ${
          isCompact ? 'inset-4' : isLarge ? 'inset-10' : 'inset-6'
        } pointer-events-none border`}
        style={{ borderColor: theme.border }}
      />

      {/* Top Header & Emblem */}
      <div className="relative text-center pt-4">
        <div className="flex justify-center mb-3">
          <div
            className={`${
              isCompact ? 'w-10 h-10' : isLarge ? 'w-16 h-16' : 'w-12 h-12'
            } rounded-full flex items-center justify-center shadow-xs`}
            style={{ backgroundColor: theme.primaryLight }}
          >
            <Award
              className={isCompact ? 'w-5 h-5' : isLarge ? 'w-8 h-8' : 'w-6 h-6'}
              style={{ color: theme.primary }}
            />
          </div>
        </div>

        <p className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-widest text-slate-500 mb-1`}>
          {data.issuingOrganization || 'Academy of Professional Excellence'}
        </p>
        <h1
          className={`font-sans-title ${
            isCompact ? 'text-xl' : isLarge ? 'text-4xl' : 'text-3xl'
          } font-extrabold tracking-tight`}
          style={{ color: theme.textHeader }}
        >
          {data.title || 'Certificate of Achievement'}
        </h1>
        <div className="w-16 h-1 mx-auto mt-3 rounded-full" style={{ backgroundColor: theme.primary }} />
      </div>

      {/* Main Body */}
      <div
        className={`relative text-center my-8 ${
          isCompact ? 'max-w-sm space-y-2.5' : isLarge ? 'max-w-3xl space-y-6' : 'max-w-xl space-y-4'
        } mx-auto`}
      >
        <p className={`font-sans-title ${layout.metaSizeClass} uppercase tracking-wider text-slate-500`}>
          {t('in_recognition')}
        </p>

        <h2
          className={`font-sans-title ${
            isCompact ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-4xl'
          } font-extrabold`}
          style={{ color: theme.primaryDark }}
        >
          {data.recipientName || 'Recipient Name'}
        </h2>

        <p
          className={`${
            isCompact ? 'text-xs' : isLarge ? 'text-lg' : 'text-base'
          } leading-relaxed text-slate-700 italic pt-2`}
        >
          {data.description ||
            'For demonstrated mastery, rigorous academic scholarship, and distinguished technical leadership.'}
        </p>

        {data.courseOrAchievement && (
          <div
            className={`font-sans-title ${
              isCompact ? 'text-xs py-1.5 px-3' : isLarge ? 'text-lg py-3 px-6' : 'text-base py-2 px-4'
            } font-bold rounded-md inline-block mt-2 border`}
            style={{
              backgroundColor: theme.primaryLight,
              color: theme.primaryDark,
              borderColor: `${theme.primary}30`,
            }}
          >
            {data.courseOrAchievement}
          </div>
        )}

        <div className={`font-sans-title ${layout.metaSizeClass} text-slate-500 pt-3`}>
          {t('awarded_on')}:{' '}
          <strong className="text-slate-800">{data.dateOfAward || 'October 1, 2026'}</strong>
        </div>
      </div>

      {/* Dual Signatures & Seal Footer */}
      <div
        className={`relative border-t border-slate-200 pt-6 mt-6 flex flex-row items-center justify-between ${
          isCompact ? 'gap-3' : 'gap-6'
        } font-sans-title ${layout.metaSizeClass}`}
      >
        {/* Primary Signatory */}
        <div className="text-left min-w-0">
          <div className={`${isCompact ? 'w-24' : isLarge ? 'w-48' : 'w-36'} h-0.5 bg-slate-400 mb-2`} />
          <div className="font-bold text-slate-900">{data.primarySignatoryName}</div>
          <div className={`${layout.smallSizeClass} text-slate-500`}>{data.primarySignatoryTitle}</div>
        </div>

        {/* Center Seal */}
        <div className="text-center shrink-0">
          <div
            className={`${
              isCompact ? 'w-12 h-12' : isLarge ? 'w-20 h-20' : 'w-16 h-16'
            } rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1 mx-auto`}
            style={{ borderColor: theme.primary }}
          >
            <CheckCircle
              className={`${isCompact ? 'w-3 h-3' : isLarge ? 'w-5 h-5' : 'w-4 h-4'} mb-0.5`}
              style={{ color: theme.primary }}
            />
            <span className={`${isCompact ? 'text-[7px]' : isLarge ? 'text-[10px]' : 'text-[8px]'} font-bold uppercase tracking-wider text-slate-600`}>
              {t('verified')}
            </span>
          </div>
          <div className={`${isCompact ? 'text-[8px]' : 'text-[9px]'} font-mono-tabular text-slate-400 mt-1`}>
            {data.certificateId || 'CERT-0000'}
          </div>
        </div>

        {/* Secondary Signatory */}
        <div className="text-right min-w-0">
          <div className={`${isCompact ? 'w-24' : isLarge ? 'w-48' : 'w-36'} h-0.5 bg-slate-400 mb-2 ml-auto`} />
          <div className="font-bold text-slate-900">{data.secondarySignatoryName}</div>
          <div className={`${layout.smallSizeClass} text-slate-500`}>{data.secondarySignatoryTitle}</div>
        </div>
      </div>
    </div>
  );
};

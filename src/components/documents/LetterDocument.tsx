import React from 'react';
import { LetterData, DocumentStyle, ColorTheme, LanguageCode } from '../../types/document';
import { Mail, Phone, MapPin } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { getPaperLayout } from '../../data/defaultData';

interface LetterDocumentProps {
  data: LetterData;
  style: DocumentStyle;
  theme: ColorTheme;
  lang?: LanguageCode;
}

export const LetterDocument: React.FC<LetterDocumentProps> = ({
  data,
  style,
  theme,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const layout = getPaperLayout(style.paperSize, style.density);
  const { paper, isCompact, isShort, isTall, isLarge } = layout;
  const fontClass = style.fontFamily === 'lora' ? 'font-serif-lora' : 'font-serif-reading';

  return (
    <div
      className={`bg-white text-slate-900 w-full transition-all relative ${fontClass}`}
      style={{
        boxSizing: 'border-box',
        minHeight: `${paper.heightPx}px`,
        padding: `${layout.paddingPx}px`,
        overflowWrap: 'anywhere',
      }}
    >
      {/* Decorative Accents */}
      {style.headerStyle === 'left-bar' && (
        <div
          className={`absolute left-0 top-0 bottom-0 ${layout.accentBarWidthClass}`}
          style={{ backgroundColor: theme.primary }}
        />
      )}
      {style.headerStyle === 'banner' && (
        <div
          className={`absolute left-0 top-0 right-0 ${layout.accentBannerHeightClass}`}
          style={{ backgroundColor: theme.primary }}
        />
      )}

      {/* Header: Sender Letterhead */}
      <header className={`border-b ${isCompact ? 'pb-4 mb-5' : isLarge ? 'pb-8 mb-10' : 'pb-6 mb-8'} border-slate-200`}>
        <div
          className={`flex ${
            isCompact ? 'flex-col items-start gap-3' : 'flex-row items-end justify-between gap-4'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {data.logoUrl && (
              <img
                src={data.logoUrl}
                alt="Logo"
                className={`${
                  isCompact ? 'w-10 h-10' : isLarge ? 'w-16 h-16' : 'w-14 h-14'
                } object-contain rounded-md border border-slate-200 shrink-0`}
              />
            )}
            <div className="min-w-0">
              <h1
                className={`font-sans-title ${
                  isCompact ? 'text-lg' : isLarge ? 'text-3xl' : 'text-2xl'
                } font-extrabold tracking-tight`}
                style={{ color: theme.textHeader }}
              >
                {data.senderName || t('sender_name')}
              </h1>
              {data.senderTitle && (
                <p
                  className={`font-sans-title ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'} font-semibold mt-0.5`}
                  style={{ color: theme.primary }}
                >
                  {data.senderTitle}
                </p>
              )}
              {data.senderCompany && (
                <p className={`font-sans-title ${layout.metaSizeClass} text-slate-600 font-medium mt-0.5`}>
                  {data.senderCompany}
                </p>
              )}
            </div>
          </div>

          {/* Sender Contact Column */}
          <div
            className={`${
              isCompact ? 'text-left' : 'text-right'
            } font-sans-title ${layout.metaSizeClass} text-slate-500 space-y-1 shrink-0`}
          >
            {data.senderAddress && (
              <div className={`flex items-center ${isCompact ? 'justify-start' : 'justify-end'} gap-1.5`}>
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{data.senderAddress}</span>
              </div>
            )}
            {data.senderEmail && (
              <div className={`flex items-center ${isCompact ? 'justify-start' : 'justify-end'} gap-1.5`}>
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{data.senderEmail}</span>
              </div>
            )}
            {data.senderPhone && (
              <div className={`flex items-center ${isCompact ? 'justify-start' : 'justify-end'} gap-1.5`}>
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{data.senderPhone}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Date */}
      <div className={`${isCompact ? 'mb-4' : isLarge ? 'mb-8' : 'mb-6'} font-sans-title ${layout.metaSizeClass} font-semibold text-slate-600`}>
        {data.date || 'October 1, 2026'}
      </div>

      {/* Recipient Block */}
      <div className={`${layout.sectionMbClass} font-sans-title ${layout.metaSizeClass} leading-relaxed print-avoid-break`}>
        <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
          {data.recipientName}
        </div>
        {data.recipientTitle && <div className="text-slate-700">{data.recipientTitle}</div>}
        {data.recipientCompany && (
          <div className="text-slate-800 font-semibold">{data.recipientCompany}</div>
        )}
        {data.recipientAddress && <div className="text-slate-600 mt-0.5">{data.recipientAddress}</div>}
      </div>

      {/* Subject Line */}
      {data.subject && (
        <div
          className={`${isCompact ? 'mb-4 py-1.5 px-2.5 text-xs' : isLarge ? 'mb-8 py-3 px-4 text-base' : 'mb-6 py-2 px-3 text-sm'} bg-slate-50 border-l-4 font-sans-title font-bold text-slate-900 print-avoid-break`}
          style={{ borderColor: theme.primary }}
        >
          <span className={`${layout.smallSizeClass} uppercase tracking-wider text-slate-500 mr-1.5`}>
            {t('formal_subject')}:
          </span>
          <span>{data.subject}</span>
        </div>
      )}

      {/* Salutation */}
      <div className={`font-sans-title font-semibold text-slate-900 ${isCompact ? 'text-xs mb-3' : isLarge ? 'text-base mb-5' : 'text-sm mb-4'}`}>
        {data.salutation || 'Dear Colleague,'}
      </div>

      {/* Letter Body Paragraphs */}
      <div
        className={`${
          isCompact
            ? 'space-y-2.5'
            : isShort
            ? 'space-y-3'
            : isTall
            ? 'space-y-5'
            : isLarge
            ? 'space-y-6 max-w-4xl'
            : 'space-y-4'
        } ${layout.bodySizeClass} text-slate-800`}
      >
        {data.openingParagraph && <p>{data.openingParagraph}</p>}
        {data.bodyParagraphOne && <p>{data.bodyParagraphOne}</p>}
        {data.bodyParagraphTwo && <p>{data.bodyParagraphTwo}</p>}
        {data.closingParagraph && <p>{data.closingParagraph}</p>}
      </div>

      {/* Formal Signoff & Signature */}
      <div className={`${isCompact ? 'mt-5 pt-3' : isTall ? 'mt-12 pt-6' : isLarge ? 'mt-14 pt-6' : 'mt-8 pt-4'} font-sans-title print-avoid-break`}>
        <div className={`${layout.metaSizeClass} text-slate-600`}>{data.signoff || t('formal_signoff')}</div>
        <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs mt-3' : isLarge ? 'text-base mt-7' : 'text-sm mt-5'}`}>
          {data.senderName}
        </div>
        {data.senderTitle && <div className={`${layout.metaSizeClass} text-slate-600`}>{data.senderTitle}</div>}
        {data.senderCompany && <div className={`${layout.metaSizeClass} text-slate-500`}>{data.senderCompany}</div>}

        {data.enclosureNotice && (
          <div className={`mt-6 pt-3 border-t border-slate-200 ${layout.smallSizeClass} text-slate-500 italic`}>
            {data.enclosureNotice}
          </div>
        )}
      </div>
    </div>
  );
};

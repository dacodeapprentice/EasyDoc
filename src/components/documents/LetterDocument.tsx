import React from 'react';
import {
  LetterData,
  DocumentAssetBundle,
  DocumentStyle,
  ColorTheme,
  LanguageCode,
} from '../../types/document';
import { Mail, Phone, MapPin } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { resolveDocumentAssets } from '../../assets/documentAssets';
import {
  DocumentHeaderBand,
  DocumentLogo,
  DocumentSheet,
  PlaceholderText,
  hasText,
} from './TemplatePrimitives';

interface LetterDocumentProps {
  data: LetterData;
  style: DocumentStyle;
  theme?: ColorTheme;
  assets?: DocumentAssetBundle;
  lang?: LanguageCode;
}

export const LetterDocument: React.FC<LetterDocumentProps> = ({
  data,
  style,
  assets,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const mounted = assets || resolveDocumentAssets(style);
  const { theme, layout } = mounted;
  const { isCompact, isShort, isTall, isLarge } = layout;

  const hasAnySenderContact =
    hasText(data.senderAddress) || hasText(data.senderEmail) || hasText(data.senderPhone);
  const hasAnyParagraph =
    hasText(data.openingParagraph) ||
    hasText(data.bodyParagraphOne) ||
    hasText(data.bodyParagraphTwo) ||
    hasText(data.closingParagraph);

  return (
    <DocumentSheet assets={mounted}>
      {/* Correspondence Letterhead Structure */}
      <DocumentHeaderBand
        assets={mounted}
        align="end"
        left={
          <div className="flex items-center gap-3.5 min-w-0">
            {data.logoUrl && (
              <DocumentLogo src={data.logoUrl} alt="Logo" assets={mounted} />
            )}
            <div className="min-w-0">
              <h1
                className={`font-sans-title ${
                  isCompact ? 'text-lg' : isLarge ? 'text-3xl' : 'text-2xl'
                } font-extrabold tracking-tight`}
                style={hasText(data.senderName) ? { color: theme.textHeader } : undefined}
              >
                <PlaceholderText value={data.senderName} placeholder="Sender Name Here" />
              </h1>
              {(!hasText(data.senderName) || hasText(data.senderTitle)) && (
                <p
                  className={`font-sans-title ${
                    isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'
                  } font-semibold mt-0.5`}
                  style={hasText(data.senderTitle) ? { color: theme.primary } : undefined}
                >
                  <PlaceholderText value={data.senderTitle} placeholder="Sender Role or Title" />
                </p>
              )}
              {(!hasText(data.senderName) || hasText(data.senderCompany)) && (
                <p className={`font-sans-title ${layout.metaSizeClass} text-slate-600 font-medium mt-0.5`}>
                  <PlaceholderText value={data.senderCompany} placeholder="Organization Name" />
                </p>
              )}
            </div>
          </div>
        }
        right={
          <div className={`font-sans-title ${layout.metaSizeClass} text-slate-500 space-y-1`}>
            {(!hasAnySenderContact || hasText(data.senderAddress)) && (
              <div className={`flex items-center ${isCompact ? 'justify-start' : 'justify-end'} gap-1.5`}>
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <PlaceholderText value={data.senderAddress} placeholder="Street address, city, postal code" />
              </div>
            )}
            {(!hasAnySenderContact || hasText(data.senderEmail)) && (
              <div className={`flex items-center ${isCompact ? 'justify-start' : 'justify-end'} gap-1.5`}>
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <PlaceholderText value={data.senderEmail} placeholder="email@example.com" />
              </div>
            )}
            {(!hasAnySenderContact || hasText(data.senderPhone)) && (
              <div className={`flex items-center ${isCompact ? 'justify-start' : 'justify-end'} gap-1.5`}>
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <PlaceholderText value={data.senderPhone} placeholder="Phone number here" />
              </div>
            )}
          </div>
        }
      />

      {/* Date */}
      <div
        className={`${
          isCompact ? 'mb-4' : isLarge ? 'mb-8' : 'mb-6'
        } font-sans-title ${layout.metaSizeClass} font-semibold text-slate-600`}
      >
        <PlaceholderText value={data.date} placeholder="Date Here" />
      </div>

      {/* Recipient Block */}
      <div className={`${layout.sectionMbClass} font-sans-title ${layout.metaSizeClass} leading-relaxed print-avoid-break`}>
        <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
          <PlaceholderText value={data.recipientName} placeholder="Recipient Name Here" />
        </div>
        {(!hasText(data.recipientName) || hasText(data.recipientTitle)) && (
          <div className="text-slate-700">
            <PlaceholderText value={data.recipientTitle} placeholder="Recipient Title" />
          </div>
        )}
        {(!hasText(data.recipientName) || hasText(data.recipientCompany)) && (
          <div className="text-slate-800 font-semibold">
            <PlaceholderText value={data.recipientCompany} placeholder="Recipient Organization" />
          </div>
        )}
        {(!hasText(data.recipientName) || hasText(data.recipientAddress)) && (
          <div className="text-slate-600 mt-0.5">
            <PlaceholderText value={data.recipientAddress} placeholder="Recipient address here" />
          </div>
        )}
      </div>

      {/* Subject Line */}
      <div
        className={`${
          isCompact ? 'mb-4 py-1.5 px-2.5 text-xs' : isLarge ? 'mb-8 py-3 px-4 text-base' : 'mb-6 py-2 px-3 text-sm'
        } bg-slate-50 border-l-4 font-sans-title font-bold text-slate-900 print-avoid-break`}
        style={{ borderColor: theme.primary }}
      >
        <span className={`${layout.smallSizeClass} uppercase tracking-wider text-slate-500 mr-1.5`}>
          {t('formal_subject')}:
        </span>
        <PlaceholderText value={data.subject} placeholder="Document subject or topic here" />
      </div>

      {/* Salutation */}
      <div
        className={`font-sans-title font-semibold text-slate-900 ${
          isCompact ? 'text-xs mb-3' : isLarge ? 'text-base mb-5' : 'text-sm mb-4'
        }`}
      >
        <PlaceholderText value={data.salutation} placeholder="Dear Recipient," />
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
        {(!hasAnyParagraph || hasText(data.openingParagraph)) && (
          <p>
            <PlaceholderText
              value={data.openingParagraph}
              placeholder="Write a clear opening sentence introducing the purpose of this letter."
            />
          </p>
        )}
        {(!hasAnyParagraph || hasText(data.bodyParagraphOne)) && (
          <p>
            <PlaceholderText
              value={data.bodyParagraphOne}
              placeholder="Provide supporting details, background context, or key information for the reader here."
            />
          </p>
        )}
        {hasText(data.bodyParagraphTwo) && <p>{data.bodyParagraphTwo}</p>}
        {(!hasAnyParagraph || hasText(data.closingParagraph)) && (
          <p>
            <PlaceholderText
              value={data.closingParagraph}
              placeholder="Conclude with a closing remark and any next steps."
            />
          </p>
        )}
      </div>

      {/* Formal Signoff & Signature */}
      <div
        className={`${
          isCompact ? 'mt-5 pt-3' : isTall ? 'mt-12 pt-6' : isLarge ? 'mt-14 pt-6' : 'mt-8 pt-4'
        } font-sans-title print-avoid-break`}
      >
        <div className={`${layout.metaSizeClass} text-slate-600`}>
          <PlaceholderText value={data.signoff} placeholder="Sincerely," />
        </div>
        <div
          className={`font-bold text-slate-900 ${
            isCompact ? 'text-xs mt-3' : isLarge ? 'text-base mt-7' : 'text-sm mt-5'
          }`}
        >
          <PlaceholderText value={data.senderName} placeholder="Sender Name Here" />
        </div>
        {hasText(data.senderTitle) && <div className={`${layout.metaSizeClass} text-slate-600`}>{data.senderTitle}</div>}
        {hasText(data.senderCompany) && <div className={`${layout.metaSizeClass} text-slate-500`}>{data.senderCompany}</div>}

        {hasText(data.enclosureNotice) && (
          <div className={`mt-6 pt-3 border-t border-slate-200 ${layout.smallSizeClass} text-slate-500 italic`}>
            {data.enclosureNotice}
          </div>
        )}
      </div>
    </DocumentSheet>
  );
};

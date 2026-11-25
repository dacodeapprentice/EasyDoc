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
  const { theme, layout, design } = mounted;
  const { isCompact, isUltraNarrow, isShort, isTall, isLarge } = layout;

  const hasAnySenderContact =
    hasText(data.senderAddress) || hasText(data.senderEmail) || hasText(data.senderPhone);
  const hasAnyParagraph =
    hasText(data.openingParagraph) ||
    hasText(data.bodyParagraphOne) ||
    hasText(data.bodyParagraphTwo) ||
    hasText(data.closingParagraph);

  const renderRecipientBlock = (centered = false) => (
    <div
      className={`font-sans-title ${layout.metaSizeClass} leading-relaxed print-avoid-break ${
        centered ? 'text-center' : ''
      }`}
    >
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
  );

  const renderSubjectBanner = (variant: 'spine' | 'banner' | 'editorial' | 'swiss') => {
    if (variant === 'editorial') {
      return (
        <div
          className={`${
            isCompact ? 'my-4 py-2 text-xs' : isLarge ? 'my-8 py-3.5 text-base' : 'my-6 py-2.5 text-sm'
          } border-y font-sans-title font-bold text-slate-900 text-center print-avoid-break`}
          style={{ borderColor: theme.border }}
        >
          <span className={`${layout.smallSizeClass} uppercase tracking-widest text-slate-500 mr-2`}>
            {t('formal_subject')}:
          </span>
          <PlaceholderText value={data.subject} placeholder="Document subject or topic here" />
        </div>
      );
    }

    if (variant === 'banner') {
      return (
        <div
          className={`${
            isCompact ? 'mb-4 py-2 px-3 text-xs' : isLarge ? 'mb-8 py-3.5 px-5 text-base' : 'mb-6 py-2.5 px-4 text-sm'
          } rounded-md border font-sans-title font-bold text-slate-900 print-avoid-break`}
          style={{
            backgroundColor: theme.primaryLight,
            borderColor: `${theme.primary}35`,
          }}
        >
          <span className={`${layout.smallSizeClass} uppercase tracking-wider mr-1.5`} style={{ color: theme.primaryDark }}>
            {t('formal_subject')}:
          </span>
          <PlaceholderText value={data.subject} placeholder="Document subject or topic here" />
        </div>
      );
    }

    if (variant === 'swiss') {
      return (
        <div className="border-t pt-2.5 font-sans-title print-avoid-break" style={{ borderColor: theme.textHeader }}>
          <span className={`${layout.smallSizeClass} font-bold uppercase tracking-widest block text-slate-500 mb-1`}>
            {t('formal_subject')}
          </span>
          <div className={`font-bold text-slate-900 ${isLarge ? 'text-base' : 'text-sm'}`}>
            <PlaceholderText value={data.subject} placeholder="Document subject or topic here" />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`${
          isCompact ? 'mb-4 py-2 px-3 text-xs' : isLarge ? 'mb-8 py-3 px-4 text-base' : 'mb-6 py-2.5 px-3.5 text-sm'
        } rounded-md bg-slate-50 border font-sans-title font-bold text-slate-900 print-avoid-break`}
        style={{ borderColor: theme.border, borderTopWidth: '2px', borderTopColor: theme.primary }}
      >
        <span className={`${layout.smallSizeClass} uppercase tracking-wider text-slate-500 mr-1.5`}>
          {t('formal_subject')}:
        </span>
        <PlaceholderText value={data.subject} placeholder="Document subject or topic here" />
      </div>
    );
  };

  const renderProseAndSignature = (hideEnclosure = false) => (
    <>
      <div
        className={`font-sans-title font-semibold text-slate-900 ${
          isCompact ? 'text-xs mb-3' : isLarge ? 'text-base mb-5' : 'text-sm mb-4'
        }`}
      >
        <PlaceholderText value={data.salutation} placeholder="Dear Recipient," />
      </div>

      <div
        className={`${
          isUltraNarrow
            ? 'space-y-2'
            : isCompact
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

        {!hideEnclosure && hasText(data.enclosureNotice) && (
          <div className={`mt-6 pt-3 border-t border-slate-200 ${layout.smallSizeClass} text-slate-500 italic`}>
            {data.enclosureNotice}
          </div>
        )}
      </div>
    </>
  );

  const renderSenderContactList = (align: 'left' | 'center' | 'right') => {
    const justifyClass =
      align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
    return (
      <div className={`font-sans-title ${layout.metaSizeClass} text-slate-500 space-y-1`}>
        {(!hasAnySenderContact || hasText(data.senderAddress)) && (
          <div className={`flex items-center ${justifyClass} gap-1.5`}>
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <PlaceholderText value={data.senderAddress} placeholder="Street address, city, postal code" />
          </div>
        )}
        {(!hasAnySenderContact || hasText(data.senderEmail)) && (
          <div className={`flex items-center ${justifyClass} gap-1.5 break-all`}>
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <PlaceholderText value={data.senderEmail} placeholder="email@example.com" />
          </div>
        )}
        {(!hasAnySenderContact || hasText(data.senderPhone)) && (
          <div className={`flex items-center ${justifyClass} gap-1.5`}>
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <PlaceholderText value={data.senderPhone} placeholder="Phone number here" />
          </div>
        )}
      </div>
    );
  };

  // COMPOSITION 4: Letterhead Sidebar (Full-bleed sender column left + letter flow right)
  if (design.id === 'split-sidebar' && !isCompact) {
    const pad = layout.paddingPx;
    return (
      <DocumentSheet assets={mounted} showHeaderAccent={false} fullBleedSplit>
        <div
          className="grid grid-cols-12 w-full"
          style={{ minHeight: `${layout.paper.heightPx}px` }}
        >
          <aside
            className="col-span-4 border-r flex flex-col justify-between gap-6"
            style={{
              backgroundColor: theme.primaryLight,
              borderColor: theme.border,
              padding: `${pad}px ${Math.round(pad * 0.72)}px`,
            }}
          >
            <div className="space-y-5">
              {data.logoUrl && <DocumentLogo src={data.logoUrl} alt="Logo" assets={mounted} />}

              <div>
                <h1
                  className={`font-sans-title ${isLarge ? 'text-2xl' : 'text-lg'} font-extrabold tracking-tight`}
                  style={hasText(data.senderName) ? { color: theme.textHeader } : undefined}
                >
                  <PlaceholderText value={data.senderName} placeholder="Sender Name Here" />
                </h1>
                <p
                  className={`font-sans-title ${layout.metaSizeClass} font-semibold mt-1`}
                  style={hasText(data.senderTitle) ? { color: theme.primary } : undefined}
                >
                  <PlaceholderText value={data.senderTitle} placeholder="Sender Role or Title" />
                </p>
                <p className={`font-sans-title ${layout.metaSizeClass} text-slate-600 mt-0.5`}>
                  <PlaceholderText value={data.senderCompany} placeholder="Organization Name" />
                </p>
              </div>

              <div className="pt-3 border-t" style={{ borderColor: `${theme.primary}25` }}>
                {renderSenderContactList('left')}
              </div>
            </div>

            {hasText(data.enclosureNotice) && (
              <div
                className={`pt-3 border-t ${layout.smallSizeClass} text-slate-600 italic font-sans-title`}
                style={{ borderColor: `${theme.primary}25` }}
              >
                {data.enclosureNotice}
              </div>
            )}
          </aside>

          <div className="col-span-8" style={{ padding: `${pad}px` }}>
            <div className={`${layout.sectionMbClass} font-sans-title ${layout.metaSizeClass} font-semibold text-slate-500`}>
              <PlaceholderText value={data.date} placeholder="Date Here" />
            </div>
            <div className={layout.sectionMbClass}>{renderRecipientBlock(false)}</div>
            {renderSubjectBanner('spine')}
            {renderProseAndSignature(true)}
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITION 5: Swiss Correspondence Grid (Left 4-col metadata + Right 8-col letter body)
  if (design.id === 'swiss-grid' && !isCompact) {
    return (
      <DocumentSheet assets={mounted}>
        <header
          className={`border-b ${
            layout.isLarge ? 'pb-7 mb-7' : 'pb-5 mb-6'
          } flex items-end justify-between gap-6`}
          style={{ borderColor: theme.textHeader }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {data.logoUrl && <DocumentLogo src={data.logoUrl} alt="Logo" assets={mounted} />}
            <div className="min-w-0">
              <h1
                className={`font-sans-title ${isLarge ? 'text-3xl' : 'text-2xl'} font-extrabold tracking-tight`}
                style={hasText(data.senderName) ? { color: theme.textHeader } : undefined}
              >
                <PlaceholderText value={data.senderName} placeholder="Sender Name Here" />
              </h1>
              <p className={`font-sans-title ${layout.metaSizeClass} font-semibold mt-0.5`} style={{ color: theme.primary }}>
                <PlaceholderText value={data.senderTitle} placeholder="Sender Role or Title" />
                {(hasText(data.senderCompany) || !hasText(data.senderName)) && (
                  <span className="text-slate-500 font-normal">
                    {' · '}
                    <PlaceholderText value={data.senderCompany} placeholder="Organization Name" />
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="shrink-0">{renderSenderContactList('right')}</div>
        </header>

        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-4 space-y-5">
            <div className="border-t pt-2.5 font-sans-title" style={{ borderColor: theme.textHeader }}>
              <span className={`${layout.smallSizeClass} font-bold uppercase tracking-widest block text-slate-500 mb-1`}>
                {t('issue_date')}
              </span>
              <span className={`${layout.metaSizeClass} font-semibold text-slate-800 font-mono-tabular`}>
                <PlaceholderText value={data.date} placeholder="Date Here" />
              </span>
            </div>

            <div className="border-t pt-2.5 font-sans-title" style={{ borderColor: theme.textHeader }}>
              <span className={`${layout.smallSizeClass} font-bold uppercase tracking-widest block text-slate-500 mb-1.5`}>
                {t('recipient_details')}
              </span>
              {renderRecipientBlock(false)}
            </div>

            {renderSubjectBanner('swiss')}
          </div>

          <div className="col-span-8">
            {renderProseAndSignature(false)}
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITIONS 1, 2, 3 (and compact fallback)
  const isEditorial = design.id === 'editorial-serif';
  const isBanner = design.id === 'modern-banner';

  return (
    <DocumentSheet assets={mounted}>
      <DocumentHeaderBand
        assets={mounted}
        align="end"
        left={
          <div className={`flex items-center gap-3.5 min-w-0 ${isEditorial ? 'justify-center' : ''}`}>
            {data.logoUrl && <DocumentLogo src={data.logoUrl} alt="Logo" assets={mounted} />}
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
        right={renderSenderContactList(isEditorial ? 'center' : isCompact ? 'left' : 'right')}
      />

      {isBanner ? (
        <div
          className={`${layout.sectionMbClass} grid ${
            isCompact ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'
          } p-3.5 rounded-md border border-slate-200 bg-slate-50/70`}
        >
          <div>
            <span className={`${layout.smallSizeClass} font-sans-title font-bold uppercase tracking-wider text-slate-500 block mb-1`}>
              {t('recipient_details')}
            </span>
            {renderRecipientBlock(false)}
          </div>
          <div className={isCompact ? 'text-left' : 'text-right'}>
            <span className={`${layout.smallSizeClass} font-sans-title font-bold uppercase tracking-wider text-slate-500 block mb-1`}>
              {t('issue_date')}
            </span>
            <div className={`font-sans-title ${layout.metaSizeClass} font-semibold text-slate-800`}>
              <PlaceholderText value={data.date} placeholder="Date Here" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`${
              isCompact ? 'mb-4' : isLarge ? 'mb-7' : 'mb-5'
            } font-sans-title ${layout.metaSizeClass} font-semibold text-slate-600`}
          >
            <PlaceholderText value={data.date} placeholder="Date Here" />
          </div>
          <div className={layout.sectionMbClass}>{renderRecipientBlock(false)}</div>
        </>
      )}

      {renderSubjectBanner(isEditorial ? 'editorial' : isBanner ? 'banner' : 'spine')}
      {renderProseAndSignature(false)}
    </DocumentSheet>
  );
};

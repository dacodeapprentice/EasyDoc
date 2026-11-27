import React from 'react';
import {
  CertificateData,
  DocumentAssetBundle,
  DocumentStyle,
  ColorTheme,
  LanguageCode,
} from '../../types/document';
import { Award, CheckCircle } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { resolveDocumentAssets } from '../../assets/documentAssets';
import {
  DocumentOrnateFrame,
  DocumentSheet,
  PlaceholderText,
  hasText,
} from './TemplatePrimitives';

interface CertificateDocumentProps {
  data: CertificateData;
  style: DocumentStyle;
  theme?: ColorTheme;
  assets?: DocumentAssetBundle;
  lang?: LanguageCode;
}

export const CertificateDocument: React.FC<CertificateDocumentProps> = ({
  data,
  style,
  assets,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const mounted = assets || resolveDocumentAssets(style);
  const { theme, layout, design } = mounted;
  const { isCompact, isUltraNarrow, isLarge, isShort } = layout;

  const framedPadding = Math.round(
    (isUltraNarrow ? 24 : isCompact ? 32 : isShort ? 38 : isLarge ? 72 : 52) *
      mounted.density.paddingScale
  );

  const hasAwardFields =
    hasText(data.recipientName) ||
    hasText(data.title) ||
    hasText(data.issuingOrganization) ||
    hasText(data.courseOrAchievement);

  const renderSeal = () => (
    <div className="text-center shrink-0">
      {data.sealUrl ? (
        <img
          src={data.sealUrl}
          alt={data.issuingOrganization || t('certificate_seal')}
          className={`${
            isCompact
              ? 'max-h-12 max-w-[96px]'
              : isLarge
              ? 'max-h-20 max-w-[160px]'
              : 'max-h-16 max-w-[130px]'
          } w-auto h-auto object-contain mx-auto block`}
          style={{ objectFit: 'contain' }}
        />
      ) : (
        <div
          className={`${
            isCompact ? 'w-12 h-12' : isLarge ? 'w-20 h-20' : 'w-16 h-16'
          } rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1 mx-auto bg-white`}
          style={{ borderColor: theme.primary }}
        >
          <CheckCircle
            className={`${isCompact ? 'w-3 h-3' : isLarge ? 'w-5 h-5' : 'w-4 h-4'} mb-0.5`}
            style={{ color: theme.primary }}
          />
          <span
            className={`${
              isCompact ? 'text-[7px]' : isLarge ? 'text-[10px]' : 'text-[8px]'
            } font-bold uppercase tracking-wider text-slate-600`}
          >
            {t('verified')}
          </span>
        </div>
      )}
      <div className={`${isCompact ? 'text-[8px]' : 'text-[9px]'} font-mono-tabular text-slate-400 mt-1`}>
        <PlaceholderText value={data.certificateId} placeholder="CERT-0000" />
      </div>
    </div>
  );

  const renderSignatory = (name: string, title: string, placeholderName: string, align: 'left' | 'center' | 'right') => {
    const ruleAlign =
      align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : '';
    const textAlign =
      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    return (
      <div className={`${textAlign} min-w-0`}>
        <div
          className={`${
            isUltraNarrow ? 'w-28' : isCompact ? 'w-20' : isLarge ? 'w-48' : 'w-36'
          } ${ruleAlign} h-0.5 bg-slate-400 mb-2`}
        />
        <div className="font-bold text-slate-900">
          <PlaceholderText value={name} placeholder={placeholderName} />
        </div>
        <div className={`${layout.smallSizeClass} text-slate-500`}>
          <PlaceholderText value={title} placeholder={t('cert_doc_ph_signatory_title')} />
        </div>
      </div>
    );
  };

  const renderDistinctionBox = () => {
    if (hasAwardFields && !hasText(data.courseOrAchievement)) return null;
    return (
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
        <PlaceholderText
          value={data.courseOrAchievement}
          placeholder={t('cert_ph_course')}
        />
      </div>
    );
  };

  // COMPOSITION 4: Crest Panel (Tinted left seal/issuer column + right recipient spotlight)
  if (design.id === 'split-sidebar' && !isCompact) {
    const pad = framedPadding;
    return (
      <DocumentSheet assets={mounted} showHeaderAccent={false} fullBleedSplit>
        <div
          className="grid grid-cols-12 w-full relative"
          style={{ minHeight: `${layout.paper.heightPx}px` }}
        >
          <aside
            data-pdf-sidebar="true"
            className="col-span-4 border-r flex flex-col justify-between items-center text-center gap-6"
            style={{
              backgroundColor: theme.primaryLight,
              borderColor: theme.border,
              padding: `${pad}px ${Math.round(pad * 0.65)}px`,
            }}
          >
            <div data-pdf-block="true" className="space-y-4 flex flex-col items-center">
              <div
                className={`${isLarge ? 'w-16 h-16' : 'w-14 h-14'} rounded-full bg-white border-2 flex items-center justify-center shadow-xs`}
                style={{ borderColor: theme.primary }}
              >
                <Award className={isLarge ? 'w-8 h-8' : 'w-7 h-7'} style={{ color: theme.primary }} />
              </div>

              <div>
                <span className={`font-sans-title ${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-500 block mb-1`}>
                  {t('cert_org')}
                </span>
                <p className={`font-sans-title ${layout.metaSizeClass} font-extrabold text-slate-900 leading-snug`}>
                  <PlaceholderText
                    value={data.issuingOrganization}
                    placeholder={t('cert_ph_org')}
                  />
                </p>
              </div>
            </div>

            <div data-pdf-block="true" className="space-y-4 flex flex-col items-center">
              {renderSeal()}
              <div className={`font-sans-title ${layout.smallSizeClass} text-slate-600 pt-2 border-t`} style={{ borderColor: `${theme.primary}25` }}>
                <span className="block text-slate-500">{t('awarded_on')}</span>
                <strong className="text-slate-900 font-semibold">
                  <PlaceholderText value={data.dateOfAward} placeholder={t('letter_doc_ph_date')} />
                </strong>
              </div>
            </div>
          </aside>

          <div
            className="col-span-8 flex flex-col justify-between"
            style={{ padding: `${pad}px` }}
          >
            <div data-pdf-block="true">
              <h1
                className={`font-sans-title ${
                  isLarge ? 'text-4xl' : 'text-2xl'
                } font-extrabold tracking-tight`}
                style={hasText(data.title) ? { color: theme.textHeader } : undefined}
              >
                <PlaceholderText value={data.title} placeholder={t('cert_ph_title')} />
              </h1>
              <div className="w-16 h-1 mt-3 rounded-full" style={{ backgroundColor: theme.primary }} />
            </div>

            <div data-pdf-block="true" className={`${isShort ? 'my-3 space-y-2.5' : 'my-6 space-y-4'}`}>
              <p className={`font-sans-title ${layout.metaSizeClass} uppercase tracking-wider text-slate-500`}>
                {t('in_recognition')}
              </p>

              <h2
                className={`font-sans-title ${
                  isLarge ? 'text-5xl' : 'text-3xl'
                } font-extrabold tracking-tight`}
                style={hasText(data.recipientName) ? { color: theme.primaryDark } : undefined}
              >
                <PlaceholderText value={data.recipientName} placeholder={t('cert_ph_recipient')} />
              </h2>

              <p className={`${isLarge ? 'text-lg' : 'text-sm'} leading-relaxed text-slate-700 italic`}>
                <PlaceholderText
                  value={data.description}
                  placeholder={t('cert_doc_ph_citation')}
                />
              </p>

              <div>{renderDistinctionBox()}</div>
            </div>

            <div data-pdf-block="true" className={`border-t border-slate-200 pt-5 grid grid-cols-2 gap-6 font-sans-title ${layout.metaSizeClass}`}>
              {renderSignatory(data.primarySignatoryName, data.primarySignatoryTitle, t('cert_ph_primary_name'), 'left')}
              {renderSignatory(data.secondarySignatoryName, data.secondarySignatoryTitle, t('cert_ph_secondary_name'), 'right')}
            </div>
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITION 5: Architectural Award (Swiss Grid 12-column framed award)
  if (design.id === 'swiss-grid' && !isCompact) {
    return (
      <DocumentSheet
        assets={mounted}
        className="flex flex-col justify-between"
        paddingPxOverride={framedPadding}
        showHeaderAccent={false}
      >
        <DocumentOrnateFrame assets={mounted} />

        <div data-pdf-block="true" className="relative pt-2 border-b pb-5 flex items-start justify-between gap-6" style={{ borderColor: theme.textHeader }}>
          <div>
            <p className={`font-sans-title ${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-500 mb-1.5`}>
              <PlaceholderText
                value={data.issuingOrganization}
                placeholder={t('cert_ph_org')}
              />
            </p>
            <h1
              className={`font-sans-title ${isLarge ? 'text-4xl' : 'text-3xl'} font-extrabold tracking-tight`}
              style={hasText(data.title) ? { color: theme.textHeader } : undefined}
            >
              <PlaceholderText value={data.title} placeholder={t('cert_ph_title')} />
            </h1>
          </div>
          <div className="shrink-0">{renderSeal()}</div>
        </div>

        <div data-pdf-block="true" className={`relative grid grid-cols-12 ${isShort ? 'gap-5 my-4' : 'gap-6 my-8'} items-start`}>
          <div className="col-span-4 space-y-4 border-t pt-3 font-sans-title" style={{ borderColor: theme.textHeader }}>
            <div>
              <span className={`${layout.smallSizeClass} uppercase tracking-widest text-slate-500 font-bold block`}>
                {t('in_recognition')}
              </span>
            </div>
            <div>
              <span className={`${layout.smallSizeClass} uppercase tracking-widest text-slate-500 block`}>
                {t('awarded_on')}
              </span>
              <strong className={`${layout.metaSizeClass} text-slate-900 font-mono-tabular`}>
                <PlaceholderText value={data.dateOfAward} placeholder={t('letter_doc_ph_date')} />
              </strong>
            </div>
          </div>

          <div className="col-span-8 space-y-4">
            <h2
              className={`font-sans-title ${isLarge ? 'text-5xl' : 'text-4xl'} font-extrabold tracking-tight`}
              style={hasText(data.recipientName) ? { color: theme.primaryDark } : undefined}
            >
              <PlaceholderText value={data.recipientName} placeholder={t('cert_ph_recipient')} />
            </h2>
            <div>{renderDistinctionBox()}</div>
            <p className={`${isLarge ? 'text-lg' : 'text-base'} leading-relaxed text-slate-700`}>
              <PlaceholderText
                value={data.description}
                placeholder={t('cert_doc_ph_citation')}
              />
            </p>
          </div>
        </div>

        <div
          data-pdf-block="true"
          className={`relative border-t border-slate-200 pt-5 grid grid-cols-2 gap-6 font-sans-title ${layout.metaSizeClass}`}
        >
          {renderSignatory(data.primarySignatoryName, data.primarySignatoryTitle, t('cert_ph_primary_name'), 'left')}
          {renderSignatory(data.secondarySignatoryName, data.secondarySignatoryTitle, t('cert_ph_secondary_name'), 'right')}
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITION 1: Diplomatic Spine (Left-aligned asymmetric credential with colored spine & perimeter rule)
  if (design.id === 'executive-spine') {
    return (
      <DocumentSheet
        assets={mounted}
        className="flex flex-col justify-between"
        paddingPxOverride={framedPadding}
        showHeaderAccent={true}
      >
        <div
          className={`relative border border-slate-200 flex-1 flex flex-col justify-between ${
            isUltraNarrow ? 'p-4' : isCompact ? 'p-5' : isShort ? 'p-6' : isLarge ? 'p-10' : 'p-8'
          }`}
        >
          <div data-pdf-block="true" className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`${
                  isCompact ? 'w-10 h-10' : isLarge ? 'w-14 h-14' : 'w-12 h-12'
                } rounded-lg flex items-center justify-center shrink-0`}
                style={{ backgroundColor: theme.primaryLight }}
              >
                <Award className={isCompact ? 'w-5 h-5' : 'w-6 h-6'} style={{ color: theme.primary }} />
              </div>
              <div>
                <p className={`font-sans-title ${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-500`}>
                  <PlaceholderText
                    value={data.issuingOrganization}
                    placeholder={t('cert_ph_org')}
                  />
                </p>
                <h1
                  className={`font-sans-title ${
                    isUltraNarrow ? 'text-lg' : isCompact ? 'text-xl' : isLarge ? 'text-4xl' : 'text-2xl'
                  } font-extrabold tracking-tight mt-0.5`}
                  style={hasText(data.title) ? { color: theme.textHeader } : undefined}
                >
                  <PlaceholderText value={data.title} placeholder={t('cert_ph_title')} />
                </h1>
              </div>
            </div>
          </div>

          <div data-pdf-block="true" className={`${isShort ? 'my-3 space-y-2.5' : 'my-6 space-y-3.5'} max-w-2xl`}>
            <p className={`font-sans-title ${layout.metaSizeClass} uppercase tracking-wider text-slate-500`}>
              {t('in_recognition')}
            </p>
            <h2
              className={`font-sans-title ${
                isUltraNarrow ? 'text-xl' : isCompact ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-4xl'
              } font-extrabold`}
              style={hasText(data.recipientName) ? { color: theme.primaryDark } : undefined}
            >
              <PlaceholderText value={data.recipientName} placeholder={t('cert_ph_recipient')} />
            </h2>
            <p className={`${isCompact ? 'text-xs' : isLarge ? 'text-lg' : 'text-base'} leading-relaxed text-slate-700`}>
              <PlaceholderText
                value={data.description}
                placeholder={t('cert_doc_ph_citation')}
              />
            </p>
            <div>{renderDistinctionBox()}</div>
            <div className={`font-sans-title ${layout.metaSizeClass} text-slate-500 pt-1`}>
              {t('awarded_on')}:{' '}
              <strong className="text-slate-800">
                <PlaceholderText value={data.dateOfAward} placeholder={t('letter_doc_ph_date')} />
              </strong>
            </div>
          </div>

          <div
            data-pdf-block="true"
            className={`border-t border-slate-200 pt-5 flex ${
              isUltraNarrow ? 'flex-col items-start gap-4' : 'flex-row items-end justify-between gap-4'
            } font-sans-title ${layout.metaSizeClass}`}
          >
            <div className="flex flex-wrap gap-8">
              {renderSignatory(data.primarySignatoryName, data.primarySignatoryTitle, t('cert_ph_primary_name'), 'left')}
              {renderSignatory(data.secondarySignatoryName, data.secondarySignatoryTitle, t('cert_ph_secondary_name'), 'left')}
            </div>
            {renderSeal()}
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITIONS 2 & 3: Ceremonial Banner (modern-banner) & Classic Ornate (editorial-serif) + narrow fallbacks
  const isBanner = design.id === 'modern-banner';

  return (
    <DocumentSheet
      assets={mounted}
      className="flex flex-col justify-between"
      paddingPxOverride={framedPadding}
      showHeaderAccent={false}
    >
      <DocumentOrnateFrame assets={mounted} />

      <div
        data-pdf-block="true"
        className={`relative text-center ${
          isBanner
            ? `${isShort ? 'p-3 mt-1' : isCompact ? 'p-3.5 mt-2' : 'p-5 mt-3'} rounded-lg border`
            : isShort
            ? 'pt-2'
            : 'pt-4'
        }`}
        style={
          isBanner
            ? { backgroundColor: theme.primaryLight, borderColor: `${theme.primary}30` }
            : undefined
        }
      >
        <div className="flex justify-center mb-3">
          <div
            className={`${
              isUltraNarrow ? 'w-9 h-9' : isCompact ? 'w-10 h-10' : isLarge ? 'w-16 h-16' : 'w-12 h-12'
            } rounded-full flex items-center justify-center shadow-xs`}
            style={{ backgroundColor: isBanner ? '#ffffff' : theme.primaryLight }}
          >
            <Award
              className={isCompact ? 'w-5 h-5' : isLarge ? 'w-8 h-8' : 'w-6 h-6'}
              style={{ color: theme.primary }}
            />
          </div>
        </div>

        <p className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-widest text-slate-500 mb-1`}>
          <PlaceholderText
            value={data.issuingOrganization}
            placeholder={t('cert_ph_org')}
          />
        </p>
        <h1
          className={`font-sans-title ${
            isUltraNarrow ? 'text-lg' : isCompact ? 'text-xl' : isLarge ? 'text-4xl' : 'text-3xl'
          } font-extrabold tracking-tight`}
          style={hasText(data.title) ? { color: theme.textHeader } : undefined}
        >
          <PlaceholderText value={data.title} placeholder={t('cert_ph_title')} />
        </h1>
        {!isBanner && (
          <div
            className="w-16 h-1 mx-auto mt-3 rounded-full"
            style={{ backgroundColor: theme.primary }}
          />
        )}
      </div>

      <div
        data-pdf-block="true"
        className={`relative text-center mx-auto ${isShort ? 'my-3' : 'my-6'} ${
          isUltraNarrow
            ? 'max-w-full space-y-2'
            : isCompact
            ? 'max-w-sm space-y-2.5'
            : isShort
            ? 'max-w-2xl space-y-2.5'
            : isLarge
            ? 'max-w-3xl space-y-6'
            : 'max-w-xl space-y-4'
        }`}
      >
        <p className={`font-sans-title ${layout.metaSizeClass} uppercase tracking-wider text-slate-500`}>
          {t('in_recognition')}
        </p>

        <h2
          className={`font-sans-title ${
            isUltraNarrow ? 'text-xl' : isCompact ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-4xl'
          } font-extrabold`}
          style={hasText(data.recipientName) ? { color: theme.primaryDark } : undefined}
        >
          <PlaceholderText value={data.recipientName} placeholder={t('cert_ph_recipient')} />
        </h2>

        <p
          className={`${
            isUltraNarrow ? 'text-[11px]' : isCompact ? 'text-xs' : isLarge ? 'text-lg' : 'text-base'
          } leading-relaxed text-slate-700 italic pt-2`}
        >
          <PlaceholderText
            value={data.description}
            placeholder={t('cert_doc_ph_citation')}
          />
        </p>

        {renderDistinctionBox()}

        <div className={`font-sans-title ${layout.metaSizeClass} text-slate-500 pt-3`}>
          {t('awarded_on')}:{' '}
          <strong className="text-slate-800">
            <PlaceholderText value={data.dateOfAward} placeholder={t('letter_doc_ph_date')} />
          </strong>
        </div>
      </div>

      <div
        data-pdf-block="true"
        className={`relative border-t border-slate-200 ${isShort ? 'pt-3.5 mt-3' : 'pt-5 mt-5'} flex ${
          isUltraNarrow ? 'flex-col items-center gap-4 text-center' : 'flex-row items-center justify-between'
        } ${isCompact ? 'gap-3' : 'gap-6'} font-sans-title ${layout.metaSizeClass}`}
      >
        {renderSignatory(
          data.primarySignatoryName,
          data.primarySignatoryTitle,
          t('cert_ph_primary_name'),
          isUltraNarrow ? 'center' : 'left'
        )}

        {renderSeal()}

        {renderSignatory(
          data.secondarySignatoryName,
          data.secondarySignatoryTitle,
          t('cert_ph_secondary_name'),
          isUltraNarrow ? 'center' : 'right'
        )}
      </div>
    </DocumentSheet>
  );
};

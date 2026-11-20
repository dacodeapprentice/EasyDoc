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
  const { theme, layout } = mounted;
  const { isCompact, isLarge } = layout;

  const framedPadding = Math.round(
    (isCompact ? 32 : isLarge ? 72 : 52) * mounted.density.paddingScale
  );

  const hasAwardFields =
    hasText(data.recipientName) ||
    hasText(data.title) ||
    hasText(data.issuingOrganization) ||
    hasText(data.courseOrAchievement);

  return (
    <DocumentSheet
      assets={mounted}
      className="flex flex-col justify-between"
      paddingPxOverride={framedPadding}
      showHeaderAccent={false}
    >
      {/* Ornate Double Border Frame */}
      <DocumentOrnateFrame assets={mounted} />

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
          <PlaceholderText
            value={data.issuingOrganization}
            placeholder="Organization or Institution Name"
          />
        </p>
        <h1
          className={`font-sans-title ${
            isCompact ? 'text-xl' : isLarge ? 'text-4xl' : 'text-3xl'
          } font-extrabold tracking-tight`}
          style={hasText(data.title) ? { color: theme.textHeader } : undefined}
        >
          <PlaceholderText value={data.title} placeholder="Certificate Title Here" />
        </h1>
        <div className="w-16 h-1 mx-auto mt-3 rounded-full" style={{ backgroundColor: theme.primary }} />
      </div>

      {/* Main Centered Award Body */}
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
          style={hasText(data.recipientName) ? { color: theme.primaryDark } : undefined}
        >
          <PlaceholderText value={data.recipientName} placeholder="Recipient Name Here" />
        </h2>

        <p
          className={`${
            isCompact ? 'text-xs' : isLarge ? 'text-lg' : 'text-base'
          } leading-relaxed text-slate-700 italic pt-2`}
        >
          <PlaceholderText
            value={data.description}
            placeholder="Write a generalized commendation or citation statement describing the achievement here."
          />
        </p>

        {(!hasAwardFields || hasText(data.courseOrAchievement)) && (
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
              placeholder="Program, Course, or Distinction Name"
            />
          </div>
        )}

        <div className={`font-sans-title ${layout.metaSizeClass} text-slate-500 pt-3`}>
          {t('awarded_on')}:{' '}
          <strong className="text-slate-800">
            <PlaceholderText value={data.dateOfAward} placeholder="Date Here" />
          </strong>
        </div>
      </div>

      {/* Dual Signatures & Seal Footer */}
      <div
        className={`relative border-t border-slate-200 pt-6 mt-6 flex flex-row items-center justify-between ${
          isCompact ? 'gap-3' : 'gap-6'
        } font-sans-title ${layout.metaSizeClass}`}
      >
        <div className="text-left min-w-0">
          <div className={`${isCompact ? 'w-24' : isLarge ? 'w-48' : 'w-36'} h-0.5 bg-slate-400 mb-2`} />
          <div className="font-bold text-slate-900">
            <PlaceholderText value={data.primarySignatoryName} placeholder="Primary Signatory Name" />
          </div>
          <div className={`${layout.smallSizeClass} text-slate-500`}>
            <PlaceholderText value={data.primarySignatoryTitle} placeholder="Signatory Title" />
          </div>
        </div>

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
            <PlaceholderText value={data.certificateId} placeholder="CERT-0000" />
          </div>
        </div>

        <div className="text-right min-w-0">
          <div className={`${isCompact ? 'w-24' : isLarge ? 'w-48' : 'w-36'} h-0.5 bg-slate-400 mb-2 ml-auto`} />
          <div className="font-bold text-slate-900">
            <PlaceholderText value={data.secondarySignatoryName} placeholder="Secondary Signatory Name" />
          </div>
          <div className={`${layout.smallSizeClass} text-slate-500`}>
            <PlaceholderText value={data.secondarySignatoryTitle} placeholder="Signatory Title" />
          </div>
        </div>
      </div>
    </DocumentSheet>
  );
};

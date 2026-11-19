import React from 'react';
import { CensusData, DocumentStyle, ColorTheme, LanguageCode } from '../../types/document';
import { ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { getPaperLayout } from '../../data/defaultData';

interface CensusDocumentProps {
  data: CensusData;
  style: DocumentStyle;
  theme: ColorTheme;
  lang?: LanguageCode;
}

export const CensusDocument: React.FC<CensusDocumentProps> = ({
  data,
  style,
  theme,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const layout = getPaperLayout(style.paperSize, style.density);
  const { paper, isCompact, isTall, isLarge } = layout;
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

      {/* Header: Official Census Authority */}
      <header className={`border-b ${isCompact ? 'pb-4 mb-4' : isLarge ? 'pb-7 mb-8' : 'pb-5 mb-6'} border-slate-200`}>
        <div
          className={`flex ${
            isCompact ? 'flex-col items-start gap-3' : 'flex-row items-start justify-between gap-4'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded bg-slate-100 text-slate-700">
                <FileSpreadsheet className="w-4 h-4" style={{ color: theme.primary }} />
              </span>
              <span className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-widest text-slate-500`}>
                {t('census_registry')}
              </span>
            </div>
            <h1
              className={`font-sans-title ${
                isCompact ? 'text-lg' : isLarge ? 'text-3xl' : 'text-2xl'
              } font-extrabold tracking-tight`}
              style={{ color: theme.textHeader }}
            >
              Demographic Household Survey
            </h1>
            <p className={`font-sans-title ${layout.metaSizeClass} text-slate-600 mt-1`}>
              District Jurisdiction: <strong>{data.districtRegion || 'Metropolitan District'}</strong>
              {data.enumerationArea && ` · Area Code: ${data.enumerationArea}`}
            </p>
          </div>

          {/* Census Code Badge */}
          <div className={`${isCompact ? 'text-left' : 'text-right'} font-sans-title shrink-0`}>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded ${layout.smallSizeClass} font-bold uppercase tracking-wider`}
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Record</span>
            </div>
            <div className={`font-mono-tabular ${layout.metaSizeClass} font-semibold text-slate-700 mt-1.5`}>
              ID: {data.censusCode || 'CENSUS-0000'}
            </div>
            <div className={`${layout.smallSizeClass} text-slate-500 mt-0.5`}>
              {t('survey_date')}: {data.surveyDate || '—'}
            </div>
          </div>
        </div>
      </header>

      {/* Dwelling & Household Demographics */}
      <section
        className={`${layout.sectionMbClass} ${
          isCompact ? 'p-3' : isLarge ? 'p-6' : 'p-4'
        } rounded-md border border-slate-200 bg-slate-50/70 font-sans-title ${layout.metaSizeClass} print-avoid-break`}
      >
        <div
          className={`grid ${
            isCompact ? 'grid-cols-2 gap-2.5' : isLarge ? 'grid-cols-3 gap-5' : 'grid-cols-3 gap-3.5'
          }`}
        >
          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('head_household')}:</span>
            <strong className={`text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'} font-bold block mt-0.5`}>
              {data.headOfHousehold || '—'}
            </strong>
          </div>

          <div className={isCompact ? 'col-span-1' : 'col-span-2'}>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('residential_address')}:</span>
            <span className="text-slate-800 font-semibold block mt-0.5">
              {data.residentialAddress || '—'}
            </span>
          </div>

          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('dwelling_type')}:</span>
            <span className="text-slate-800 font-medium block mt-0.5">{data.dwellingType}</span>
          </div>

          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('tenure_status')}:</span>
            <span className="text-slate-800 font-medium block mt-0.5">{data.tenureStatus}</span>
          </div>

          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('total_rooms')}:</span>
            <span className="text-slate-800 font-mono-tabular font-bold block mt-0.5">
              {data.totalRooms}
            </span>
          </div>

          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('water_source')}:</span>
            <span className="text-slate-800 font-medium block mt-0.5">
              {data.primaryWaterSource}
            </span>
          </div>

          <div className={isCompact ? 'col-span-2' : 'col-span-2'}>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('electricity_access')}:</span>
            <span className="text-slate-800 font-medium block mt-0.5">
              {data.electricityAccess}
            </span>
          </div>
        </div>
      </section>

      {/* Household Residents Roster Table */}
      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        <div className="flex items-center justify-between mb-2 font-sans-title">
          <h2
            className={`${layout.metaSizeClass} font-bold uppercase tracking-wider`}
            style={{ color: theme.primaryDark }}
          >
            {t('resident_roster')} ({data.householdMembers.length} Occupants)
          </h2>
        </div>

        <table
          className={`w-full text-left border-collapse ${
            isCompact ? 'text-[9.5px] table-fixed' : isLarge ? 'text-sm' : 'text-xs'
          }`}
        >
          <thead>
            <tr className="border-b-2 border-slate-300 font-sans-title text-slate-700 font-bold bg-slate-50">
              <th className={`${isCompact ? 'py-1.5 px-1 w-6' : 'py-2 px-2 w-8'} text-center`}>#</th>
              <th className={isCompact ? 'py-1.5 px-1.5' : 'py-2 px-3'}>{t('full_name')}</th>
              <th className={isCompact ? 'py-1.5 px-1.5' : 'py-2 px-3'}>Relationship</th>
              <th className={`${isCompact ? 'py-1.5 px-1 w-8' : 'py-2 px-2 w-12'} text-center`}>Age</th>
              <th className={`${isCompact ? 'py-1.5 px-1 w-10' : 'py-2 px-2 w-16'} text-center`}>Gender</th>
              <th className={isCompact ? 'py-1.5 px-1.5' : 'py-2 px-3'}>Education</th>
              <th className={isCompact ? 'py-1.5 px-1.5' : 'py-2 px-3'}>Occupation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.householdMembers.map((member, idx) => (
              <tr key={member.id || idx} className="hover:bg-slate-50/50">
                <td className={`${isCompact ? 'py-1.5 px-1' : isTall || isLarge ? 'py-3.5 px-2' : 'py-2.5 px-2'} text-center font-mono-tabular text-slate-400`}>
                  {idx + 1}
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1.5' : isTall || isLarge ? 'py-3.5 px-3' : 'py-2.5 px-3'} font-semibold text-slate-900 font-sans-title`}>
                  {member.fullName}
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1.5' : isTall || isLarge ? 'py-3.5 px-3' : 'py-2.5 px-3'} text-slate-700 font-sans-title`}>
                  {member.relationship}
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1' : isTall || isLarge ? 'py-3.5 px-2' : 'py-2.5 px-2'} text-center font-mono-tabular text-slate-700`}>
                  {member.age}
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1' : isTall || isLarge ? 'py-3.5 px-2' : 'py-2.5 px-2'} text-center font-sans-title text-slate-600`}>
                  {member.gender}
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1.5 text-[9px]' : isLarge ? 'py-3.5 px-3 text-xs' : 'py-2.5 px-3 text-[11px]'} text-slate-600 font-sans-title`}>
                  {member.educationLevel}
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1.5 text-[9px]' : isLarge ? 'py-3.5 px-3 text-xs' : 'py-2.5 px-3 text-[11px]'} text-slate-600 font-sans-title`}>
                  {member.occupation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Field Notes */}
      {data.officialNotes && (
        <section
          className={`${layout.sectionMbClass} ${
            isCompact ? 'p-2.5' : 'p-3.5'
          } rounded bg-slate-50 border-l-3 border-slate-400 font-sans-title ${layout.metaSizeClass} text-slate-700 print-avoid-break`}
        >
          <strong className="block text-slate-800 mb-0.5">{t('field_notes')}:</strong>
          <p>{data.officialNotes}</p>
        </section>
      )}

      {/* Signatures & Certification Footer */}
      <footer
        className={`pt-5 border-t border-slate-200 flex ${
          isCompact ? 'flex-col items-start gap-3' : 'flex-row items-end justify-between gap-4'
        } font-sans-title ${layout.metaSizeClass} text-slate-600 print-avoid-break`}
      >
        <div>
          <div className={`${layout.smallSizeClass} text-slate-400`}>{t('enumerator_name')}:</div>
          <div className="font-bold text-slate-900 mt-0.5">{data.enumeratorName}</div>
        </div>

        <div className={`${isCompact ? 'text-left' : 'text-right'} border p-2.5 rounded bg-slate-50 border-slate-200`}>
          <div className={`${layout.smallSizeClass} text-slate-500 font-medium`}>
            {data.supervisorSignatureRef}
          </div>
          <div className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-slate-400 font-mono-tabular mt-0.5`}>
            Official Municipal Archive Record
          </div>
        </div>
      </footer>
    </div>
  );
};

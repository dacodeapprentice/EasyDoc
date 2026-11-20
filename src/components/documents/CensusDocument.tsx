import React from 'react';
import {
  CensusData,
  DocumentAssetBundle,
  DocumentStyle,
  ColorTheme,
  LanguageCode,
} from '../../types/document';
import { ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { resolveDocumentAssets } from '../../assets/documentAssets';
import {
  DocumentFooterBand,
  DocumentHeaderBand,
  DocumentInfoCard,
  DocumentNotesBox,
  DocumentSheet,
  DocumentStatusBadge,
  PlaceholderText,
  hasText,
} from './TemplatePrimitives';

interface CensusDocumentProps {
  data: CensusData;
  style: DocumentStyle;
  theme?: ColorTheme;
  assets?: DocumentAssetBundle;
  lang?: LanguageCode;
}

export const CensusDocument: React.FC<CensusDocumentProps> = ({
  data,
  style,
  assets,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const mounted = assets || resolveDocumentAssets(style);
  const { theme, layout } = mounted;
  const { isCompact, isTall, isLarge } = layout;

  const hasNotes = hasText(data.officialNotes);

  return (
    <DocumentSheet assets={mounted}>
      {/* Census Registry Header Structure */}
      <DocumentHeaderBand
        assets={mounted}
        left={
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
              District / Region:{' '}
              <strong>
                <PlaceholderText value={data.districtRegion} placeholder="District or Region Here" />
              </strong>
              {(hasText(data.enumerationArea) || !hasText(data.districtRegion)) && (
                <>
                  {' · '}Area Code: <PlaceholderText value={data.enumerationArea} placeholder="Area Code" />
                </>
              )}
            </p>
          </div>
        }
        right={
          <div className="font-sans-title">
            <DocumentStatusBadge
              assets={mounted}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              label={t('verified')}
            />
            <div className={`font-mono-tabular ${layout.metaSizeClass} font-semibold text-slate-700 mt-1.5`}>
              ID: <PlaceholderText value={data.censusCode} placeholder="ID-0000" />
            </div>
            <div className={`${layout.smallSizeClass} text-slate-500 mt-0.5`}>
              {t('survey_date')}: <PlaceholderText value={data.surveyDate} placeholder="YYYY-MM-DD" />
            </div>
          </div>
        }
      />

      {/* Dwelling & Household Demographics Card */}
      <DocumentInfoCard assets={mounted}>
        <div
          className={`grid ${
            isCompact ? 'grid-cols-2 gap-2.5' : isLarge ? 'grid-cols-3 gap-5' : 'grid-cols-3 gap-3.5'
          }`}
        >
          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('head_household')}:</span>
            <strong className={`text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'} font-bold block mt-0.5`}>
              <PlaceholderText value={data.headOfHousehold} placeholder="Head of Household Name" />
            </strong>
          </div>

          <div className={isCompact ? 'col-span-1' : 'col-span-2'}>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('residential_address')}:</span>
            <span className="text-slate-800 font-semibold block mt-0.5">
              <PlaceholderText value={data.residentialAddress} placeholder="Street address, unit, city" />
            </span>
          </div>

          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('dwelling_type')}:</span>
            <span className="text-slate-800 font-medium block mt-0.5">
              <PlaceholderText value={data.dwellingType} placeholder="Dwelling type here" />
            </span>
          </div>

          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('tenure_status')}:</span>
            <span className="text-slate-800 font-medium block mt-0.5">
              <PlaceholderText value={data.tenureStatus} placeholder="Tenure status here" />
            </span>
          </div>

          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('total_rooms')}:</span>
            <span className="text-slate-800 font-mono-tabular font-bold block mt-0.5">
              <PlaceholderText value={data.totalRooms} placeholder="0" />
            </span>
          </div>

          <div>
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('water_source')}:</span>
            <span className="text-slate-800 font-medium block mt-0.5">
              <PlaceholderText value={data.primaryWaterSource} placeholder="Water source here" />
            </span>
          </div>

          <div className="col-span-2">
            <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('electricity_access')}:</span>
            <span className="text-slate-800 font-medium block mt-0.5">
              <PlaceholderText value={data.electricityAccess} placeholder="Electricity access here" />
            </span>
          </div>
        </div>
      </DocumentInfoCard>

      {/* Household Residents Roster Table */}
      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        <div className="flex items-center justify-between mb-2 font-sans-title">
          <h2
            className={`${layout.metaSizeClass} font-bold uppercase tracking-wider`}
            style={{ color: theme.primaryDark }}
          >
            {t('resident_roster')} ({data.householdMembers.length})
          </h2>
        </div>

        <table
          className={`w-full text-left border-collapse ${
            isCompact ? 'text-[9.5px] table-fixed' : layout.tableTextClass
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
                  <PlaceholderText value={member.fullName} placeholder="Resident name" />
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1.5' : isTall || isLarge ? 'py-3.5 px-3' : 'py-2.5 px-3'} text-slate-700 font-sans-title`}>
                  <PlaceholderText value={member.relationship} placeholder="Relationship" />
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1' : isTall || isLarge ? 'py-3.5 px-2' : 'py-2.5 px-2'} text-center font-mono-tabular text-slate-700`}>
                  <PlaceholderText value={member.age} placeholder="—" />
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1' : isTall || isLarge ? 'py-3.5 px-2' : 'py-2.5 px-2'} text-center font-sans-title text-slate-600`}>
                  <PlaceholderText value={member.gender} placeholder="—" />
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1.5 text-[9px]' : isLarge ? 'py-3.5 px-3 text-xs' : 'py-2.5 px-3 text-[11px]'} text-slate-600 font-sans-title`}>
                  <PlaceholderText value={member.educationLevel} placeholder="Education" />
                </td>
                <td className={`${isCompact ? 'py-1.5 px-1.5 text-[9px]' : isLarge ? 'py-3.5 px-3 text-xs' : 'py-2.5 px-3 text-[11px]'} text-slate-600 font-sans-title`}>
                  <PlaceholderText value={member.occupation} placeholder="Occupation" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Field Notes */}
      {(hasNotes || !hasText(data.headOfHousehold)) && (
        <DocumentNotesBox
          assets={mounted}
          label={t('field_notes')}
          text={data.officialNotes}
          placeholder="Add general observations or verification notes here."
        />
      )}

      {/* Signatures & Certification Footer */}
      <DocumentFooterBand
        assets={mounted}
        align="end"
        left={
          <div>
            <div className={`${layout.smallSizeClass} text-slate-400`}>{t('enumerator_name')}:</div>
            <div className="font-bold text-slate-900 mt-0.5">
              <PlaceholderText value={data.enumeratorName} placeholder="Enumerator Name Here" />
            </div>
          </div>
        }
        right={
          <div className="border p-2.5 rounded bg-slate-50 border-slate-200">
            <div className={`${layout.smallSizeClass} text-slate-500 font-medium`}>
              <PlaceholderText
                value={data.supervisorSignatureRef}
                placeholder="Supervisor verification reference"
              />
            </div>
            <div className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-slate-400 font-mono-tabular mt-0.5`}>
              {t('census_registry')}
            </div>
          </div>
        }
      />
    </DocumentSheet>
  );
};

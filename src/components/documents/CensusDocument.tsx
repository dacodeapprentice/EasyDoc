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
  DocumentSectionHeading,
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
  const { theme, layout, design } = mounted;
  const { isCompact, isUltraNarrow, isTall, isLarge } = layout;

  const hasNotes = hasText(data.officialNotes);

  const renderDwellingFieldsGrid = (columnsClass: string) => (
    <div className={`grid ${columnsClass}`}>
      <div>
        <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('head_household')}:</span>
        <strong className={`text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'} font-bold block mt-0.5`}>
          <PlaceholderText value={data.headOfHousehold} placeholder="Head of Household Name" />
        </strong>
      </div>

      <div className={isUltraNarrow || isCompact || design.id === 'split-sidebar' ? 'col-span-1' : 'col-span-2'}>
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

      <div className={isUltraNarrow || design.id === 'split-sidebar' ? 'col-span-1' : 'col-span-2'}>
        <span className={`text-slate-500 ${layout.smallSizeClass} block`}>{t('electricity_access')}:</span>
        <span className="text-slate-800 font-medium block mt-0.5">
          <PlaceholderText value={data.electricityAccess} placeholder="Electricity access here" />
        </span>
      </div>
    </div>
  );

  const renderRosterTable = (narrowContainer = false, tintedHeader = false) => {
    const compactCols = isUltraNarrow || narrowContainer;
    return (
      <table
        className={`w-full text-left border-collapse ${
          isCompact || narrowContainer ? 'text-[9.5px] table-fixed' : layout.tableTextClass
        }`}
      >
        <thead>
          <tr
            className="border-b-2 font-sans-title text-slate-700 font-bold"
            style={{
              backgroundColor: tintedHeader ? theme.primaryLight : '#f8fafc',
              borderColor: design.id === 'swiss-grid' ? theme.textHeader : '#cbd5e1',
            }}
          >
            <th className={`${isCompact || narrowContainer ? 'py-1.5 px-1 w-5' : 'py-2 px-2 w-8'} text-center`}>#</th>
            <th className={isCompact || narrowContainer ? 'py-1.5 px-1' : 'py-2 px-3'}>{t('full_name')}</th>
            <th className={isCompact || narrowContainer ? 'py-1.5 px-1' : 'py-2 px-3'}>Relationship</th>
            <th className={`${isCompact || narrowContainer ? 'py-1.5 px-0.5 w-8' : 'py-2 px-2 w-12'} text-center`}>Age</th>
            {!compactCols && (
              <>
                <th className={`${isCompact ? 'py-1.5 px-0.5 w-10' : 'py-2 px-2 w-16'} text-center`}>Gender</th>
                <th className={isCompact ? 'py-1.5 px-1' : 'py-2 px-3'}>Education</th>
              </>
            )}
            <th className={isCompact || narrowContainer ? 'py-1.5 px-1' : 'py-2 px-3'}>Occupation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.householdMembers.map((member, idx) => (
            <tr key={member.id || idx} className="hover:bg-slate-50/50">
              <td className={`${isCompact || narrowContainer ? 'py-1.5 px-1' : isTall || isLarge ? 'py-3.5 px-2' : 'py-2.5 px-2'} text-center font-mono-tabular text-slate-400`}>
                {idx + 1}
              </td>
              <td className={`${isCompact || narrowContainer ? 'py-1.5 px-1' : isTall || isLarge ? 'py-3.5 px-3' : 'py-2.5 px-3'} font-semibold text-slate-900 font-sans-title`}>
                <PlaceholderText value={member.fullName} placeholder="Resident name" />
              </td>
              <td className={`${isCompact || narrowContainer ? 'py-1.5 px-1' : isTall || isLarge ? 'py-3.5 px-3' : 'py-2.5 px-3'} text-slate-700 font-sans-title`}>
                <PlaceholderText value={member.relationship} placeholder="Relationship" />
              </td>
              <td className={`${isCompact || narrowContainer ? 'py-1.5 px-0.5' : isTall || isLarge ? 'py-3.5 px-2' : 'py-2.5 px-2'} text-center font-mono-tabular text-slate-700`}>
                <PlaceholderText value={member.age} placeholder="—" />
              </td>
              {!compactCols && (
                <>
                  <td className={`${isCompact ? 'py-1.5 px-0.5' : isTall || isLarge ? 'py-3.5 px-2' : 'py-2.5 px-2'} text-center font-sans-title text-slate-600`}>
                    <PlaceholderText value={member.gender} placeholder="—" />
                  </td>
                  <td className={`${isCompact ? 'py-1.5 px-1 text-[9px]' : isLarge ? 'py-3.5 px-3 text-xs' : 'py-2.5 px-3 text-[11px]'} text-slate-600 font-sans-title`}>
                    <PlaceholderText value={member.educationLevel} placeholder="Education" />
                  </td>
                </>
              )}
              <td className={`${isCompact || narrowContainer ? 'py-1.5 px-1 text-[9px]' : isLarge ? 'py-3.5 px-3 text-xs' : 'py-2.5 px-3 text-[11px]'} text-slate-600 font-sans-title`}>
                <PlaceholderText value={member.occupation} placeholder="Occupation" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // COMPOSITION 4: Registry Sidebar (Left administrative panel + right dwelling & roster)
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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-white border border-slate-200">
                  <FileSpreadsheet className="w-4 h-4" style={{ color: theme.primary }} />
                </span>
                <span className={`font-sans-title ${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-600`}>
                  {t('census_registry')}
                </span>
              </div>

              <h1
                className={`font-sans-title ${isLarge ? 'text-2xl' : 'text-lg'} font-extrabold tracking-tight leading-snug`}
                style={{ color: theme.textHeader }}
              >
                Demographic Household Survey
              </h1>

              <div className="flex justify-start">
                <DocumentStatusBadge
                  assets={mounted}
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  label={t('verified')}
                  className="ml-0!"
                />
              </div>

              <div className="pt-3 border-t space-y-2.5 font-sans-title" style={{ borderColor: `${theme.primary}25` }}>
                <div>
                  <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('census_code')}</span>
                  <span className={`${layout.metaSizeClass} font-mono-tabular font-bold text-slate-900`}>
                    <PlaceholderText value={data.censusCode} placeholder="ID-0000" />
                  </span>
                </div>
                <div>
                  <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('survey_date')}</span>
                  <span className={`${layout.metaSizeClass} font-mono-tabular font-semibold text-slate-800`}>
                    <PlaceholderText value={data.surveyDate} placeholder="YYYY-MM-DD" />
                  </span>
                </div>
                <div>
                  <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('district_region')}</span>
                  <span className={`${layout.metaSizeClass} font-semibold text-slate-800`}>
                    <PlaceholderText value={data.districtRegion} placeholder="District or Region Here" />
                  </span>
                </div>
                <div>
                  <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('enum_area')}</span>
                  <span className={`${layout.metaSizeClass} font-mono-tabular text-slate-700`}>
                    <PlaceholderText value={data.enumerationArea} placeholder="Area Code" />
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3 font-sans-title" style={{ borderColor: `${theme.primary}25` }}>
              <div>
                <div className={`${layout.smallSizeClass} text-slate-500`}>{t('enumerator_name')}:</div>
                <div className={`${layout.metaSizeClass} font-bold text-slate-900 mt-0.5`}>
                  <PlaceholderText value={data.enumeratorName} placeholder="Enumerator Name Here" />
                </div>
              </div>
              <div className="border p-2 rounded bg-white border-slate-200">
                <div className={`${layout.smallSizeClass} text-slate-600 font-medium`}>
                  <PlaceholderText
                    value={data.supervisorSignatureRef}
                    placeholder="Supervisor verification reference"
                  />
                </div>
              </div>
            </div>
          </aside>

          <div className="col-span-8 space-y-5" style={{ padding: `${pad}px` }}>
            <div>
              <DocumentSectionHeading assets={mounted} title={t('head_household')} />
              {renderDwellingFieldsGrid('grid-cols-2 gap-3 font-sans-title text-xs')}
            </div>

            <div>
              <DocumentSectionHeading
                assets={mounted}
                title={`${t('resident_roster')} (${data.householdMembers.length})`}
              />
              {renderRosterTable(true, false)}
            </div>

            {(hasNotes || !hasText(data.headOfHousehold)) && (
              <DocumentNotesBox
                assets={mounted}
                label={t('field_notes')}
                text={data.officialNotes}
                placeholder="Add general observations or verification notes here."
              />
            )}
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITION 5: Tabular Swiss Grid (Numbered 12-column blocks)
  if (design.id === 'swiss-grid' && !isCompact) {
    return (
      <DocumentSheet assets={mounted}>
        <header
          className={`border-b ${layout.isLarge ? 'pb-6 mb-7' : 'pb-4 mb-6'} flex items-end justify-between gap-4`}
          style={{ borderColor: theme.textHeader }}
        >
          <div>
            <span className={`font-sans-title ${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-500 block mb-1`}>
              {t('census_registry')}
            </span>
            <h1
              className={`font-sans-title ${isLarge ? 'text-3xl' : 'text-2xl'} font-extrabold tracking-tight`}
              style={{ color: theme.textHeader }}
            >
              Demographic Household Survey
            </h1>
            <p className={`font-sans-title ${layout.metaSizeClass} text-slate-600 mt-1`}>
              <PlaceholderText value={data.districtRegion} placeholder="District or Region Here" />
              {' · '}
              <PlaceholderText value={data.enumerationArea} placeholder="Area Code" />
            </p>
          </div>
          <div className="text-right font-sans-title shrink-0">
            <DocumentStatusBadge
              assets={mounted}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              label={t('verified')}
            />
            <div className={`font-mono-tabular ${layout.metaSizeClass} font-bold text-slate-800 mt-1.5`}>
              <PlaceholderText value={data.censusCode} placeholder="ID-0000" />
            </div>
            <div className={`${layout.smallSizeClass} font-mono-tabular text-slate-500`}>
              <PlaceholderText value={data.surveyDate} placeholder="YYYY-MM-DD" />
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-5 items-start">
            <div className="col-span-3">
              <DocumentSectionHeading assets={mounted} title={`01. ${t('dwelling_type')}`} />
            </div>
            <div className="col-span-9 font-sans-title text-xs">
              {renderDwellingFieldsGrid('grid-cols-3 gap-3.5')}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5 items-start">
            <div className="col-span-3">
              <DocumentSectionHeading
                assets={mounted}
                title={`02. ${t('resident_roster')} (${data.householdMembers.length})`}
              />
            </div>
            <div className="col-span-9">{renderRosterTable(false, false)}</div>
          </div>

          <div className="grid grid-cols-12 gap-5 items-start">
            <div className="col-span-3">
              <DocumentSectionHeading assets={mounted} title={`03. ${t('verified')}`} />
            </div>
            <div className="col-span-9 space-y-4">
              {(hasNotes || !hasText(data.headOfHousehold)) && (
                <DocumentNotesBox
                  assets={mounted}
                  label={t('field_notes')}
                  text={data.officialNotes}
                  placeholder="Add general observations or verification notes here."
                />
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 font-sans-title text-xs">
                <div>
                  <span className="text-slate-400 block">{t('enumerator_name')}:</span>
                  <strong className="text-slate-900">
                    <PlaceholderText value={data.enumeratorName} placeholder="Enumerator Name Here" />
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">{t('supervisor_sig')}:</span>
                  <strong className="text-slate-800">
                    <PlaceholderText
                      value={data.supervisorSignatureRef}
                      placeholder="Supervisor verification reference"
                    />
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITIONS 1, 2, 3 (and compact fallback)
  const isBanner = design.id === 'modern-banner';
  const isEditorial = design.id === 'editorial-serif';

  return (
    <DocumentSheet assets={mounted}>
      <DocumentHeaderBand
        assets={mounted}
        left={
          <div>
            <div className={`flex items-center gap-2 mb-1.5 ${isEditorial ? 'justify-center' : ''}`}>
              <span className="p-1 rounded bg-slate-100 text-slate-700">
                <FileSpreadsheet className="w-4 h-4" style={{ color: theme.primary }} />
              </span>
              <span className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-widest text-slate-500`}>
                {t('census_registry')}
              </span>
            </div>
            <h1
              className={`font-sans-title ${
                isUltraNarrow ? 'text-base' : isCompact ? 'text-lg' : isLarge ? 'text-3xl' : 'text-2xl'
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

      {/* Survey Banner KPI Strip */}
      {isBanner && (
        <div
          className={`${layout.sectionMbClass} grid ${
            isUltraNarrow ? 'grid-cols-2' : 'grid-cols-4'
          } gap-2.5 font-sans-title print-avoid-break`}
        >
          <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50">
            <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('census_code')}</span>
            <span className={`font-mono-tabular font-bold text-slate-900 ${layout.metaSizeClass}`}>
              <PlaceholderText value={data.censusCode} placeholder="ID-0000" />
            </span>
          </div>
          <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50">
            <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('survey_date')}</span>
            <span className={`font-mono-tabular font-bold text-slate-900 ${layout.metaSizeClass}`}>
              <PlaceholderText value={data.surveyDate} placeholder="YYYY-MM-DD" />
            </span>
          </div>
          <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50">
            <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('total_rooms')}</span>
            <span className={`font-mono-tabular font-bold text-slate-900 ${layout.metaSizeClass}`}>
              <PlaceholderText value={data.totalRooms} placeholder="0" />
            </span>
          </div>
          <div
            className="p-2.5 rounded-md border"
            style={{ backgroundColor: theme.primaryLight, borderColor: `${theme.primary}30` }}
          >
            <span className={`${layout.smallSizeClass} text-slate-600 block`}>{t('resident_roster')}</span>
            <span className={`font-mono-tabular font-bold ${layout.metaSizeClass}`} style={{ color: theme.primaryDark }}>
              {data.householdMembers.length}
            </span>
          </div>
        </div>
      )}

      {/* Editorial Classic: flat ruled Dwelling grid; Others: DocumentInfoCard */}
      {isEditorial ? (
        <section
          className={`${layout.sectionMbClass} py-4 border-y border-slate-200 font-sans-title ${layout.metaSizeClass} print-avoid-break`}
        >
          {renderDwellingFieldsGrid(
            isUltraNarrow
              ? 'grid-cols-1 gap-2'
              : isCompact
              ? 'grid-cols-2 gap-2.5'
              : isLarge
              ? 'grid-cols-3 gap-5'
              : 'grid-cols-3 gap-3.5'
          )}
        </section>
      ) : (
        <DocumentInfoCard assets={mounted}>
          {renderDwellingFieldsGrid(
            isUltraNarrow
              ? 'grid-cols-1 gap-2'
              : isCompact
              ? 'grid-cols-2 gap-2.5'
              : isLarge
              ? 'grid-cols-3 gap-5'
              : 'grid-cols-3 gap-3.5'
          )}
        </DocumentInfoCard>
      )}

      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        <DocumentSectionHeading
          assets={mounted}
          title={`${t('resident_roster')} (${data.householdMembers.length})`}
        />
        {renderRosterTable(false, isBanner)}
      </section>

      {(hasNotes || !hasText(data.headOfHousehold)) && (
        <DocumentNotesBox
          assets={mounted}
          label={t('field_notes')}
          text={data.officialNotes}
          placeholder="Add general observations or verification notes here."
        />
      )}

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

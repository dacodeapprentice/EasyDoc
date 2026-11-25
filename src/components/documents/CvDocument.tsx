import React from 'react';
import {
  CvData,
  DocumentAssetBundle,
  DocumentStyle,
  ColorTheme,
  LanguageCode,
} from '../../types/document';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { resolveDocumentAssets } from '../../assets/documentAssets';
import {
  DocumentHeaderBand,
  DocumentLogo,
  DocumentSectionHeading,
  DocumentSheet,
  DocumentTagList,
  PlaceholderText,
  hasText,
} from './TemplatePrimitives';

interface CvDocumentProps {
  data: CvData;
  style: DocumentStyle;
  theme?: ColorTheme;
  assets?: DocumentAssetBundle;
  lang?: LanguageCode;
}

export const CvDocument: React.FC<CvDocumentProps> = ({
  data,
  style,
  assets,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const mounted = assets || resolveDocumentAssets(style);
  const { theme, layout, design } = mounted;
  const { isCompact, isUltraNarrow, isShort, isTall, isLarge } = layout;

  const hasAnyContact =
    hasText(data.email) || hasText(data.phone) || hasText(data.location) || hasText(data.website);

  const renderContactItems = (vertical = false, centered = false) => (
    <div
      className={`flex ${vertical ? 'flex-col gap-1.5' : 'flex-wrap items-center'} ${
        centered ? 'justify-center' : ''
      } ${
        !vertical &&
        (isUltraNarrow
          ? 'gap-x-2.5 gap-y-1 text-[9.5px] mt-2 pt-2'
          : isCompact
          ? 'gap-x-3 gap-y-1 text-[10px] mt-2 pt-2'
          : isLarge
          ? 'gap-x-6 gap-y-2 text-sm mt-4 pt-4'
          : 'gap-x-4 gap-y-1.5 text-xs mt-3 pt-3')
      } ${vertical ? `${layout.metaSizeClass}` : 'border-t border-slate-200'} text-slate-600 font-sans-title`}
    >
      {(!hasAnyContact || hasText(data.email)) && (
        <span className="inline-flex items-center gap-1.5 min-w-0 break-all">
          <Mail className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0`} style={{ color: theme.primary }} />
          <PlaceholderText value={data.email} placeholder="email@example.com" />
        </span>
      )}
      {(!hasAnyContact || hasText(data.phone)) && (
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <Phone className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0`} style={{ color: theme.primary }} />
          <PlaceholderText value={data.phone} placeholder="Phone number here" />
        </span>
      )}
      {(!hasAnyContact || hasText(data.location)) && (
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <MapPin className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0`} style={{ color: theme.primary }} />
          <PlaceholderText value={data.location} placeholder="City, Country" />
        </span>
      )}
      {(!hasAnyContact || hasText(data.website)) && (
        <span className="inline-flex items-center gap-1.5 min-w-0 break-all">
          <Globe className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0`} style={{ color: theme.primary }} />
          <PlaceholderText value={data.website} placeholder="website.example.com" />
        </span>
      )}
    </div>
  );

  const renderSummary = () => (
    <section className={`${layout.sectionMbClass} print-avoid-break`}>
      <DocumentSectionHeading assets={mounted} title={t('profile_summary')} />
      <p className={`${layout.bodySizeClass} text-slate-700`}>
        <PlaceholderText
          value={data.summary}
          placeholder="Write a brief overview of your background, skills, and core focus areas here."
        />
      </p>
    </section>
  );

  const renderExperience = () => {
    const entries = data.experience && data.experience.length > 0 ? data.experience : [];
    if (entries.length === 0) return null;

    return (
      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        <DocumentSectionHeading assets={mounted} title={t('work_experience')} />

        <div className={layout.itemGapClass}>
          {entries.map((exp) => {
            const visibleHighlights =
              exp.highlights && exp.highlights.some(hasText)
                ? exp.highlights.filter(hasText)
                : exp.highlights && exp.highlights.length > 0
                ? exp.highlights
                : [];

            return (
              <div key={exp.id} className="print-avoid-break">
                <div
                  className={`flex ${
                    isCompact ? 'flex-col gap-0.5' : 'flex-row items-baseline justify-between gap-3'
                  } font-sans-title`}
                >
                  <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
                    <PlaceholderText value={exp.role} placeholder="Role or Position Title" />
                    <span className="font-normal text-slate-500"> · </span>
                    <PlaceholderText
                      value={exp.company}
                      placeholder="Organization Name"
                      className="font-semibold text-slate-800"
                    />
                  </div>
                  <div className={`${layout.smallSizeClass} font-medium text-slate-500 font-mono-tabular shrink-0`}>
                    <PlaceholderText value={exp.period} placeholder="Start – End" />
                    {(hasText(exp.location) || (!hasText(exp.period) && !hasText(exp.role))) && (
                      <>
                        {' · '}
                        <PlaceholderText value={exp.location} placeholder="Location" />
                      </>
                    )}
                  </div>
                </div>

                {visibleHighlights.length > 0 && (
                  <ul
                    className={`mt-1.5 list-disc list-outside pl-4 ${
                      isUltraNarrow
                        ? 'space-y-0.5 text-[10px]'
                        : isCompact
                        ? 'space-y-0.5 text-[10.5px]'
                        : isLarge
                        ? 'space-y-1.5 text-sm'
                        : 'space-y-1 text-xs'
                    } text-slate-700 leading-normal`}
                  >
                    {visibleHighlights.map((h, i) => (
                      <li key={i}>
                        <PlaceholderText
                          value={h}
                          placeholder="Describe a key responsibility, task, or outcome here."
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderEducation = () => {
    const entries = data.education && data.education.length > 0 ? data.education : [];
    if (entries.length === 0) return null;

    return (
      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        <DocumentSectionHeading assets={mounted} title={t('education')} />

        <div className={isCompact ? 'space-y-2' : isLarge ? 'space-y-4' : 'space-y-3'}>
          {entries.map((edu) => (
            <div
              key={edu.id}
              className={`flex ${
                isCompact || isLarge || design.id === 'split-sidebar'
                  ? 'flex-col gap-0.5'
                  : 'flex-row items-baseline justify-between gap-3'
              } font-sans-title print-avoid-break`}
            >
              <div>
                <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
                  <PlaceholderText value={edu.degree} placeholder="Degree or Certification Title" />
                </div>
                <div className={`${layout.metaSizeClass} text-slate-600 font-medium`}>
                  <PlaceholderText value={edu.institution} placeholder="Institution Name" />
                  {(hasText(edu.details) || !hasText(edu.degree)) && (
                    <span className="italic text-slate-500 font-normal">
                      {' '}
                      — <PlaceholderText value={edu.details} placeholder="Field of study or notes" />
                    </span>
                  )}
                </div>
              </div>
              <div className={`${layout.smallSizeClass} font-medium text-slate-500 font-mono-tabular shrink-0`}>
                <PlaceholderText value={edu.year} placeholder="Start – End" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderSkills = () => {
    const hasSkills = data.skills && data.skills.length > 0;
    const displaySkills = hasSkills ? data.skills : ['Skill Placeholder 1', 'Skill Placeholder 2', 'Skill Placeholder 3'];

    return (
      <div>
        <DocumentSectionHeading assets={mounted} title={t('key_competencies')} className="mb-2" />
        <DocumentTagList assets={mounted} items={displaySkills} isPlaceholder={!hasSkills} />
      </div>
    );
  };

  const renderLanguages = () => {
    const hasLangs = data.languages && data.languages.length > 0;
    const displayLangs = hasLangs ? data.languages : ['Language 1 (Level)', 'Language 2 (Level)'];

    return (
      <div>
        <DocumentSectionHeading assets={mounted} title={t('languages')} className="mb-2" />
        <div className={`flex flex-wrap gap-2 ${layout.metaSizeClass} text-slate-700 pt-1 font-sans-title`}>
          {displayLangs.map((langItem, index) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1 font-medium ${
                hasLangs ? '' : 'text-slate-400 italic font-normal'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: theme.primary }}
              />
              <span>{langItem}</span>
              {index < displayLangs.length - 1 && (
                <span className="text-slate-300 ml-1">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // COMPOSITION 4: Two-Column Split Sidebar (responsive: collapses gracefully when narrow)
  if (design.id === 'split-sidebar' && !isCompact) {
    const pad = layout.paddingPx;
    return (
      <DocumentSheet assets={mounted} showHeaderAccent={false} fullBleedSplit>
        <div
          className="grid grid-cols-12 w-full"
          style={{ minHeight: `${layout.paper.heightPx}px` }}
        >
          <aside
            className="col-span-4 border-r flex flex-col justify-start gap-5"
            style={{
              backgroundColor: theme.primaryLight,
              borderColor: theme.border,
              padding: `${pad}px ${Math.round(pad * 0.72)}px`,
            }}
          >
            {data.photoUrl && (
              <div className="flex justify-start">
                <DocumentLogo
                  src={data.photoUrl}
                  alt={data.fullName || 'Profile'}
                  assets={mounted}
                  variant="circle"
                />
              </div>
            )}

            <div>
              <h1
                className={`font-sans-title ${
                  isLarge ? 'text-3xl' : 'text-xl'
                } font-extrabold tracking-tight leading-tight`}
                style={hasText(data.fullName) ? { color: theme.textHeader } : undefined}
              >
                <PlaceholderText value={data.fullName} placeholder="Full Name Here" />
              </h1>
              <p
                className={`font-sans-title ${isLarge ? 'text-base' : 'text-xs'} font-semibold mt-1.5`}
                style={hasText(data.professionalTitle) ? { color: theme.primary } : undefined}
              >
                <PlaceholderText value={data.professionalTitle} placeholder="Professional Title Here" />
              </p>
            </div>

            <div className="pt-3 border-t" style={{ borderColor: `${theme.primary}25` }}>
              {renderContactItems(true)}
            </div>

            {renderSkills()}
            {renderLanguages()}
          </aside>

          <div
            className="col-span-8"
            style={{ padding: `${pad}px` }}
          >
            {renderSummary()}
            {renderExperience()}
            {renderEducation()}
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITION 5: Swiss Grid (left-indexed architectural layout on standard/wide sheets)
  if (design.id === 'swiss-grid' && !isCompact) {
    return (
      <DocumentSheet assets={mounted}>
        <DocumentHeaderBand
          assets={mounted}
          divided
          left={
            <div>
              <h1
                className={`font-sans-title ${layout.titleSizeClass} font-extrabold tracking-tight`}
                style={hasText(data.fullName) ? { color: theme.textHeader } : undefined}
              >
                <PlaceholderText value={data.fullName} placeholder="Full Name Here" />
              </h1>
              <p
                className={`font-sans-title ${isLarge ? 'text-xl' : 'text-base'} font-semibold mt-1`}
                style={hasText(data.professionalTitle) ? { color: theme.primary } : undefined}
              >
                <PlaceholderText value={data.professionalTitle} placeholder="Professional Title Here" />
              </p>
            </div>
          }
          right={
            <div className="flex flex-col items-end gap-2">
              {data.photoUrl && (
                <DocumentLogo
                  src={data.photoUrl}
                  alt={data.fullName || 'Profile'}
                  assets={mounted}
                  variant="circle"
                />
              )}
            </div>
          }
        />

        <div className="mb-5">{renderContactItems(false)}</div>

        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-5 items-start">
            <div className="col-span-4">
              <DocumentSectionHeading assets={mounted} title={t('profile_summary')} />
            </div>
            <div className="col-span-8">
              <p className={`${layout.bodySizeClass} text-slate-700`}>
                <PlaceholderText
                  value={data.summary}
                  placeholder="Write a brief overview of your background, skills, and core focus areas here."
                />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5 items-start">
            <div className="col-span-4">
              <DocumentSectionHeading assets={mounted} title={t('work_experience')} />
            </div>
            <div className="col-span-8">
              <div className={layout.itemGapClass}>
                {data.experience.map((exp) => (
                  <div key={exp.id} className="print-avoid-break">
                    <div className="flex items-baseline justify-between gap-2 font-sans-title">
                      <div className="font-bold text-slate-900 text-sm">
                        <PlaceholderText value={exp.role} placeholder="Role or Position Title" />
                        <span className="font-normal text-slate-500"> · </span>
                        <PlaceholderText value={exp.company} placeholder="Organization Name" />
                      </div>
                      <span className={`${layout.smallSizeClass} text-slate-500 font-mono-tabular shrink-0`}>
                        <PlaceholderText value={exp.period} placeholder="Start – End" />
                      </span>
                    </div>
                    {exp.highlights.length > 0 && (
                      <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                        {(exp.highlights.some(hasText) ? exp.highlights.filter(hasText) : exp.highlights).map((h, i) => (
                          <li key={i}>
                            <PlaceholderText
                              value={h}
                              placeholder="Describe a key responsibility, task, or outcome here."
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5 items-start">
            <div className="col-span-4">
              <DocumentSectionHeading assets={mounted} title={t('education')} />
            </div>
            <div className="col-span-8 space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex items-baseline justify-between gap-2 font-sans-title">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      <PlaceholderText value={edu.degree} placeholder="Degree or Certification Title" />
                    </div>
                    <div className={`${layout.metaSizeClass} text-slate-600`}>
                      <PlaceholderText value={edu.institution} placeholder="Institution Name" />
                    </div>
                  </div>
                  <span className={`${layout.smallSizeClass} text-slate-500 font-mono-tabular shrink-0`}>
                    <PlaceholderText value={edu.year} placeholder="Start – End" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5 items-start">
            <div className="col-span-4">
              <DocumentSectionHeading assets={mounted} title={t('key_competencies')} />
            </div>
            <div className="col-span-8 space-y-4">
              <DocumentTagList
                assets={mounted}
                items={data.skills.length ? data.skills : ['Skill Placeholder 1', 'Skill Placeholder 2']}
                isPlaceholder={!data.skills.length}
              />
              {renderLanguages()}
            </div>
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITIONS 1, 2, 3 (and narrow responsive fallback for 4 & 5)
  const isEditorial = design.id === 'editorial-serif';

  return (
    <DocumentSheet assets={mounted}>
      <DocumentHeaderBand
        assets={mounted}
        divided={false}
        left={
          <div>
            <h1
              className={`font-sans-title ${layout.titleSizeClass} font-extrabold tracking-tight`}
              style={hasText(data.fullName) ? { color: theme.textHeader } : undefined}
            >
              <PlaceholderText value={data.fullName} placeholder="Full Name Here" />
            </h1>
            <p
              className={`font-sans-title ${
                isUltraNarrow ? 'text-xs' : isCompact ? 'text-xs' : isLarge ? 'text-xl' : 'text-lg'
              } font-semibold mt-1`}
              style={hasText(data.professionalTitle) ? { color: theme.primary } : undefined}
            >
              <PlaceholderText value={data.professionalTitle} placeholder="Professional Title Here" />
            </p>

            {renderContactItems(false, isEditorial)}
          </div>
        }
        right={
          data.photoUrl ? (
            <div className={isEditorial ? '' : 'ml-2'}>
              <DocumentLogo
                src={data.photoUrl}
                alt={data.fullName || 'Profile'}
                assets={mounted}
                variant="circle"
              />
            </div>
          ) : undefined
        }
      />

      {renderSummary()}

      {isLarge ? (
        <div className="grid grid-cols-12 gap-10 items-start">
          <div className="col-span-8">{renderExperience()}</div>
          <div className="col-span-4 space-y-8">
            {renderEducation()}
            {renderSkills()}
            {renderLanguages()}
          </div>
        </div>
      ) : (
        <>
          {renderExperience()}
          {renderEducation()}
          <div
            className={`grid ${
              isCompact ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'
            } ${isShort ? 'pt-1' : isTall ? 'pt-4' : 'pt-2'} print-avoid-break`}
          >
            {renderSkills()}
            {renderLanguages()}
          </div>
        </>
      )}
    </DocumentSheet>
  );
};

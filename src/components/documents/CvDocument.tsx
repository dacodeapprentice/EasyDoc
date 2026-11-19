import React from 'react';
import { CvData, DocumentStyle, ColorTheme, LanguageCode } from '../../types/document';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { getPaperLayout } from '../../data/defaultData';

interface CvDocumentProps {
  data: CvData;
  style: DocumentStyle;
  theme: ColorTheme;
  lang?: LanguageCode;
}

export const CvDocument: React.FC<CvDocumentProps> = ({
  data,
  style,
  theme,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const layout = getPaperLayout(style.paperSize, style.density);
  const { paper, isCompact, isShort, isTall, isLarge } = layout;
  const fontClass = style.fontFamily === 'lora' ? 'font-serif-lora' : 'font-serif-reading';

  const sectionTitleClass = `font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-wider pb-1.5 ${
    isCompact ? 'mb-2' : isLarge ? 'mb-4' : 'mb-3'
  } border-b`;

  const renderExperience = () =>
    data.experience &&
    data.experience.length > 0 && (
      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        <h2
          className={sectionTitleClass}
          style={{ borderColor: theme.border, color: theme.primaryDark }}
        >
          {t('work_experience')}
        </h2>

        <div className={layout.itemGapClass}>
          {data.experience.map((exp) => (
            <div key={exp.id} className="print-avoid-break">
              <div
                className={`flex ${
                  isCompact ? 'flex-col gap-0.5' : 'flex-row items-baseline justify-between gap-3'
                } font-sans-title`}
              >
                <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
                  {exp.role}{' '}
                  <span className="font-normal text-slate-600">at</span>{' '}
                  <span className="font-semibold text-slate-800">{exp.company}</span>
                </div>
                <div className={`${layout.smallSizeClass} font-medium text-slate-500 font-mono-tabular shrink-0`}>
                  {exp.period}
                  {exp.location && ` · ${exp.location}`}
                </div>
              </div>

              {exp.highlights && exp.highlights.length > 0 && (
                <ul
                  className={`mt-1.5 list-disc list-outside pl-4 ${
                    isCompact ? 'space-y-0.5 text-[10.5px]' : isLarge ? 'space-y-1.5 text-sm' : 'space-y-1 text-xs'
                  } text-slate-700 leading-normal`}
                >
                  {exp.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    );

  const renderEducation = () =>
    data.education &&
    data.education.length > 0 && (
      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        <h2
          className={sectionTitleClass}
          style={{ borderColor: theme.border, color: theme.primaryDark }}
        >
          {t('education')}
        </h2>

        <div className={isCompact ? 'space-y-2' : isLarge ? 'space-y-4' : 'space-y-3'}>
          {data.education.map((edu) => (
            <div
              key={edu.id}
              className={`flex ${
                isCompact || isLarge ? 'flex-col gap-0.5' : 'flex-row items-baseline justify-between gap-3'
              } font-sans-title print-avoid-break`}
            >
              <div>
                <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
                  {edu.degree}
                </div>
                <div className={`${layout.metaSizeClass} text-slate-600 font-medium`}>
                  {edu.institution}
                  {edu.details && (
                    <span className="italic text-slate-500 font-normal">
                      {' '}
                      — {edu.details}
                    </span>
                  )}
                </div>
              </div>
              <div className={`${layout.smallSizeClass} font-medium text-slate-500 font-mono-tabular shrink-0`}>
                {edu.year}
              </div>
            </div>
          ))}
        </div>
      </section>
    );

  const renderSkills = () =>
    data.skills &&
    data.skills.length > 0 && (
      <div>
        <h2
          className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-wider pb-1.5 mb-2 border-b`}
          style={{ borderColor: theme.border, color: theme.primaryDark }}
        >
          {t('key_competencies')}
        </h2>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {data.skills.map((skill, index) => (
            <span
              key={index}
              className={`${
                isCompact ? 'px-2 py-0.5 text-[10px]' : isLarge ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
              } rounded font-medium border font-sans-title`}
              style={{
                backgroundColor: theme.primaryLight,
                color: theme.primaryDark,
                borderColor: `${theme.primary}20`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    );

  const renderLanguages = () =>
    data.languages &&
    data.languages.length > 0 && (
      <div>
        <h2
          className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-wider pb-1.5 mb-2 border-b`}
          style={{ borderColor: theme.border, color: theme.primaryDark }}
        >
          {t('languages')}
        </h2>
        <div className={`flex flex-wrap gap-2 ${layout.metaSizeClass} text-slate-700 pt-1 font-sans-title`}>
          {data.languages.map((langItem, index) => (
            <span key={index} className="inline-flex items-center gap-1 font-medium">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.primary }}
              />
              <span>{langItem}</span>
              {index < data.languages.length - 1 && (
                <span className="text-slate-300 ml-1">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );

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
      {/* Decorative Header Accent */}
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

      {/* Header Section */}
      <header className={`${layout.headerMbClass} flex items-start justify-between gap-4`}>
        <div className="flex-1 min-w-0">
          <h1
            className={`font-sans-title ${layout.titleSizeClass} font-extrabold tracking-tight`}
            style={{ color: theme.textHeader }}
          >
            {data.fullName || 'Candidate Full Name'}
          </h1>
          <p
            className={`font-sans-title ${
              isCompact ? 'text-xs' : isLarge ? 'text-xl' : 'text-lg'
            } font-semibold mt-1`}
            style={{ color: theme.primary }}
          >
            {data.professionalTitle || 'Professional Title'}
          </p>

          {/* Contact Details Bar */}
          <div
            className={`flex flex-wrap items-center ${
              isCompact ? 'gap-x-3 gap-y-1 text-[10px] mt-2 pt-2' : isLarge ? 'gap-x-6 gap-y-2 text-sm mt-4 pt-4' : 'gap-x-4 gap-y-1.5 text-xs mt-3 pt-3'
            } text-slate-600 border-t border-slate-200 font-sans-title`}
          >
            {data.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} style={{ color: theme.primary }} />
                <span>{data.email}</span>
              </span>
            )}
            {data.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} style={{ color: theme.primary }} />
                <span>{data.phone}</span>
              </span>
            )}
            {data.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} style={{ color: theme.primary }} />
                <span>{data.location}</span>
              </span>
            )}
            {data.website && (
              <span className="inline-flex items-center gap-1.5">
                <Globe className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} style={{ color: theme.primary }} />
                <span>{data.website}</span>
              </span>
            )}
          </div>
        </div>

        {/* User Photo */}
        {data.photoUrl && (
          <div className="shrink-0 ml-2">
            <img
              src={data.photoUrl}
              alt={data.fullName || 'Profile'}
              className={`${
                isCompact ? 'w-16 h-16' : isLarge ? 'w-28 h-28' : 'w-24 h-24'
              } rounded-full object-cover border-2 shadow-sm`}
              style={{ borderColor: theme.primary }}
            />
          </div>
        )}
      </header>

      {/* Profile Summary */}
      {data.summary && (
        <section className={`${layout.sectionMbClass} print-avoid-break`}>
          <h2
            className={sectionTitleClass}
            style={{ borderColor: theme.border, color: theme.primaryDark }}
          >
            {t('profile_summary')}
          </h2>
          <p className={`${layout.bodySizeClass} text-slate-700`}>{data.summary}</p>
        </section>
      )}

      {/* A3 Large Format uses a 2-column broadsheet composition; smaller sheets use crisp vertical flow */}
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
    </div>
  );
};

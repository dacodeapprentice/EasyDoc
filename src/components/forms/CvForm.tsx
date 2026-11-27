import React, { useState, useEffect } from 'react';
import { CvData, WorkExperienceItem, EducationItem, LanguageCode } from '../../types/document';
import { Plus, Trash2, ChevronDown, ChevronUp, User, Briefcase, GraduationCap, Wrench } from 'lucide-react';
import { ImageUploadCrop } from '../ImageUploadCrop';
import { CalendarPeriodPicker } from '../CalendarDatePicker';
import { getTranslation } from '../../utils/i18n';

interface CvFormProps {
  data: CvData;
  onChange: (updated: CvData) => void;
  lang?: LanguageCode;
}

export const CvForm: React.FC<CvFormProps> = ({ data, onChange, lang = 'en' }) => {
  const t = (k: string) => getTranslation(lang, k);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = <K extends keyof CvData>(field: K, value: CvData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const [skillsDraft, setSkillsDraft] = useState(() => data.skills.join(', '));
  const [languagesDraft, setLanguagesDraft] = useState(() => data.languages.join(', '));

  useEffect(() => {
    const parsed = skillsDraft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.join('|') !== data.skills.join('|')) {
      setSkillsDraft(data.skills.join(', '));
    }
  }, [data.skills]);

  useEffect(() => {
    const parsed = languagesDraft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.join('|') !== data.languages.join('|')) {
      setLanguagesDraft(data.languages.join(', '));
    }
  }, [data.languages]);

  // Experience Handlers
  const addExperience = () => {
    const newItem: WorkExperienceItem = {
      id: `exp-${Date.now()}`,
      role: '',
      company: '',
      location: '',
      period: '',
      highlights: [''],
    };
    updateField('experience', [newItem, ...data.experience]);
  };

  const updateExperience = (id: string, field: keyof WorkExperienceItem, val: any) => {
    const updated = data.experience.map((item) =>
      item.id === id ? { ...item, [field]: val } : item
    );
    updateField('experience', updated);
  };

  const removeExperience = (id: string) => {
    updateField('experience', data.experience.filter((item) => item.id !== id));
  };

  const addHighlight = (expId: string) => {
    const updated = data.experience.map((item) => {
      if (item.id === expId) {
        return { ...item, highlights: [...item.highlights, ''] };
      }
      return item;
    });
    updateField('experience', updated);
  };

  const updateHighlight = (expId: string, hIdx: number, val: string) => {
    const updated = data.experience.map((item) => {
      if (item.id === expId) {
        const h = [...item.highlights];
        h[hIdx] = val;
        return { ...item, highlights: h };
      }
      return item;
    });
    updateField('experience', updated);
  };

  const removeHighlight = (expId: string, hIdx: number) => {
    const updated = data.experience.map((item) => {
      if (item.id === expId) {
        return { ...item, highlights: item.highlights.filter((_, i) => i !== hIdx) };
      }
      return item;
    });
    updateField('experience', updated);
  };

  // Education Handlers
  const addEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      year: '',
      details: '',
    };
    updateField('education', [newItem, ...data.education]);
  };

  const updateEducation = (id: string, field: keyof EducationItem, val: string) => {
    const updated = data.education.map((item) =>
      item.id === id ? { ...item, [field]: val } : item
    );
    updateField('education', updated);
  };

  const removeEducation = (id: string) => {
    updateField('education', data.education.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4 text-sm font-sans-title">
      {/* 1. Personal & Contact Information */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('personal')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{t('personal_info')}</span>
            {openSections.personal ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.personal && (
          <div className="p-4 space-y-4">
            {/* Photo Upload & Crop */}
            <ImageUploadCrop
              label={t('profile_photo')}
              shape="circle"
              currentImage={data.photoUrl}
              onImageChange={(val) => updateField('photoUrl', val)}
              lang={lang}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('full_name')} *
                </label>
                <input
                  type="text"
                  value={data.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-900 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('cv_ph_full_name')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('job_title')} *
                </label>
                <input
                  type="text"
                  value={data.professionalTitle}
                  onChange={(e) => updateField('professionalTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-900 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('cv_ph_job_title')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('email_address')}
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-900 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('phone_number')}
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-900 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('cv_ph_phone')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('location_city')}
                </label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-900 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('cv_ph_location')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('website_portfolio')}
                </label>
                <input
                  type="text"
                  value={data.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-900 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('cv_ph_website')}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Professional Profile Summary */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('summary')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{t('profile_summary')}</span>
            {openSections.summary ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.summary && (
          <div className="p-4">
            <textarea
              rows={4}
              value={data.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-900 bg-zinc-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed transition-colors"
              placeholder={t('cv_ph_summary')}
            />
          </div>
        )}
      </div>

      {/* 3. Work Experience */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('experience')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              {t('work_experience')} ({data.experience.length})
            </span>
            {openSections.experience ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              addExperience();
              setOpenSections((p) => ({ ...p, experience: true }));
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>{t('add_position')}</span>
          </button>
        </div>

        {openSections.experience && (
          <div className="p-4 space-y-3.5">
            {data.experience.map((exp, index) => (
              <div
                key={exp.id}
                className="p-3.5 bg-zinc-50/70 border border-zinc-200 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-700">
                    {t('position_no')} #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="text-zinc-400 hover:text-rose-600 transition-colors p-1 rounded"
                    title={t('remove_position')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('role_position')}
                    </label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('cv_ph_role')}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('company_org')}
                    </label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('cv_ph_company')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('employment_period')}
                    </label>
                    <CalendarPeriodPicker
                      value={exp.period}
                      onChange={(val) => updateExperience(exp.id, 'period', val)}
                      lang={lang}
                      allowPresent
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('location_city')}
                    </label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('cv_ph_location')}
                    />
                  </div>
                </div>

                {/* Highlights / Responsibilities */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-zinc-600">
                      {t('key_highlights')}
                    </label>
                    <button
                      type="button"
                      onClick={() => addHighlight(exp.id)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t('add_bullet')}</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {exp.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => updateHighlight(exp.id, hIdx, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          placeholder={t('cv_ph_highlight')}
                        />
                        <button
                          type="button"
                          onClick={() => removeHighlight(exp.id, hIdx)}
                          className="text-zinc-400 hover:text-rose-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Education Credentials */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('education')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              {t('education')} ({data.education.length})
            </span>
            {openSections.education ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              addEducation();
              setOpenSections((p) => ({ ...p, education: true }));
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>{t('add_degree')}</span>
          </button>
        </div>

        {openSections.education && (
          <div className="p-4 space-y-3.5">
            {data.education.map((edu, index) => (
              <div
                key={edu.id}
                className="p-3.5 bg-zinc-50/70 border border-zinc-200 rounded-xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-700">
                    {t('education_no')} #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="text-zinc-400 hover:text-rose-600 p-1 rounded"
                    title={t('remove_education')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('degree_diploma')}
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('cv_ph_degree')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('institution_school')}
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('cv_ph_institution')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('grad_year')}
                    </label>
                    <CalendarPeriodPicker
                      value={edu.year}
                      onChange={(val) => updateEducation(edu.id, 'year', val)}
                      lang={lang}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('honors_details')}
                    </label>
                    <input
                      type="text"
                      value={edu.details}
                      onChange={(e) => updateEducation(edu.id, 'details', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('cv_ph_details')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Skills & Languages */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('skills')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              {t('key_competencies')} & {t('languages')}
            </span>
            {openSections.skills ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.skills && (
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('key_competencies')} {t('comma_separated')}
              </label>
              <input
                type="text"
                value={skillsDraft}
                onChange={(e) => {
                  const raw = e.target.value;
                  setSkillsDraft(raw);
                  updateField(
                    'skills',
                    raw.split(',').map((s) => s.trim()).filter(Boolean)
                  );
                }}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('cv_ph_skills')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('languages')} {t('comma_separated')}
              </label>
              <input
                type="text"
                value={languagesDraft}
                onChange={(e) => {
                  const raw = e.target.value;
                  setLanguagesDraft(raw);
                  updateField(
                    'languages',
                    raw.split(',').map((s) => s.trim()).filter(Boolean)
                  );
                }}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('cv_ph_languages')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

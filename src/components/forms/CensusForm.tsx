import React, { useState } from 'react';
import { CensusData, HouseholdMember, LanguageCode } from '../../types/document';
import { Plus, Trash2, Users, Home, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { CalendarDatePicker } from '../CalendarDatePicker';
import { getTranslation } from '../../utils/i18n';

interface CensusFormProps {
  data: CensusData;
  onChange: (updated: CensusData) => void;
  lang?: LanguageCode;
}

export const CensusForm: React.FC<CensusFormProps> = ({ data, onChange, lang = 'en' }) => {
  const t = (k: string) => getTranslation(lang, k);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    admin: true,
    dwelling: true,
    members: true,
    notes: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = <K extends keyof CensusData>(field: K, value: CensusData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const addMember = () => {
    const newMember: HouseholdMember = {
      id: `mem-${Date.now()}`,
      fullName: '',
      relationship: '',
      age: '',
      gender: '',
      educationLevel: '',
      occupation: '',
    };
    updateField('householdMembers', [...data.householdMembers, newMember]);
  };

  const updateMember = (id: string, field: keyof HouseholdMember, val: any) => {
    const updated = data.householdMembers.map((m) =>
      m.id === id ? { ...m, [field]: val } : m
    );
    updateField('householdMembers', updated);
  };

  const removeMember = (id: string) => {
    updateField(
      'householdMembers',
      data.householdMembers.filter((m) => m.id !== id)
    );
  };

  return (
    <div className="space-y-4 text-sm font-sans-title">
      {/* 1. Administrative Census Codes */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('admin')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{t('census_registry')}</span>
            {openSections.admin ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.admin && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('census_code')} *
              </label>
              <input
                type="text"
                value={data.censusCode}
                onChange={(e) => updateField('censusCode', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_code')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('survey_date')}
              </label>
              <CalendarDatePicker
                value={data.surveyDate}
                onChange={(val) => updateField('surveyDate', val)}
                lang={lang}
                outputFormat="iso"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('district_region')}
              </label>
              <input
                type="text"
                value={data.districtRegion}
                onChange={(e) => updateField('districtRegion', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_district')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('enum_area')}
              </label>
              <input
                type="text"
                value={data.enumerationArea}
                onChange={(e) => updateField('enumerationArea', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_area')}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Dwelling & Head of Household */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('dwelling')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{t('census_dwelling_section')}</span>
            {openSections.dwelling ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.dwelling && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('head_household')} *
              </label>
              <input
                type="text"
                value={data.headOfHousehold}
                onChange={(e) => updateField('headOfHousehold', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_head')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('residential_address')} *
              </label>
              <input
                type="text"
                value={data.residentialAddress}
                onChange={(e) => updateField('residentialAddress', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_address')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('dwelling_type')}
              </label>
              <input
                type="text"
                value={data.dwellingType}
                onChange={(e) => updateField('dwellingType', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_dwelling')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('tenure_status')}
              </label>
              <input
                type="text"
                value={data.tenureStatus}
                onChange={(e) => updateField('tenureStatus', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_tenure')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('total_rooms')}
              </label>
              <input
                type="number"
                min="1"
                value={data.totalRooms}
                onChange={(e) =>
                  updateField('totalRooms', e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('water_source')}
              </label>
              <input
                type="text"
                value={data.primaryWaterSource}
                onChange={(e) => updateField('primaryWaterSource', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_water')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('electricity_access')}
              </label>
              <input
                type="text"
                value={data.electricityAccess}
                onChange={(e) => updateField('electricityAccess', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_electricity')}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Household Resident Roster */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('members')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              {t('resident_roster')} ({data.householdMembers.length})
            </span>
            {openSections.members ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              addMember();
              setOpenSections((p) => ({ ...p, members: true }));
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>{t('add_member')}</span>
          </button>
        </div>

        {openSections.members && (
          <div className="p-4 space-y-3">
            {data.householdMembers.map((member, index) => (
              <div
                key={member.id}
                className="p-3.5 bg-zinc-50/70 border border-zinc-200 rounded-xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700">
                    {t('occupant_label')} #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="text-zinc-400 hover:text-rose-600 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('full_name')}
                    </label>
                    <input
                      type="text"
                      value={member.fullName}
                      onChange={(e) => updateMember(member.id, 'fullName', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('census_ph_resident_name')}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('relationship_to_head')}
                    </label>
                    <input
                      type="text"
                      value={member.relationship}
                      onChange={(e) => updateMember(member.id, 'relationship', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('census_ph_relationship')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">{t('age_label')}</label>
                      <input
                        type="number"
                        min="0"
                        max="125"
                        value={member.age}
                        onChange={(e) =>
                          updateMember(
                            member.id,
                            'age',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">{t('gender_label')}</label>
                      <input
                        type="text"
                        value={member.gender}
                        onChange={(e) => updateMember(member.id, 'gender', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder={t('gender_label')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">{t('education_col')}</label>
                    <input
                      type="text"
                      value={member.educationLevel}
                      onChange={(e) => updateMember(member.id, 'educationLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('census_ph_education')}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">{t('occupation_label')}</label>
                    <input
                      type="text"
                      value={member.occupation}
                      onChange={(e) => updateMember(member.id, 'occupation', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={t('occupation_label')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Field Observations & Signatures */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('notes')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{t('census_certification_section')}</span>
            {openSections.notes ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.notes && (
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('field_notes')}
              </label>
              <textarea
                rows={2}
                value={data.officialNotes}
                onChange={(e) => updateField('officialNotes', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('census_ph_notes')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('enumerator_name')}
                </label>
                <input
                  type="text"
                  value={data.enumeratorName}
                  onChange={(e) => updateField('enumeratorName', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('census_ph_enumerator')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('supervisor_sig')}
                </label>
                <input
                  type="text"
                  value={data.supervisorSignatureRef}
                  onChange={(e) => updateField('supervisorSignatureRef', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('census_ph_supervisor')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

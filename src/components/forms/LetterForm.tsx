import React, { useState } from 'react';
import { LetterData, LanguageCode } from '../../types/document';
import { ChevronDown, ChevronUp, Mail, User, FileText, CheckSquare } from 'lucide-react';
import { ImageUploadCrop } from '../ImageUploadCrop';
import { CalendarDatePicker } from '../CalendarDatePicker';
import { getTranslation } from '../../utils/i18n';

interface LetterFormProps {
  data: LetterData;
  onChange: (updated: LetterData) => void;
  lang?: LanguageCode;
}

export const LetterForm: React.FC<LetterFormProps> = ({ data, onChange, lang = 'en' }) => {
  const t = (k: string) => getTranslation(lang, k);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sender: true,
    recipient: true,
    body: true,
    signoff: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = <K extends keyof LetterData>(field: K, value: LetterData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4 text-sm font-sans-title">
      {/* 1. Sender Letterhead */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('sender')}
          className="w-full px-4 py-2.5 bg-zinc-50/70 hover:bg-zinc-100/80 border-b border-zinc-200 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('sender_letterhead')}</span>
          </div>
          {openSections.sender ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {openSections.sender && (
          <div className="p-4 space-y-4">
            <ImageUploadCrop
              label={t('company_logo')}
              shape="square"
              mode="logo"
              currentImage={data.logoUrl}
              onImageChange={(val) => updateField('logoUrl', val)}
              lang={lang}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('sender_name')} *
                </label>
                <input
                  type="text"
                  value={data.senderName}
                  onChange={(e) => updateField('senderName', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('letter_ph_sender_name')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('sender_title')}
                </label>
                <input
                  type="text"
                  value={data.senderTitle}
                  onChange={(e) => updateField('senderTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('letter_ph_sender_title')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('sender_company')}
                </label>
                <input
                  type="text"
                  value={data.senderCompany}
                  onChange={(e) => updateField('senderCompany', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('letter_ph_sender_company')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('phone_number')}
                </label>
                <input
                  type="tel"
                  value={data.senderPhone}
                  onChange={(e) => updateField('senderPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('cv_ph_phone')}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('sender_address')}
                </label>
                <input
                  type="text"
                  value={data.senderAddress}
                  onChange={(e) => updateField('senderAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder={t('letter_ph_sender_address')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('email_address')}
                </label>
                <input
                  type="email"
                  value={data.senderEmail}
                  onChange={(e) => updateField('senderEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('issue_date')}
                </label>
                <CalendarDatePicker
                  value={data.date}
                  onChange={(val) => updateField('date', val)}
                  lang={lang}
                  outputFormat="long"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Recipient Information */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('recipient')}
          className="w-full px-4 py-2.5 bg-zinc-50/70 hover:bg-zinc-100/80 border-b border-zinc-200 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('recipient_details')}</span>
          </div>
          {openSections.recipient ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {openSections.recipient && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('recipient_name')} *
              </label>
              <input
                type="text"
                value={data.recipientName}
                onChange={(e) => updateField('recipientName', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_recipient_name')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('recipient_title')}
              </label>
              <input
                type="text"
                value={data.recipientTitle}
                onChange={(e) => updateField('recipientTitle', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_recipient_title')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('recipient_company')}
              </label>
              <input
                type="text"
                value={data.recipientCompany}
                onChange={(e) => updateField('recipientCompany', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_recipient_company')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('recipient_address')}
              </label>
              <input
                type="text"
                value={data.recipientAddress}
                onChange={(e) => updateField('recipientAddress', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_recipient_address')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('formal_subject')}
              </label>
              <input
                type="text"
                value={data.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold transition-colors"
                placeholder={t('letter_ph_subject')}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Letter Body Paragraphs */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('body')}
          className="w-full px-4 py-2.5 bg-zinc-50/70 hover:bg-zinc-100/80 border-b border-zinc-200 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('letter_body_section')}</span>
          </div>
          {openSections.body ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {openSections.body && (
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('salutation_greeting')}
              </label>
              <input
                type="text"
                value={data.salutation}
                onChange={(e) => updateField('salutation', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_salutation')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('opening_paragraph')}
              </label>
              <textarea
                rows={2}
                value={data.openingParagraph}
                onChange={(e) => updateField('openingParagraph', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_opening')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('body_paragraph_1')}
              </label>
              <textarea
                rows={3}
                value={data.bodyParagraphOne}
                onChange={(e) => updateField('bodyParagraphOne', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_body')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('closing_paragraph')}
              </label>
              <textarea
                rows={2}
                value={data.closingParagraph}
                onChange={(e) => updateField('closingParagraph', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_closing')}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Signoff & Enclosure */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('signoff')}
          className="w-full px-4 py-2.5 bg-zinc-50/70 hover:bg-zinc-100/80 border-b border-zinc-200 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('letter_signoff_section')}</span>
          </div>
          {openSections.signoff ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {openSections.signoff && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('formal_signoff')}
              </label>
              <input
                type="text"
                value={data.signoff}
                onChange={(e) => updateField('signoff', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_signoff')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('enclosure_notice')}
              </label>
              <input
                type="text"
                value={data.enclosureNotice}
                onChange={(e) => updateField('enclosureNotice', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder={t('letter_ph_enclosure')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

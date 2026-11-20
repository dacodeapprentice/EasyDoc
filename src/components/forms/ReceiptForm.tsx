import React, { useState } from 'react';
import { ReceiptData, ReceiptItem, LanguageCode } from '../../types/document';
import { Plus, Trash2, ChevronDown, ChevronUp, FileText, UserCheck, Calculator, Receipt } from 'lucide-react';
import { ImageUploadCrop } from '../ImageUploadCrop';
import { getTranslation } from '../../utils/i18n';

interface ReceiptFormProps {
  data: ReceiptData;
  onChange: (updated: ReceiptData) => void;
  lang?: LanguageCode;
}

export const ReceiptForm: React.FC<ReceiptFormProps> = ({ data, onChange, lang = 'en' }) => {
  const t = (k: string) => getTranslation(lang, k);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    header: true,
    customer: true,
    items: true,
    financials: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = <K extends keyof ReceiptData>(field: K, value: ReceiptData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const safeNum = (v: any, fallback = 0) => {
    const n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: '',
      unitPrice: '',
      total: 0,
    };
    updateField('items', [...data.items, newItem]);
  };

  const updateItem = (id: string, field: keyof ReceiptItem, val: any) => {
    const updated = data.items.map((item) => {
      if (item.id === id) {
        const next = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const q = safeNum(next.quantity);
          const p = safeNum(next.unitPrice);
          next.total = Number((q * p).toFixed(2));
        }
        return next;
      }
      return item;
    });
    updateField('items', updated);
  };

  const removeItem = (id: string) => {
    updateField(
      'items',
      data.items.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="space-y-4 text-sm font-sans-title">
      {/* 1. Business & Receipt Details */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('header')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{t('commercial_receipt')}</span>
            {openSections.header ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.header && (
          <div className="p-4 space-y-4">
            {/* Business Logo Upload */}
            <ImageUploadCrop
              label={t('business_logo')}
              shape="square"
              currentImage={data.logoUrl}
              onImageChange={(val) => updateField('logoUrl', val)}
              lang={lang}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('business_name')} *
                </label>
                <input
                  type="text"
                  value={data.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="Business or organization name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('business_tax_id')}
                </label>
                <input
                  type="text"
                  value={data.businessTaxId}
                  onChange={(e) => updateField('businessTaxId', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="Tax ID / Registration"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('business_address')}
                </label>
                <input
                  type="text"
                  value={data.businessAddress}
                  onChange={(e) => updateField('businessAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="Business address here"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('business_email')}
                </label>
                <input
                  type="email"
                  value={data.businessEmail}
                  onChange={(e) => updateField('businessEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="billing@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('receipt_no')} *
                </label>
                <input
                  type="text"
                  value={data.receiptNumber}
                  onChange={(e) => updateField('receiptNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="Receipt number here"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('issue_date')}
                </label>
                <input
                  type="date"
                  value={data.issueDate}
                  onChange={(e) => updateField('issueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('payment_method')}
                </label>
                <input
                  type="text"
                  value={data.paymentMethod}
                  onChange={(e) => updateField('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="Payment method here"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('transaction_ref')}
                </label>
                <input
                  type="text"
                  value={data.transactionRef}
                  onChange={(e) => updateField('transactionRef', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="Transaction reference"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Customer Information */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('customer')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{t('billed_to')}</span>
            {openSections.customer ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.customer && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('customer_name')} *
              </label>
              <input
                type="text"
                value={data.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder="Customer name here"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('customer_company')}
              </label>
              <input
                type="text"
                value={data.customerCompany}
                onChange={(e) => updateField('customerCompany', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder="Customer organization"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('customer_email')}
              </label>
              <input
                type="email"
                value={data.customerEmail}
                onChange={(e) => updateField('customerEmail', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('customer_address')}
              </label>
              <input
                type="text"
                value={data.customerAddress}
                onChange={(e) => updateField('customerAddress', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder="Customer address here"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Itemized Products & Services */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('items')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              {t('item_description')} ({data.items.length})
            </span>
            {openSections.items ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              addItem();
              setOpenSections((p) => ({ ...p, items: true }));
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>{t('add_item')}</span>
          </button>
        </div>

        {openSections.items && (
          <div className="p-4 space-y-3">
            {data.items.map((item, index) => {
              const qty = safeNum(item.quantity);
              const price = safeNum(item.unitPrice);
              const total = (qty * price).toFixed(2);

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-zinc-50/70 border border-zinc-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700">
                      Item #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-zinc-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      {t('item_description')}
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Item or service description here"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        {t('quantity')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        {t('unit_price')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, 'unitPrice', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        {t('line_total')}
                      </label>
                      <div className="px-2.5 py-1.5 text-xs font-mono-tabular tabular-nums font-semibold text-zinc-800 bg-zinc-100 rounded-lg border border-zinc-200">
                        ${total}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Financial Calculations, Tax & Signatory */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <div className="w-full px-4 py-2.5 bg-zinc-50/70 flex items-center justify-between border-b border-zinc-200">
          <button
            type="button"
            onClick={() => toggleSection('financials')}
            className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-zinc-800 hover:text-zinc-950 transition-colors text-left"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Tax, Discount & Accounting Signatory</span>
            {openSections.financials ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 ml-1" />
            )}
          </button>
        </div>

        {openSections.financials && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('tax_rate')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={data.taxRatePercent}
                  onChange={(e) =>
                    updateField(
                      'taxRatePercent',
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('discount_amount')}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={data.discountAmount}
                  onChange={(e) =>
                    updateField(
                      'discountAmount',
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t('authorized_signatory')}
                </label>
                <input
                  type="text"
                  value={data.cashierOrAgent}
                  onChange={(e) => updateField('cashierOrAgent', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  placeholder="Authorized signatory name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t('notes_terms')}
              </label>
              <textarea
                rows={2}
                value={data.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60 focus:bg-white text-zinc-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                placeholder="Add payment terms, notes, or conditions here..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

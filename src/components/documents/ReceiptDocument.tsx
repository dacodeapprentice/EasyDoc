import React from 'react';
import {
  ReceiptData,
  DocumentAssetBundle,
  DocumentStyle,
  ColorTheme,
  LanguageCode,
} from '../../types/document';
import { Receipt, CheckCircle2 } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { resolveDocumentAssets } from '../../assets/documentAssets';
import {
  DocumentFooterBand,
  DocumentHeaderBand,
  DocumentInfoCard,
  DocumentLogo,
  DocumentNotesBox,
  DocumentSheet,
  DocumentStatusBadge,
  PlaceholderText,
  hasText,
} from './TemplatePrimitives';

interface ReceiptDocumentProps {
  data: ReceiptData;
  style: DocumentStyle;
  theme?: ColorTheme;
  assets?: DocumentAssetBundle;
  lang?: LanguageCode;
}

export const ReceiptDocument: React.FC<ReceiptDocumentProps> = ({
  data,
  style,
  assets,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const mounted = assets || resolveDocumentAssets(style);
  const { theme, layout } = mounted;
  const { isCompact, isLarge } = layout;

  const safeNum = (v: any, fallback = 0) => {
    const n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  };

  const subtotal = data.items.reduce(
    (sum, item) => sum + safeNum(item.quantity) * safeNum(item.unitPrice),
    0
  );
  const taxRate = safeNum(data.taxRatePercent);
  const taxAmount = (subtotal * taxRate) / 100;
  const discountAmount = safeNum(data.discountAmount);
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      lang === 'pt' ? 'pt-PT' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US',
      {
        style: 'currency',
        currency: lang === 'pt' || lang === 'es' || lang === 'fr' ? 'EUR' : 'USD',
      }
    ).format(amount);
  };

  const hasBusinessDetails =
    hasText(data.businessName) ||
    hasText(data.businessTaxId) ||
    hasText(data.businessAddress) ||
    hasText(data.businessEmail);

  const hasCustomerDetails =
    hasText(data.customerName) ||
    hasText(data.customerCompany) ||
    hasText(data.customerEmail) ||
    hasText(data.customerAddress);

  return (
    <DocumentSheet assets={mounted}>
      {/* Receipt Voucher Header Structure */}
      <DocumentHeaderBand
        assets={mounted}
        left={
          <div className="flex items-start gap-3.5">
            {data.logoUrl && (
              <DocumentLogo src={data.logoUrl} alt="Business Logo" assets={mounted} />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 rounded bg-slate-100 text-slate-800">
                  <Receipt
                    className={isCompact ? 'w-4 h-4' : 'w-5 h-5'}
                    style={{ color: theme.primary }}
                  />
                </span>
                <span className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-widest text-slate-500`}>
                  {t('official_voucher')}
                </span>
              </div>
              <h1
                className={`font-sans-title ${
                  isCompact ? 'text-lg' : isLarge ? 'text-3xl' : 'text-2xl'
                } font-extrabold tracking-tight`}
                style={hasText(data.businessName) ? { color: theme.textHeader } : undefined}
              >
                <PlaceholderText value={data.businessName} placeholder="Business or Issuer Name" />
              </h1>
              {(!hasBusinessDetails || hasText(data.businessTaxId)) && (
                <p className={`font-mono-tabular ${layout.metaSizeClass} text-slate-500 mt-1`}>
                  <PlaceholderText value={data.businessTaxId} placeholder="Tax ID / Registration" />
                </p>
              )}
              {(!hasBusinessDetails || hasText(data.businessAddress)) && (
                <p className={`font-sans-title ${layout.metaSizeClass} text-slate-600 mt-0.5`}>
                  <PlaceholderText value={data.businessAddress} placeholder="Business address here" />
                </p>
              )}
              {(!hasBusinessDetails || hasText(data.businessEmail)) && (
                <p className={`font-sans-title ${layout.metaSizeClass} text-slate-500 mt-0.5`}>
                  <PlaceholderText value={data.businessEmail} placeholder="billing@example.com" />
                </p>
              )}
            </div>
          </div>
        }
        right={
          <div>
            <DocumentStatusBadge
              assets={mounted}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              label={t('payment_received')}
              className="tracking-wide mb-2"
            />
            <div className={`${layout.metaSizeClass} text-slate-500 font-sans-title`}>
              {t('receipt_no')}:{' '}
              <strong className="font-mono-tabular font-bold text-slate-800">
                <PlaceholderText value={data.receiptNumber} placeholder="RCP-0000" />
              </strong>
            </div>
            <div className={`${layout.metaSizeClass} text-slate-500 font-sans-title mt-0.5`}>
              {t('issue_date')}: <PlaceholderText value={data.issueDate} placeholder="YYYY-MM-DD" />
            </div>
            {(!hasText(data.receiptNumber) || hasText(data.paymentMethod)) && (
              <div className={`${layout.metaSizeClass} text-slate-500 font-sans-title mt-0.5`}>
                {t('payment_method')}: <PlaceholderText value={data.paymentMethod} placeholder="Payment method" />
              </div>
            )}
            {hasText(data.transactionRef) && (
              <div className={`${layout.smallSizeClass} font-mono-tabular text-slate-400 mt-0.5`}>
                Ref: {data.transactionRef}
              </div>
            )}
          </div>
        }
      />

      {/* Bill To Customer Information */}
      <DocumentInfoCard assets={mounted} title={t('billed_to')}>
        <div
          className={`grid ${
            isCompact ? 'grid-cols-1 gap-1.5' : 'grid-cols-2 gap-3'
          } ${layout.metaSizeClass}`}
        >
          <div>
            <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
              <PlaceholderText value={data.customerName} placeholder="Customer Name Here" />
            </div>
            {(!hasCustomerDetails || hasText(data.customerCompany)) && (
              <div className="text-slate-700 font-medium">
                <PlaceholderText value={data.customerCompany} placeholder="Customer Organization" />
              </div>
            )}
          </div>
          <div className={`text-slate-600 ${isCompact ? 'text-left' : 'text-right'}`}>
            {(!hasCustomerDetails || hasText(data.customerEmail)) && (
              <div>
                <PlaceholderText value={data.customerEmail} placeholder="customer@example.com" />
              </div>
            )}
            {(!hasCustomerDetails || hasText(data.customerAddress)) && (
              <div>
                <PlaceholderText value={data.customerAddress} placeholder="Customer address here" />
              </div>
            )}
          </div>
        </div>
      </DocumentInfoCard>

      {/* Line Items Table */}
      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        <table className={`w-full text-left border-collapse ${layout.tableTextClass}`}>
          <thead>
            <tr className="border-b-2 border-slate-300 font-sans-title text-slate-700 font-bold bg-slate-50/80">
              <th className={layout.tableHeaderPaddingClass}>{t('item_description')}</th>
              <th className={`${isCompact ? 'py-2 px-1.5 w-10' : 'py-2.5 px-3 w-16'} text-center`}>
                {t('quantity')}
              </th>
              <th
                className={`${
                  isCompact ? 'py-2 px-2 w-20' : isLarge ? 'py-2.5 px-3 w-36' : 'py-2.5 px-3 w-28'
                } text-right`}
              >
                {t('unit_price')}
              </th>
              <th
                className={`${
                  isCompact ? 'py-2 px-2 w-20' : isLarge ? 'py-2.5 px-3 w-36' : 'py-2.5 px-3 w-28'
                } text-right`}
              >
                {t('line_total')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.items.map((item, idx) => {
              const qty = safeNum(item.quantity);
              const price = safeNum(item.unitPrice);
              const lineTot = qty * price;
              return (
                <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className={layout.tableCellPaddingClass}>
                    <span className="font-semibold text-slate-900 block">
                      <PlaceholderText
                        value={item.description}
                        placeholder="Item or service description here"
                      />
                    </span>
                  </td>
                  <td className={`${layout.tableCellPaddingClass} text-center font-mono-tabular text-slate-600`}>
                    {qty}
                  </td>
                  <td className={`${layout.tableCellPaddingClass} text-right font-mono-tabular text-slate-600`}>
                    {formatCurrency(price)}
                  </td>
                  <td className={`${layout.tableCellPaddingClass} text-right font-mono-tabular font-bold text-slate-900`}>
                    {formatCurrency(lineTot)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Financial Totals Breakdown */}
      <section className={`flex justify-end ${layout.headerMbClass} print-avoid-break`}>
        <div
          className={`${
            isCompact ? 'w-56' : isLarge ? 'w-96' : 'w-72'
          } font-sans-title ${layout.metaSizeClass} space-y-2`}
        >
          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
            <span>{t('subtotal')}:</span>
            <span className="font-mono-tabular font-semibold text-slate-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {taxRate > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>
                {t('tax_vat')} ({taxRate}%):
              </span>
              <span className="font-mono-tabular font-semibold text-slate-900">
                {formatCurrency(taxAmount)}
              </span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
              <span>{t('discount')}:</span>
              <span className="font-mono-tabular font-semibold">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          <div
            className={`flex justify-between pt-2 pb-1 border-t-2 ${
              isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'
            } font-extrabold`}
            style={{
              borderColor: theme.primary,
              color: theme.primaryDark,
            }}
          >
            <span>{t('total_paid')}:</span>
            <span className="font-mono-tabular">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </section>

      {/* Additional Terms & Notes */}
      {(hasText(data.notes) || !hasBusinessDetails) && (
        <DocumentNotesBox
          assets={mounted}
          label={t('notes_terms')}
          text={data.notes}
          placeholder="Add payment terms, notes, or warranty details here."
        />
      )}

      {/* Signatory & Security Footer */}
      <DocumentFooterBand
        assets={mounted}
        left={
          <div>
            {(!hasBusinessDetails || hasText(data.cashierOrAgent)) && (
              <div>
                {t('authorized_signatory')}:{' '}
                <strong className="text-slate-800">
                  <PlaceholderText value={data.cashierOrAgent} placeholder="Signatory Name Here" />
                </strong>
              </div>
            )}
            <div className={`${layout.smallSizeClass} text-slate-400 mt-0.5`}>
              {t('electronic_record')}
            </div>
          </div>
        }
        right={
          <div className={`${layout.smallSizeClass} text-slate-400`}>
            <div>{t('verified')}</div>
            <div className="font-mono-tabular">
              AUTH-ID: <PlaceholderText value={data.receiptNumber} placeholder="000" />
            </div>
          </div>
        }
      />
    </DocumentSheet>
  );
};

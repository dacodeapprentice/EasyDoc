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
  const { theme, layout, design } = mounted;
  const { isCompact, isUltraNarrow, isLarge } = layout;

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

  const renderCustomerFields = (alignRight = false) => (
    <div className={alignRight ? 'text-right' : 'text-left'}>
      <div className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
        <PlaceholderText value={data.customerName} placeholder="Customer Name Here" />
      </div>
      {(!hasCustomerDetails || hasText(data.customerCompany)) && (
        <div className={`text-slate-700 font-medium ${layout.metaSizeClass}`}>
          <PlaceholderText value={data.customerCompany} placeholder="Customer Organization" />
        </div>
      )}
      {(!hasCustomerDetails || hasText(data.customerEmail)) && (
        <div className={`text-slate-600 break-all ${layout.metaSizeClass} mt-0.5`}>
          <PlaceholderText value={data.customerEmail} placeholder="customer@example.com" />
        </div>
      )}
      {(!hasCustomerDetails || hasText(data.customerAddress)) && (
        <div className={`text-slate-600 ${layout.metaSizeClass}`}>
          <PlaceholderText value={data.customerAddress} placeholder="Customer address here" />
        </div>
      )}
    </div>
  );

  const renderLedgerTable = (tintedHeader = false, narrow = false) => (
    <table className={`w-full text-left border-collapse ${layout.tableTextClass} ${isUltraNarrow || narrow ? 'table-fixed' : ''}`}>
      <thead>
        <tr
          className="border-b-2 font-sans-title text-slate-700 font-bold"
          style={{
            backgroundColor: tintedHeader ? theme.primaryLight : '#f8fafc',
            borderColor: design.id === 'swiss-grid' ? theme.textHeader : '#cbd5e1',
          }}
        >
          <th className={layout.tableHeaderPaddingClass}>{t('item_description')}</th>
          <th className={`${isUltraNarrow || narrow ? 'py-1.5 px-1 w-9' : isCompact ? 'py-2 px-1.5 w-10' : 'py-2.5 px-3 w-16'} text-center`}>
            {t('quantity')}
          </th>
          <th
            className={`${
              isUltraNarrow || narrow ? 'py-1.5 px-1 w-16' : isCompact ? 'py-2 px-2 w-20' : isLarge ? 'py-2.5 px-3 w-36' : 'py-2.5 px-3 w-28'
            } text-right`}
          >
            {t('unit_price')}
          </th>
          <th
            className={`${
              isUltraNarrow || narrow ? 'py-1.5 px-1 w-16' : isCompact ? 'py-2 px-2 w-20' : isLarge ? 'py-2.5 px-3 w-36' : 'py-2.5 px-3 w-28'
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
  );

  const renderTotalsBreakdown = (widthClass?: string) => (
    <div
      className={`${
        widthClass ?? (isUltraNarrow ? 'w-full' : isCompact ? 'w-56' : isLarge ? 'w-96' : 'w-72')
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
          borderColor: design.id === 'swiss-grid' ? theme.textHeader : theme.primary,
          color: design.id === 'swiss-grid' ? theme.textHeader : theme.primaryDark,
        }}
      >
        <span>{t('total_paid')}:</span>
        <span className="font-mono-tabular">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );

  // COMPOSITION 4: Summary Sidebar (Left voucher metadata & highlighted total + Right itemized ledger)
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
              {data.logoUrl && <DocumentLogo src={data.logoUrl} alt="Business Logo" assets={mounted} />}

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Receipt className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                  <span className={`font-sans-title ${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-500`}>
                    {t('official_voucher')}
                  </span>
                </div>
                <h1
                  className={`font-sans-title ${isLarge ? 'text-2xl' : 'text-lg'} font-extrabold tracking-tight`}
                  style={hasText(data.businessName) ? { color: theme.textHeader } : undefined}
                >
                  <PlaceholderText value={data.businessName} placeholder="Business or Issuer Name" />
                </h1>
                {(!hasBusinessDetails || hasText(data.businessTaxId)) && (
                  <p className={`font-mono-tabular ${layout.smallSizeClass} text-slate-500 mt-1`}>
                    <PlaceholderText value={data.businessTaxId} placeholder="Tax ID / Registration" />
                  </p>
                )}
                {(!hasBusinessDetails || hasText(data.businessAddress)) && (
                  <p className={`font-sans-title ${layout.smallSizeClass} text-slate-600 mt-1`}>
                    <PlaceholderText value={data.businessAddress} placeholder="Business address here" />
                  </p>
                )}
                {(!hasBusinessDetails || hasText(data.businessEmail)) && (
                  <p className={`font-sans-title ${layout.smallSizeClass} text-slate-500 mt-0.5 break-all`}>
                    <PlaceholderText value={data.businessEmail} placeholder="billing@example.com" />
                  </p>
                )}
              </div>

              <div className="pt-3 border-t space-y-2.5 font-sans-title" style={{ borderColor: `${theme.primary}25` }}>
                <DocumentStatusBadge
                  assets={mounted}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  label={t('payment_received')}
                  className="ml-0!"
                />
                <div>
                  <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('receipt_no')}</span>
                  <strong className={`font-mono-tabular ${layout.metaSizeClass} text-slate-900`}>
                    <PlaceholderText value={data.receiptNumber} placeholder="RCP-0000" />
                  </strong>
                </div>
                <div>
                  <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('issue_date')}</span>
                  <span className={`font-mono-tabular ${layout.metaSizeClass} text-slate-800`}>
                    <PlaceholderText value={data.issueDate} placeholder="YYYY-MM-DD" />
                  </span>
                </div>
                {(!hasText(data.receiptNumber) || hasText(data.paymentMethod)) && (
                  <div>
                    <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('payment_method')}</span>
                    <span className={`${layout.metaSizeClass} text-slate-800`}>
                      <PlaceholderText value={data.paymentMethod} placeholder="Payment method" />
                    </span>
                  </div>
                )}
                {hasText(data.transactionRef) && (
                  <div>
                    <span className={`${layout.smallSizeClass} text-slate-500 block`}>{t('transaction_ref')}</span>
                    <span className={`font-mono-tabular ${layout.smallSizeClass} text-slate-700`}>
                      {data.transactionRef}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Highlighted Total Paid Card in Sidebar */}
            <div
              className="p-3.5 rounded-lg text-white font-sans-title"
              style={{ backgroundColor: theme.primaryDark }}
            >
              <span className={`${layout.smallSizeClass} uppercase tracking-wider opacity-80 block`}>
                {t('total_paid')}
              </span>
              <div className={`font-mono-tabular font-extrabold ${isLarge ? 'text-2xl' : 'text-xl'} mt-1`}>
                {formatCurrency(grandTotal)}
              </div>
            </div>
          </aside>

          <div className="col-span-8 space-y-6" style={{ padding: `${pad}px` }}>
            <div className="pb-4 border-b border-slate-200">
              <span className={`${layout.smallSizeClass} font-sans-title font-bold uppercase tracking-wider text-slate-500 block mb-1.5`}>
                {t('billed_to')}
              </span>
              {renderCustomerFields(false)}
            </div>

            {renderLedgerTable(false, true)}

            <div className="flex justify-end">{renderTotalsBreakdown('w-64')}</div>

            {(hasText(data.notes) || !hasBusinessDetails) && (
              <DocumentNotesBox
                assets={mounted}
                label={t('notes_terms')}
                text={data.notes}
                placeholder="Add payment terms, notes, or warranty details here."
              />
            )}

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
                </div>
              }
              right={
                <span className={`${layout.smallSizeClass} font-mono-tabular text-slate-400`}>
                  AUTH-ID: <PlaceholderText value={data.receiptNumber} placeholder="000" />
                </span>
              }
            />
          </div>
        </div>
      </DocumentSheet>
    );
  }

  // COMPOSITION 5: Ledger Grid (Swiss architectural accounting sheet)
  if (design.id === 'swiss-grid' && !isCompact) {
    return (
      <DocumentSheet assets={mounted}>
        <header
          className={`border-b ${layout.isLarge ? 'pb-6 mb-6' : 'pb-4 mb-5'} flex items-end justify-between gap-6`}
          style={{ borderColor: theme.textHeader }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {data.logoUrl && <DocumentLogo src={data.logoUrl} alt="Business Logo" assets={mounted} />}
            <div>
              <span className={`font-sans-title ${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-500 block mb-1`}>
                {t('official_voucher')}
              </span>
              <h1
                className={`font-sans-title ${isLarge ? 'text-3xl' : 'text-2xl'} font-extrabold tracking-tight`}
                style={hasText(data.businessName) ? { color: theme.textHeader } : undefined}
              >
                <PlaceholderText value={data.businessName} placeholder="Business or Issuer Name" />
              </h1>
            </div>
          </div>
          <div className="text-right font-sans-title shrink-0">
            <span className={`${layout.smallSizeClass} uppercase tracking-widest text-slate-500 block`}>
              {t('total_paid')}
            </span>
            <div className={`font-mono-tabular font-extrabold ${isLarge ? 'text-3xl' : 'text-2xl'}`} style={{ color: theme.textHeader }}>
              {formatCurrency(grandTotal)}
            </div>
            <div className={`${layout.smallSizeClass} font-mono-tabular text-slate-500`}>
              #<PlaceholderText value={data.receiptNumber} placeholder="RCP-0000" />
            </div>
          </div>
        </header>

        {/* Three-column metadata grid */}
        <div
          className={`${layout.sectionMbClass} grid grid-cols-3 gap-4 pb-5 border-b border-slate-200 font-sans-title ${layout.metaSizeClass}`}
        >
          <div>
            <span className={`${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-500 block mb-1`}>
              From
            </span>
            <p className="font-mono-tabular text-slate-600">
              <PlaceholderText value={data.businessTaxId} placeholder="Tax ID / Registration" />
            </p>
            <p className="text-slate-700 mt-0.5">
              <PlaceholderText value={data.businessAddress} placeholder="Business address here" />
            </p>
            <p className="text-slate-500 break-all">
              <PlaceholderText value={data.businessEmail} placeholder="billing@example.com" />
            </p>
          </div>
          <div>
            <span className={`${layout.smallSizeClass} font-bold uppercase tracking-widest text-slate-500 block mb-1`}>
              {t('billed_to')}
            </span>
            {renderCustomerFields(false)}
          </div>
          <div className="text-right space-y-1">
            <DocumentStatusBadge
              assets={mounted}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              label={t('payment_received')}
            />
            <div className="text-slate-600 pt-1">
              {t('issue_date')}:{' '}
              <span className="font-mono-tabular font-semibold text-slate-800">
                <PlaceholderText value={data.issueDate} placeholder="YYYY-MM-DD" />
              </span>
            </div>
            <div className="text-slate-600">
              {t('payment_method')}: <PlaceholderText value={data.paymentMethod} placeholder="Payment method" />
            </div>
            {hasText(data.transactionRef) && (
              <div className={`${layout.smallSizeClass} font-mono-tabular text-slate-400`}>
                Ref: {data.transactionRef}
              </div>
            )}
          </div>
        </div>

        <section className={`${layout.sectionMbClass} print-avoid-break`}>
          {renderLedgerTable(false, false)}
        </section>

        <div className="grid grid-cols-12 gap-6 items-start pt-2">
          <div className="col-span-6 space-y-3">
            {(hasText(data.notes) || !hasBusinessDetails) && (
              <DocumentNotesBox
                assets={mounted}
                label={t('notes_terms')}
                text={data.notes}
                placeholder="Add payment terms, notes, or warranty details here."
              />
            )}
            <div className={`font-sans-title ${layout.metaSizeClass} text-slate-500`}>
              {t('authorized_signatory')}:{' '}
              <strong className="text-slate-900">
                <PlaceholderText value={data.cashierOrAgent} placeholder="Signatory Name Here" />
              </strong>
            </div>
          </div>
          <div className="col-span-6 flex justify-end">{renderTotalsBreakdown('w-full')}</div>
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
          <div className={`flex items-start gap-3.5 ${isEditorial ? 'justify-center' : ''}`}>
            {data.logoUrl && (
              <DocumentLogo src={data.logoUrl} alt="Business Logo" assets={mounted} />
            )}
            <div>
              <div className={`flex items-center gap-2 mb-1 ${isEditorial ? 'justify-center' : ''}`}>
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
                  isUltraNarrow ? 'text-base' : isCompact ? 'text-lg' : isLarge ? 'text-3xl' : 'text-2xl'
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
          isEditorial ? undefined : (
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
          )
        }
      />

      {/* Classic Voucher (Editorial): two-column ruled strip for Billed To & Receipt Meta */}
      {isEditorial ? (
        <section
          className={`${layout.sectionMbClass} grid ${
            isCompact ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'
          } pb-5 border-b border-slate-200 font-sans-title ${layout.metaSizeClass}`}
        >
          <div>
            <span className={`${layout.smallSizeClass} font-bold uppercase tracking-wider text-slate-500 block mb-1`}>
              {t('billed_to')}
            </span>
            {renderCustomerFields(false)}
          </div>
          <div className={isCompact ? 'text-left' : 'text-right'}>
            <DocumentStatusBadge
              assets={mounted}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              label={t('payment_received')}
              className="mb-1.5"
            />
            <div className="text-slate-600">
              {t('receipt_no')}:{' '}
              <strong className="font-mono-tabular text-slate-900">
                <PlaceholderText value={data.receiptNumber} placeholder="RCP-0000" />
              </strong>
            </div>
            <div className="text-slate-600 mt-0.5">
              {t('issue_date')}: <PlaceholderText value={data.issueDate} placeholder="YYYY-MM-DD" />
            </div>
            <div className="text-slate-600 mt-0.5">
              {t('payment_method')}: <PlaceholderText value={data.paymentMethod} placeholder="Payment method" />
            </div>
          </div>
        </section>
      ) : isBanner ? (
        /* Modern Banner: side-by-side Billed To + Highlighted Total Paid panel */
        <section
          className={`${layout.sectionMbClass} grid ${
            isCompact ? 'grid-cols-1 gap-3' : 'grid-cols-12 gap-4'
          } items-stretch print-avoid-break`}
        >
          <div
            className={`${isCompact ? '' : 'col-span-7'} p-3.5 rounded-md border border-slate-200 bg-slate-50 font-sans-title`}
          >
            <span className={`${layout.smallSizeClass} font-bold uppercase tracking-wider text-slate-500 block mb-1.5`}>
              {t('billed_to')}
            </span>
            {renderCustomerFields(false)}
          </div>
          <div
            className={`${isCompact ? '' : 'col-span-5'} p-3.5 rounded-md border flex flex-col justify-between font-sans-title`}
            style={{ backgroundColor: theme.primaryLight, borderColor: `${theme.primary}30` }}
          >
            <span className={`${layout.smallSizeClass} font-bold uppercase tracking-wider`} style={{ color: theme.primaryDark }}>
              {t('total_paid')}
            </span>
            <div className={`font-mono-tabular font-extrabold ${isCompact ? 'text-xl' : isLarge ? 'text-3xl' : 'text-2xl'} my-1`} style={{ color: theme.textHeader }}>
              {formatCurrency(grandTotal)}
            </div>
            <span className={`${layout.smallSizeClass} text-slate-600`}>
              {t('payment_method')}: <PlaceholderText value={data.paymentMethod} placeholder="Payment method" />
            </span>
          </div>
        </section>
      ) : (
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
                <div className="break-all">
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
      )}

      <section className={`${layout.sectionMbClass} print-avoid-break`}>
        {renderLedgerTable(isBanner, false)}
      </section>

      <section className={`flex justify-end ${layout.headerMbClass} print-avoid-break`}>
        {renderTotalsBreakdown()}
      </section>

      {(hasText(data.notes) || !hasBusinessDetails) && (
        <DocumentNotesBox
          assets={mounted}
          label={t('notes_terms')}
          text={data.notes}
          placeholder="Add payment terms, notes, or warranty details here."
        />
      )}

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

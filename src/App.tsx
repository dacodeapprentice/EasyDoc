/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import {
  DocumentType,
  DocumentStyle,
  LanguageCode,
  CvData,
  LetterData,
  CensusData,
  ReceiptData,
  CertificateData,
} from './types/document';
import {
  COLOR_THEMES,
  DEFAULT_STYLE,
  DEFAULT_CV,
  DEFAULT_LETTER,
  DEFAULT_CENSUS,
  DEFAULT_RECEIPT,
  DEFAULT_CERTIFICATE,
  getLocalizedCv,
  getLocalizedLetter,
  getLocalizedCensus,
  getLocalizedReceipt,
  getLocalizedCertificate,
} from './data/defaultData';
import { Navbar } from './components/Navbar';
import { DocumentSelector } from './components/DocumentSelector';
import { StyleCustomizer } from './components/StyleCustomizer';
import { CvForm } from './components/forms/CvForm';
import { LetterForm } from './components/forms/LetterForm';
import { CensusForm } from './components/forms/CensusForm';
import { ReceiptForm } from './components/forms/ReceiptForm';
import { CertificateForm } from './components/forms/CertificateForm';
import { CvDocument } from './components/documents/CvDocument';
import { LetterDocument } from './components/documents/LetterDocument';
import { CensusDocument } from './components/documents/CensusDocument';
import { ReceiptDocument } from './components/documents/ReceiptDocument';
import { CertificateDocument } from './components/documents/CertificateDocument';
import { exportToPdf, printDocument } from './utils/pdfExport';
import {
  saveProjectToFile,
  loadProjectFromFile,
  saveAutoSave,
  loadAutoSave,
  SavedProjectState,
} from './utils/storage';
import { getTranslation, LANGUAGES } from './utils/i18n';
import {
  FileText,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle,
  Eye,
  PenLine,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

type SidebarTab = 'inputs' | 'style' | 'templates';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackText?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class DocumentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Document render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-sm max-w-md mx-auto my-8">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-900 text-sm mb-1">Preview Render Issue</h3>
          <p className="text-xs text-zinc-500 mb-4">
            An unexpected error occurred while rendering the document preview.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}
            className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Example</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Document Selection & Styling State
  const [docType, setDocType] = useState<DocumentType>('cv');
  const [style, setStyle] = useState<DocumentStyle>(DEFAULT_STYLE);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('inputs');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [lang, setLang] = useState<LanguageCode>('en');

  // Document Data Stores
  const [cvData, setCvData] = useState<CvData>(DEFAULT_CV);
  const [letterData, setLetterData] = useState<LetterData>(DEFAULT_LETTER);
  const [censusData, setCensusData] = useState<CensusData>(DEFAULT_CENSUS);
  const [receiptData, setReceiptData] = useState<ReceiptData>(DEFAULT_RECEIPT);
  const [certificateData, setCertificateData] = useState<CertificateData>(DEFAULT_CERTIFICATE);

  // UI & Zoom Controls
  const [zoomLevel, setZoomLevel] = useState<number>(0.95);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoSavedTime, setAutoSavedTime] = useState<string | null>(null);

  const documentWrapperRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => getTranslation(lang, key);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // 1. Initial Load: Restore from localStorage if present
  useEffect(() => {
    const saved = loadAutoSave();
    if (saved) {
      try {
        if (saved.currentType) setDocType(saved.currentType);
        if (saved.style) setStyle(saved.style);
        if (saved.lang) setLang(saved.lang);
        if (saved.cvData) setCvData(saved.cvData);
        if (saved.letterData) setLetterData(saved.letterData);
        if (saved.censusData) setCensusData(saved.censusData);
        if (saved.receiptData) setReceiptData(saved.receiptData);
        if (saved.certificateData) setCertificateData(saved.certificateData);
        setAutoSavedTime('Restored');
      } catch (err) {
        console.warn('Could not restore autosave:', err);
      }
    }
  }, []);

  // 2. Debounced Automatic Persistence to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const payload: SavedProjectState = {
        version: '2.1',
        savedAt: new Date().toISOString(),
        currentType: docType,
        style,
        lang,
        cvData,
        letterData,
        censusData,
        receiptData,
        certificateData,
      };
      saveAutoSave(payload);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAutoSavedTime(timeStr);
    }, 500);

    return () => clearTimeout(timer);
  }, [docType, style, lang, cvData, letterData, censusData, receiptData, certificateData]);

  // 3. Dynamic Fit to Screen calculation
  const handleFitToScreen = useCallback(() => {
    if (!documentWrapperRef.current) return;
    const availableWidth = documentWrapperRef.current.clientWidth - 24;
    const fitScale = Math.min(1.15, Math.max(0.32, Number((availableWidth / 794).toFixed(2))));
    setZoomLevel(fitScale);
  }, []);

  // PDF Export
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    let filename = 'document.pdf';
    if (docType === 'cv') {
      filename = `CV_${cvData.fullName.replace(/\s+/g, '_') || 'Resume'}.pdf`;
    } else if (docType === 'letter') {
      filename = `Letter_${letterData.senderName.replace(/\s+/g, '_') || 'Presentation'}.pdf`;
    } else if (docType === 'census') {
      filename = `Census_${censusData.censusCode || 'Record'}.pdf`;
    } else if (docType === 'receipt') {
      filename = `Receipt_${receiptData.receiptNumber || 'Payment'}.pdf`;
    } else if (docType === 'certificate') {
      filename = `Certificate_${certificateData.recipientName.replace(/\s+/g, '_') || 'Award'}.pdf`;
    }

    try {
      const success = await exportToPdf('document-canvas', filename);
      if (success) {
        showToast(`Document downloaded: ${filename}`);
      } else {
        showToast('PDF generation failed. Please try "Print / Vector PDF" instead.');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF generation failed. Please try "Print / Vector PDF" instead.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    printDocument();
  };

  // Language switch handler: translates UI to guide users; does NOT alter entered content
  const handleLanguageChange = (newLang: LanguageCode) => {
    setLang(newLang);
    showToast(`Language: ${LANGUAGES[newLang].name}`);
  };

  // Reset to sample data in active language
  const handleResetData = () => {
    if (docType === 'cv') setCvData(getLocalizedCv(lang));
    if (docType === 'letter') setLetterData(getLocalizedLetter(lang));
    if (docType === 'census') setCensusData(getLocalizedCensus(lang));
    if (docType === 'receipt') setReceiptData(getLocalizedReceipt(lang));
    if (docType === 'certificate') setCertificateData(getLocalizedCertificate(lang));
    showToast(`Example data restored in ${lang.toUpperCase()}`);
  };

  const handleSaveProgress = () => {
    const payload: SavedProjectState = {
      version: '2.1',
      savedAt: new Date().toISOString(),
      currentType: docType,
      style,
      lang,
      cvData,
      letterData,
      censusData,
      receiptData,
      certificateData,
    };
    saveProjectToFile(payload);
    showToast('Progress saved as JSON file');
  };

  const handleLoadProgress = async () => {
    try {
      const data = await loadProjectFromFile();
      if (data.currentType) setDocType(data.currentType);
      if (data.style) setStyle(data.style);
      if (data.lang) setLang(data.lang);
      if (data.cvData) setCvData(data.cvData);
      if (data.letterData) setLetterData(data.letterData);
      if (data.censusData) setCensusData(data.censusData);
      if (data.receiptData) setReceiptData(data.receiptData);
      if (data.certificateData) setCertificateData(data.certificateData);
      showToast('Project progress restored successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Could not load project file.');
    }
  };

  // Auto-fit zoom on mount, window resize, and when entering mobile preview
  useEffect(() => {
    const updateFit = () => {
      if (typeof window !== 'undefined') {
        const screenW = window.innerWidth;
        if (screenW < 900) {
          const available = screenW - 32;
          const fitScale = Math.min(1.0, Math.max(0.32, Number((available / 794).toFixed(2))));
          setZoomLevel(fitScale);
        } else {
          setZoomLevel(0.95);
        }
      }
    };
    updateFit();
    window.addEventListener('resize', updateFit);
    return () => window.removeEventListener('resize', updateFit);
  }, []);

  useEffect(() => {
    if (mobileView === 'preview' && typeof window !== 'undefined') {
      const available = window.innerWidth - 32;
      if (available < 794) {
        const fit = Math.min(1.0, Math.max(0.32, Number((available / 794).toFixed(2))));
        setZoomLevel(fit);
      }
    }
  }, [mobileView]);

  const currentTheme = COLOR_THEMES[style.themeId] || COLOR_THEMES['slate-emerald'];

  return (
    <div className="min-h-screen lg:h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans-title w-full max-w-full overflow-x-hidden lg:overflow-hidden">
      {/* PDF Export Overlay Modal */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xs w-full text-center border border-zinc-200">
            <Loader2 className="w-9 h-9 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-zinc-900 text-sm">{t('exporting')}</h3>
            <p className="text-xs text-zinc-500 mt-1">Generating high-resolution document...</p>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        currentType={docType}
        onSelectType={(t) => {
          setDocType(t);
          setSidebarTab('inputs');
        }}
        onDownloadPdf={handleDownloadPdf}
        onPrint={handlePrint}
        isGeneratingPdf={isGeneratingPdf}
        onResetData={handleResetData}
        onSaveProgress={handleSaveProgress}
        onLoadProgress={handleLoadProgress}
        currentLang={lang}
        onChangeLang={handleLanguageChange}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-zinc-900 text-white text-xs font-medium py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2 border border-zinc-800"
        >
          <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile View Toggle Bar */}
      <div className="lg:hidden no-print bg-white border-b border-zinc-200 px-4 py-2 flex items-center justify-between w-full max-w-full">
        <div className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg w-full">
          <button
            type="button"
            onClick={() => setMobileView('editor')}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              mobileView === 'editor'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>{t('editor_form')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              mobileView === 'preview'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('document_preview')}</span>
          </button>
        </div>
      </div>

      {/* Mobile & Medium Screen Document Selector Bar (< xl) */}
      <div className="xl:hidden no-print bg-zinc-50/90 border-b border-zinc-200 px-3 sm:px-6 py-2 overflow-x-auto flex items-center gap-1.5 custom-scrollbar w-full max-w-full shrink-0">
        {(['cv', 'letter', 'census', 'receipt', 'certificate'] as DocumentType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setDocType(type);
              setSidebarTab('inputs');
            }}
            className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              docType === type
                ? 'bg-blue-600 text-white'
                : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            {t(
              type === 'cv'
                ? 'curriculum_vitae'
                : type === 'letter'
                ? 'presentation_letter'
                : type === 'census'
                ? 'census_record'
                : type === 'receipt'
                ? 'payment_receipt'
                : 'certificate_award'
            )}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 p-2.5 sm:p-4 lg:p-5 gap-4 w-full max-w-full">
        {/* LEFT PANEL: Form Editor & Controls */}
        <aside
          className={`no-print w-full lg:w-[460px] xl:w-[500px] lg:flex-none bg-white border border-zinc-200 rounded-xl flex flex-col shrink-0 min-h-0 overflow-hidden transition-all ${
            mobileView === 'preview' ? 'max-lg:hidden lg:flex' : 'flex'
          }`}
        >
          {/* Sidebar Tab Header */}
          <div className="px-3.5 py-2.5 border-b border-zinc-200 flex items-center justify-between gap-2 bg-zinc-50/70 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg">
              <button
                type="button"
                onClick={() => setSidebarTab('inputs')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  sidebarTab === 'inputs'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('text_inputs')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('style')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  sidebarTab === 'style'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('colors_style')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('templates')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  sidebarTab === 'templates'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{t('templates')}</span>
              </button>
            </div>

            {/* Clean unboxed auto-save timestamp */}
            {autoSavedTime && (
              <span className="text-[11px] text-zinc-500 font-mono-tabular tabular-nums whitespace-nowrap shrink-0">
                {autoSavedTime}
              </span>
            )}
          </div>

          {/* Sidebar Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            {sidebarTab === 'inputs' && (
              <div>
                {docType === 'cv' && (
                  <CvForm data={cvData} onChange={setCvData} lang={lang} />
                )}
                {docType === 'letter' && (
                  <LetterForm data={letterData} onChange={setLetterData} lang={lang} />
                )}
                {docType === 'census' && (
                  <CensusForm data={censusData} onChange={setCensusData} lang={lang} />
                )}
                {docType === 'receipt' && (
                  <ReceiptForm data={receiptData} onChange={setReceiptData} lang={lang} />
                )}
                {docType === 'certificate' && (
                  <CertificateForm
                    data={certificateData}
                    onChange={setCertificateData}
                    lang={lang}
                  />
                )}
              </div>
            )}

            {sidebarTab === 'style' && (
              <StyleCustomizer style={style} onChange={setStyle} lang={lang} />
            )}

            {sidebarTab === 'templates' && (
              <DocumentSelector
                currentType={docType}
                onSelect={(t) => {
                  setDocType(t);
                  setSidebarTab('inputs');
                }}
                lang={lang}
              />
            )}
          </div>

          {/* Sidebar Footer Bar */}
          <div className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50/70 flex items-center justify-between text-xs text-zinc-500 shrink-0">
            <span className="truncate">
              Theme: <strong className="font-semibold text-zinc-900">{currentTheme.name}</strong>
            </span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              {t('export_now')} &rarr;
            </button>
          </div>
        </aside>

        {/* RIGHT PANEL: Live Document Canvas & Zoom Controls */}
        <section
          className={`flex-1 flex flex-col min-h-0 min-w-0 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden ${
            mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Canvas Sub-Header & Zoom Bar */}
          <div className="no-print bg-white border-b border-zinc-200 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500 min-w-0 truncate">
              <span className="font-semibold text-zinc-900 capitalize truncate">
                {t(
                  docType === 'cv'
                    ? 'curriculum_vitae'
                    : docType === 'letter'
                    ? 'presentation_letter'
                    : docType === 'census'
                    ? 'census_record'
                    : docType === 'receipt'
                    ? 'payment_receipt'
                    : 'certificate_award'
                )}
              </span>
              <span className="text-zinc-300 hidden sm:inline">·</span>
              <span className="text-xs text-zinc-500 hidden sm:inline">A4 Standard Format</span>
              <span className="text-zinc-300 hidden md:inline">·</span>
              <span className="text-xs text-zinc-500 hidden md:inline">
                Font: {style.fontFamily === 'source-serif' ? 'Source Serif 4' : 'Lora'}
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.35, Number((z - 0.1).toFixed(2))))}
                className="h-8 w-8 inline-flex items-center justify-center text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono-tabular tabular-nums w-11 text-center text-zinc-600 font-medium">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
                className="h-8 w-8 inline-flex items-center justify-center text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1.0)}
                className="h-8 text-xs px-2.5 text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                title="Reset to 100%"
              >
                100%
              </button>
              <button
                type="button"
                onClick={handleFitToScreen}
                className="h-8 w-8 inline-flex items-center justify-center text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                title={t('fit_screen')}
                aria-label="Fit to Screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Stage (Centering & Scaling Area) */}
          <div
            ref={documentWrapperRef}
            className="flex-1 overflow-x-auto overflow-y-auto p-2 sm:p-6 lg:p-8 flex justify-center items-start custom-scrollbar w-full max-w-full"
          >
            {/* Outer container matching exact scaled width so it NEVER overflows the device screen */}
            <div
              style={{
                width: `${Math.round(794 * zoomLevel)}px`,
                maxWidth: '100%',
                overflow: 'visible',
              }}
              className="my-2 transition-all flex justify-center shrink-0"
            >
              <div
                id="document-scale-wrapper"
                style={{
                  width: '794px',
                  minWidth: '794px',
                  maxWidth: '794px',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="doc-page-shadow rounded-sm print-canvas bg-white shrink-0 border border-zinc-200"
              >
                {/* Single dedicated DOM ID for PDF export and vector print */}
                <div id="document-canvas" className="w-[794px] min-w-[794px] max-w-[794px] bg-white">
                  <DocumentErrorBoundary onReset={handleResetData}>
                    {docType === 'cv' && (
                      <CvDocument data={cvData} style={style} theme={currentTheme} lang={lang} />
                    )}
                    {docType === 'letter' && (
                      <LetterDocument data={letterData} style={style} theme={currentTheme} lang={lang} />
                    )}
                    {docType === 'census' && (
                      <CensusDocument data={censusData} style={style} theme={currentTheme} lang={lang} />
                    )}
                    {docType === 'receipt' && (
                      <ReceiptDocument data={receiptData} style={style} theme={currentTheme} lang={lang} />
                    )}
                    {docType === 'certificate' && (
                      <CertificateDocument data={certificateData} style={style} theme={currentTheme} lang={lang} />
                    )}
                  </DocumentErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

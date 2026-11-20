/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import {
  DocumentType,
  DocumentStyle,
  LanguageCode,
} from './types/document';
import {
  DEFAULT_STYLE,
  resolveDocumentAssets,
} from './assets/documentAssets';
import {
  DEFAULT_TEMPLATE_CONTENT,
  TemplateDefaultMap,
  getDefaultTemplateContent,
} from './data/defaultData';
import {
  TEMPLATE_REGISTRY,
  mountTemplateDocument,
  renderTemplateForm,
} from './data/templateRegistry';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ChangeTemplateModal } from './components/ChangeTemplateModal';
import { StyleCustomizer } from './components/StyleCustomizer';
import { exportToPdf } from './utils/pdfExport';
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

type SidebarTab = 'inputs' | 'style';
type AppView = 'home' | 'editor';

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
            <span>Reset Template</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Incremental View Flow: Hero + Template Chooser ('home') -> Document Editor ('editor')
  const [view, setView] = useState<AppView>('home');
  const [showChangeTemplateModal, setShowChangeTemplateModal] = useState<boolean>(false);
  const [keptDraftTypes, setKeptDraftTypes] = useState<DocumentType[]>([]);

  // Active Structural Template & Mounted Common Style Assets
  const [docType, setDocType] = useState<DocumentType>('cv');
  const [style, setStyle] = useState<DocumentStyle>(DEFAULT_STYLE);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('inputs');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [lang, setLang] = useState<LanguageCode>('en');

  // Canonical Template Content Store
  const [contents, setContents] = useState<TemplateDefaultMap>(() => ({
    cv: structuredClone(DEFAULT_TEMPLATE_CONTENT.cv),
    letter: structuredClone(DEFAULT_TEMPLATE_CONTENT.letter),
    census: structuredClone(DEFAULT_TEMPLATE_CONTENT.census),
    receipt: structuredClone(DEFAULT_TEMPLATE_CONTENT.receipt),
    certificate: structuredClone(DEFAULT_TEMPLATE_CONTENT.certificate),
  }));

  // UI & Zoom Controls
  const [zoomLevel, setZoomLevel] = useState<number>(0.95);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoSavedTime, setAutoSavedTime] = useState<string | null>(null);

  const documentWrapperRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => getTranslation(lang, key);

  // Pick up common style assets (fonts, colors, paper size, density, header accents) into one mountable bundle
  const mountedAssets = resolveDocumentAssets(style);
  const currentPaperSpec = mountedAssets.paper;
  const currentTheme = mountedAssets.theme;
  const activeTemplateMeta = TEMPLATE_REGISTRY[docType];
  const currentDocTitle = t(activeTemplateMeta.titleKey);

  const updateTemplateContent = useCallback(
    <K extends DocumentType>(type: K, updated: TemplateDefaultMap[K]) => {
      setContents((prev) => ({
        ...prev,
        [type]: updated,
      }));
    },
    []
  );

  const buildSavedPayload = useCallback((): SavedProjectState => ({
    version: '2.1',
    savedAt: new Date().toISOString(),
    currentType: docType,
    style,
    lang,
    cvData: contents.cv,
    letterData: contents.letter,
    censusData: contents.census,
    receiptData: contents.receipt,
    certificateData: contents.certificate,
  }), [docType, style, lang, contents]);

  const applySavedPayload = useCallback((saved: SavedProjectState) => {
    if (saved.currentType) setDocType(saved.currentType);
    if (saved.style) setStyle(saved.style);
    if (saved.lang) setLang(saved.lang);
    setContents((prev) => ({
      cv: saved.cvData || prev.cv,
      letter: saved.letterData || prev.letter,
      census: saved.censusData || prev.census,
      receipt: saved.receiptData || prev.receipt,
      certificate: saved.certificateData || prev.certificate,
    }));
  }, []);

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
        applySavedPayload(saved);
        setAutoSavedTime('Restored');
      } catch (err) {
        console.warn('Could not restore autosave:', err);
      }
    }
  }, [applySavedPayload]);

  // 2. Debounced Automatic Persistence to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveAutoSave(buildSavedPayload());
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAutoSavedTime(timeStr);
    }, 500);

    return () => clearTimeout(timer);
  }, [buildSavedPayload]);

  // 3. Dynamic Fit to Screen calculation
  const handleFitToScreen = useCallback(() => {
    if (!documentWrapperRef.current) return;
    const availableWidth = documentWrapperRef.current.clientWidth - 24;
    const fitScale = Math.min(
      1.15,
      Math.max(0.32, Number((availableWidth / currentPaperSpec.widthPx).toFixed(2)))
    );
    setZoomLevel(fitScale);
  }, [currentPaperSpec.widthPx]);

  // Incremental Flow Handlers
  const handleSelectTemplateFromHome = (selectedType: DocumentType) => {
    setDocType(selectedType);
    if (!keptDraftTypes.includes(selectedType)) {
      setStyle((prev) => ({
        ...prev,
        paperSize: DEFAULT_STYLE.paperSize,
      }));
    }
    setSidebarTab('inputs');
    setMobileView('editor');
    setView('editor');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const scrollToTemplatePicker = () => {
    setTimeout(() => {
      const pickerEl = document.getElementById('template-picker');
      if (pickerEl) {
        pickerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleKeepChangesAndGoHome = () => {
    setKeptDraftTypes((prev) => (prev.includes(docType) ? prev : [...prev, docType]));
    setShowChangeTemplateModal(false);
    setView('home');
    scrollToTemplatePicker();
    showToast(t('changes_kept_toast'));
  };

  const handleDiscardChangesAndGoHome = () => {
    updateTemplateContent(docType, getDefaultTemplateContent(docType));
    setStyle((prev) => ({ ...DEFAULT_STYLE, paperSize: prev.paperSize || 'a4' }));
    setKeptDraftTypes((prev) => prev.filter((item) => item !== docType));
    setShowChangeTemplateModal(false);
    setView('home');
    scrollToTemplatePicker();
    showToast(t('changes_discarded_toast'));
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const filename = activeTemplateMeta.getPdfFilename(contents);

    try {
      const success = await exportToPdf('document-canvas', filename, currentPaperSpec);
      if (success) {
        showToast(`Document downloaded: ${filename}`);
      } else {
        showToast('PDF generation failed. Please try again.');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF generation failed. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Language switch handler: translates UI guidance only; template contents stay constant
  const handleLanguageChange = (newLang: LanguageCode) => {
    setLang(newLang);
    showToast(`Language: ${LANGUAGES[newLang].name}`);
  };

  // Restore neutral blank template state for the active template
  const handleResetData = () => {
    updateTemplateContent(docType, getDefaultTemplateContent(docType));
    showToast('Template reset to neutral placeholders');
  };

  const handleSaveProgress = () => {
    saveProjectToFile(buildSavedPayload());
    showToast('Progress saved as JSON file');
  };

  const handleLoadProgress = async () => {
    try {
      const data = await loadProjectFromFile();
      applySavedPayload(data);
      setView('editor');
      setSidebarTab('inputs');
      window.scrollTo({ top: 0, behavior: 'auto' });
      showToast('Project progress restored successfully!');
    } catch (err: any) {
      if (err?.message !== 'No file selected') {
        showToast(err?.message || 'Could not load project file.');
      }
    }
  };

  // Auto-fit zoom on mount, window resize, paper size change, and when entering mobile preview or editor view
  useEffect(() => {
    const updateFit = () => {
      if (typeof window !== 'undefined') {
        const screenW = window.innerWidth;
        if (screenW < 1024) {
          const available = screenW - 32;
          const fitScale = Math.min(
            1.0,
            Math.max(0.28, Number((available / currentPaperSpec.widthPx).toFixed(2)))
          );
          setZoomLevel(fitScale);
        } else if (documentWrapperRef.current && documentWrapperRef.current.clientWidth > 0) {
          const available = documentWrapperRef.current.clientWidth - 48;
          const fitScale = Math.min(
            0.95,
            Math.max(0.32, Number((available / currentPaperSpec.widthPx).toFixed(2)))
          );
          setZoomLevel(fitScale);
        } else {
          const approxPreviewW = Math.max(400, screenW - 560);
          const fitScale = Math.min(
            0.95,
            Math.max(0.35, Number((approxPreviewW / currentPaperSpec.widthPx).toFixed(2)))
          );
          setZoomLevel(fitScale);
        }
      }
    };
    updateFit();
    window.addEventListener('resize', updateFit);
    return () => window.removeEventListener('resize', updateFit);
  }, [view, currentPaperSpec.widthPx]);

  useEffect(() => {
    if (view === 'editor' && mobileView === 'preview' && typeof window !== 'undefined') {
      const available = window.innerWidth - 32;
      if (available < currentPaperSpec.widthPx) {
        const fit = Math.min(
          1.0,
          Math.max(0.28, Number((available / currentPaperSpec.widthPx).toFixed(2)))
        );
        setZoomLevel(fit);
      }
    }
  }, [mobileView, view, currentPaperSpec.widthPx]);

  // Toast shared across views
  const toastNode = toastMessage ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 bg-zinc-900 text-white text-xs font-medium py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2 border border-zinc-800"
    >
      <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
      <span>{toastMessage}</span>
    </div>
  ) : null;

  // STEP 1: Hero & Template Selection Window
  if (view === 'home') {
    return (
      <>
        <LandingPage
          currentLang={lang}
          onChangeLang={handleLanguageChange}
          onSelectTemplate={handleSelectTemplateFromHome}
          onLoadProgress={handleLoadProgress}
          keptDraftTypes={keptDraftTypes}
        />
        {toastNode}
      </>
    );
  }

  // STEP 2: Full Document Editor & Live Asset-Mounted Preview
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

      {/* Keep / Discard Changes Modal when leaving Editor for Template Selection */}
      <ChangeTemplateModal
        isOpen={showChangeTemplateModal}
        currentDocTitle={currentDocTitle}
        lang={lang}
        onKeepChanges={handleKeepChangesAndGoHome}
        onDiscardChanges={handleDiscardChangesAndGoHome}
        onCancel={() => setShowChangeTemplateModal(false)}
      />

      {/* Top Navigation Bar */}
      <Navbar
        currentType={docType}
        paperSizeLabel={currentPaperSpec.name}
        onRequestChangeTemplate={() => setShowChangeTemplateModal(true)}
        onDownloadPdf={handleDownloadPdf}
        isGeneratingPdf={isGeneratingPdf}
        onResetData={handleResetData}
        onSaveProgress={handleSaveProgress}
        onLoadProgress={handleLoadProgress}
        currentLang={lang}
        onChangeLang={handleLanguageChange}
      />

      {toastNode}

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

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 p-2.5 sm:p-4 lg:p-5 gap-4 w-full max-w-full">
        {/* LEFT PANEL: Form Editor & Common Style Assets */}
        <aside
          className={`no-print w-full lg:w-[460px] xl:w-[500px] lg:flex-none bg-white border border-zinc-200 rounded-xl flex flex-col shrink-0 min-h-0 overflow-hidden transition-all ${
            mobileView === 'preview' ? 'max-lg:hidden lg:flex' : 'flex'
          }`}
        >
          {/* Active Document & Paper Size Context Bar */}
          <div className="px-4 py-2.5 border-b border-zinc-200 bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span className="text-zinc-500 shrink-0">{t('editing_label')}:</span>
              <span className="font-semibold text-zinc-900 truncate">{currentDocTitle}</span>
              <span className="text-zinc-300 shrink-0" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setSidebarTab('style')}
                title={t('paper_size_title')}
                className="font-mono-tabular tabular-nums text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
              >
                {currentPaperSpec.name} ({currentPaperSpec.dimensionsLabel})
              </button>
            </div>

            {autoSavedTime && (
              <span className="text-[11px] text-zinc-500 font-mono-tabular tabular-nums whitespace-nowrap shrink-0">
                {autoSavedTime}
              </span>
            )}
          </div>

          {/* Sidebar Tab Header */}
          <div className="px-3.5 py-2 border-b border-zinc-200 flex items-center justify-between gap-2 bg-zinc-50/70 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg w-full">
              <button
                type="button"
                onClick={() => setSidebarTab('inputs')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
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
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  sidebarTab === 'style'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('colors_style')}</span>
              </button>
            </div>
          </div>

          {/* Sidebar Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            {sidebarTab === 'inputs' && (
              <div>{renderTemplateForm(docType, contents, updateTemplateContent, lang)}</div>
            )}

            {sidebarTab === 'style' && (
              <StyleCustomizer style={style} onChange={setStyle} lang={lang} />
            )}
          </div>

          {/* Sidebar Footer Bar */}
          <div className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50/70 flex items-center text-xs text-zinc-500 shrink-0">
            <span className="truncate">
              Theme: <strong className="font-semibold text-zinc-900">{currentTheme.name}</strong>
            </span>
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
                {currentDocTitle}
              </span>
              <span className="text-zinc-300 shrink-0">·</span>
              <span className="text-xs text-zinc-600 font-mono-tabular tabular-nums whitespace-nowrap shrink-0">
                {currentPaperSpec.name} <span className="hidden sm:inline text-zinc-500">({currentPaperSpec.dimensionsLabel})</span>
              </span>
              <span className="text-zinc-300 hidden md:inline">·</span>
              <span className="text-xs text-zinc-500 hidden md:inline">
                Font: {mountedAssets.font.name}
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.28, Number((z - 0.1).toFixed(2))))}
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
                width: `${Math.round(currentPaperSpec.widthPx * zoomLevel)}px`,
                maxWidth: '100%',
                overflow: 'visible',
              }}
              className="my-2 transition-all flex justify-center shrink-0"
            >
              <div
                id="document-scale-wrapper"
                style={{
                  width: `${currentPaperSpec.widthPx}px`,
                  minWidth: `${currentPaperSpec.widthPx}px`,
                  maxWidth: `${currentPaperSpec.widthPx}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="doc-page-shadow rounded-sm print-canvas bg-white shrink-0 border border-zinc-200"
              >
                {/* Single dedicated DOM ID for PDF export */}
                <div
                  id="document-canvas"
                  style={{
                    width: `${currentPaperSpec.widthPx}px`,
                    minWidth: `${currentPaperSpec.widthPx}px`,
                    maxWidth: `${currentPaperSpec.widthPx}px`,
                  }}
                  className="bg-white"
                >
                  <DocumentErrorBoundary onReset={handleResetData}>
                    {mountTemplateDocument(docType, contents, mountedAssets, lang)}
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

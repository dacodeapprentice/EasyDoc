import {
  DocumentStyle,
  DocumentType,
  EasyDocPdfPayload,
  LanguageCode,
} from '../types/document';
import { DEFAULT_STYLE } from '../assets/documentAssets';
import { TemplateDefaultMap } from '../data/defaultData';
import {
  buildTemplatePdfManifest,
  isValidDocumentType,
  normalizeTemplateContentMap,
} from '../data/templateRegistry';
import type { SavedProjectState } from './storage';

const PDF_STATE_PREFIX = 'EASYDOC_PDF_STATE_V1:';
const PDF_STATE_SUFFIX = ':END_EASYDOC_PDF_STATE';
const PDF_STATE_REGEX = /EASYDOC_PDF_STATE_V1:([A-Za-z0-9+/=]+):END_EASYDOC_PDF_STATE/;

function encodeUtf8JsonToBase64(data: unknown): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64ToUtf8Json<T>(base64: string): T {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const json = new TextDecoder('utf-8').decode(bytes);
  return JSON.parse(json) as T;
}

/**
 * Organizes the current document state by template structure & enabled visual/paper features
 * so it can be embedded invisibly inside any generated PDF.
 */
export function buildEasyDocPdfPayload(
  docType: DocumentType,
  style: DocumentStyle,
  lang: LanguageCode,
  contents: TemplateDefaultMap
): EasyDocPdfPayload {
  return {
    schema: 'easydoc.pdf.v3',
    savedAt: new Date().toISOString(),
    template: buildTemplatePdfManifest(docType),
    features: { ...DEFAULT_STYLE, ...style },
    lang,
    activeContent: contents[docType],
    templates: {
      cv: contents.cv,
      letter: contents.letter,
      census: contents.census,
      receipt: contents.receipt,
      certificate: contents.certificate,
    },
  };
}

/**
 * Converts either the new template-organized `easydoc.pdf.v3` payload or a legacy `SavedProjectState`
 * into the normalized state consumed by the editor.
 */
export function hydrateProjectState(raw: unknown): SavedProjectState {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid project data.');
  }

  const candidate = raw as Record<string, any>;

  // 1. Template-organized v3 PDF payload
  if (candidate.schema === 'easydoc.pdf.v3' && candidate.template) {
    const docType: DocumentType = isValidDocumentType(candidate.template.type)
      ? candidate.template.type
      : 'cv';

    const rawTemplates: Partial<TemplateDefaultMap> = {
      ...(candidate.templates || {}),
    };
    if (candidate.activeContent) {
      rawTemplates[docType] = candidate.activeContent;
    }

    const normalized = normalizeTemplateContentMap(rawTemplates);
    const mergedStyle: DocumentStyle = {
      ...DEFAULT_STYLE,
      ...(candidate.features || {}),
    };

    return {
      version: '3.0',
      savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : new Date().toISOString(),
      currentType: docType,
      style: mergedStyle,
      lang: candidate.lang || 'en',
      cvData: normalized.cv,
      letterData: normalized.letter,
      censusData: normalized.census,
      receiptData: normalized.receipt,
      certificateData: normalized.certificate,
    };
  }

  // 2. Legacy flat SavedProjectState (2.x)
  if (isValidDocumentType(candidate.currentType)) {
    const normalized = normalizeTemplateContentMap({
      cv: candidate.cvData,
      letter: candidate.letterData,
      census: candidate.censusData,
      receipt: candidate.receiptData,
      certificate: candidate.certificateData,
    });

    return {
      version: typeof candidate.version === 'string' ? candidate.version : '2.1',
      savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : new Date().toISOString(),
      currentType: candidate.currentType,
      style: { ...DEFAULT_STYLE, ...(candidate.style || {}) },
      lang: candidate.lang || 'en',
      cvData: normalized.cv,
      letterData: normalized.letter,
      censusData: normalized.census,
      receiptData: normalized.receipt,
      certificateData: normalized.certificate,
    };
  }

  throw new Error('Unrecognized EasyDoc project structure.');
}

/**
 * Embeds the template-organized project JSON inside a spec-compliant, non-rendered PDF stream
 * object referenced by `/EasyDocState` in the PDF Catalog so it remains completely hidden in viewers.
 */
export function attachHiddenPayloadToJsPdf(pdf: any, payload: EasyDocPdfPayload): void {
  if (!pdf?.internal?.events?.subscribe || typeof pdf.internal.newObject !== 'function') {
    return;
  }

  const encoded = encodeUtf8JsonToBase64(payload);
  const markerStream = `${PDF_STATE_PREFIX}${encoded}${PDF_STATE_SUFFIX}`;
  let stateObjectId: number | null = null;

  pdf.internal.events.subscribe('putResources', () => {
    stateObjectId = pdf.internal.newObject();
    pdf.internal.out(`<< /Length ${markerStream.length} >>`);
    pdf.internal.out('stream');
    pdf.internal.out(markerStream);
    pdf.internal.out('endstream');
    pdf.internal.out('endobj');
  });

  pdf.internal.events.subscribe('putCatalog', () => {
    if (stateObjectId !== null) {
      pdf.internal.out(`/EasyDocState ${stateObjectId} 0 R`);
    }
  });
}

/**
 * Extracts and decodes the hidden EasyDoc project payload from an uploaded PDF file buffer.
 * Also supports legacy JSON project files if provided.
 */
export function extractProjectStateFromBuffer(buffer: ArrayBuffer): SavedProjectState {
  const bytes = new Uint8Array(buffer);
  let latin1 = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    latin1 += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  const match = PDF_STATE_REGEX.exec(latin1);
  if (match && match[1]) {
    const parsed = decodeBase64ToUtf8Json<unknown>(match[1]);
    return hydrateProjectState(parsed);
  }

  // Fallback for legacy .json files if manually chosen
  const trimmedStart = latin1.trimStart();
  if (trimmedStart.startsWith('{')) {
    const text = new TextDecoder('utf-8').decode(bytes);
    const parsedJson = JSON.parse(text);
    return hydrateProjectState(parsedJson);
  }

  throw new Error('NO_EMBEDDED_EASYDOC_DATA');
}

import {
  DocumentType,
  DocumentStyle,
  LanguageCode,
  CvData,
  LetterData,
  CensusData,
  ReceiptData,
  CertificateData,
} from '../types/document';
import { extractProjectStateFromBuffer } from './pdfProjectCodec';

export interface SavedProjectState {
  version: string;
  savedAt: string;
  currentType: DocumentType;
  style: DocumentStyle;
  lang?: LanguageCode;
  cvData: CvData;
  letterData: LetterData;
  censusData: CensusData;
  receiptData: ReceiptData;
  certificateData: CertificateData;
}

const PRIMARY_STORAGE_KEY = 'easydoc_autosave_v3';

export function clearAutoSave(): void {
  try {
    localStorage.removeItem(PRIMARY_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function loadProjectFromFile(): Promise<SavedProjectState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.style.display = 'none';

    let settled = false;

    const cleanup = () => {
      input.removeEventListener('change', handleChange);
      input.removeEventListener('cancel', handleCancel);
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    const handleCancel = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('FILE_PICKER_CANCELLED'));
    };

    const handleChange = async (e: Event) => {
      if (settled) return;
      settled = true;
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      cleanup();

      if (!file) {
        reject(new Error('FILE_PICKER_CANCELLED'));
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const state = extractProjectStateFromBuffer(buffer);
        resolve(state);
      } catch (err: any) {
        if (err?.message === 'NO_EMBEDDED_EASYDOC_DATA') {
          reject(new Error('NO_EMBEDDED_EASYDOC_DATA'));
        } else {
          reject(new Error('INVALID_PDF_PROJECT_FILE'));
        }
      }
    };

    input.addEventListener('change', handleChange);
    input.addEventListener('cancel', handleCancel);
    document.body.appendChild(input);
    input.click();
  });
}

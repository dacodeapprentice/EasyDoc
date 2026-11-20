import React from 'react';
import {
  DocumentAssetBundle,
  DocumentType,
  LanguageCode,
} from '../types/document';
import { TemplateDefaultMap } from './defaultData';
import { CvForm } from '../components/forms/CvForm';
import { LetterForm } from '../components/forms/LetterForm';
import { CensusForm } from '../components/forms/CensusForm';
import { ReceiptForm } from '../components/forms/ReceiptForm';
import { CertificateForm } from '../components/forms/CertificateForm';
import { CvDocument } from '../components/documents/CvDocument';
import { LetterDocument } from '../components/documents/LetterDocument';
import { CensusDocument } from '../components/documents/CensusDocument';
import { ReceiptDocument } from '../components/documents/ReceiptDocument';
import { CertificateDocument } from '../components/documents/CertificateDocument';
import {
  Award,
  FileSpreadsheet,
  FileText,
  LucideIcon,
  Mail,
  Receipt,
} from 'lucide-react';

export interface TemplateMetadata {
  type: DocumentType;
  titleKey: string;
  descriptionKey: string;
  includesKey: string;
  Icon: LucideIcon;
  getPdfFilename: (contents: TemplateDefaultMap) => string;
}

export const TEMPLATE_REGISTRY: Record<DocumentType, TemplateMetadata> = {
  cv: {
    type: 'cv',
    titleKey: 'curriculum_vitae',
    descriptionKey: 'cv_desc',
    includesKey: 'cv_includes',
    Icon: FileText,
    getPdfFilename: (contents) =>
      `CV_${contents.cv.fullName.replace(/\s+/g, '_') || 'Resume'}.pdf`,
  },
  letter: {
    type: 'letter',
    titleKey: 'presentation_letter',
    descriptionKey: 'letter_desc',
    includesKey: 'letter_includes',
    Icon: Mail,
    getPdfFilename: (contents) =>
      `Letter_${contents.letter.senderName.replace(/\s+/g, '_') || 'Presentation'}.pdf`,
  },
  census: {
    type: 'census',
    titleKey: 'census_record',
    descriptionKey: 'census_desc',
    includesKey: 'census_includes',
    Icon: FileSpreadsheet,
    getPdfFilename: (contents) =>
      `Census_${contents.census.censusCode || 'Record'}.pdf`,
  },
  receipt: {
    type: 'receipt',
    titleKey: 'payment_receipt',
    descriptionKey: 'receipt_desc',
    includesKey: 'receipt_includes',
    Icon: Receipt,
    getPdfFilename: (contents) =>
      `Receipt_${contents.receipt.receiptNumber || 'Payment'}.pdf`,
  },
  certificate: {
    type: 'certificate',
    titleKey: 'certificate_award',
    descriptionKey: 'certificate_desc',
    includesKey: 'certificate_includes',
    Icon: Award,
    getPdfFilename: (contents) =>
      `Certificate_${contents.certificate.recipientName.replace(/\s+/g, '_') || 'Award'}.pdf`,
  },
};

export const TEMPLATE_LIST: TemplateMetadata[] = [
  TEMPLATE_REGISTRY.cv,
  TEMPLATE_REGISTRY.letter,
  TEMPLATE_REGISTRY.census,
  TEMPLATE_REGISTRY.receipt,
  TEMPLATE_REGISTRY.certificate,
];

export function renderTemplateForm<T extends DocumentType>(
  docType: T,
  contents: TemplateDefaultMap,
  onUpdate: <K extends DocumentType>(type: K, data: TemplateDefaultMap[K]) => void,
  lang: LanguageCode
): React.ReactNode {
  switch (docType) {
    case 'cv':
      return (
        <CvForm
          data={contents.cv}
          onChange={(updated) => onUpdate('cv', updated)}
          lang={lang}
        />
      );
    case 'letter':
      return (
        <LetterForm
          data={contents.letter}
          onChange={(updated) => onUpdate('letter', updated)}
          lang={lang}
        />
      );
    case 'census':
      return (
        <CensusForm
          data={contents.census}
          onChange={(updated) => onUpdate('census', updated)}
          lang={lang}
        />
      );
    case 'receipt':
      return (
        <ReceiptForm
          data={contents.receipt}
          onChange={(updated) => onUpdate('receipt', updated)}
          lang={lang}
        />
      );
    case 'certificate':
      return (
        <CertificateForm
          data={contents.certificate}
          onChange={(updated) => onUpdate('certificate', updated)}
          lang={lang}
        />
      );
  }
}

export function mountTemplateDocument(
  docType: DocumentType,
  contents: TemplateDefaultMap,
  assets: DocumentAssetBundle,
  lang: LanguageCode
): React.ReactNode {
  switch (docType) {
    case 'cv':
      return (
        <CvDocument
          data={contents.cv}
          style={assets.style}
          theme={assets.theme}
          assets={assets}
          lang={lang}
        />
      );
    case 'letter':
      return (
        <LetterDocument
          data={contents.letter}
          style={assets.style}
          theme={assets.theme}
          assets={assets}
          lang={lang}
        />
      );
    case 'census':
      return (
        <CensusDocument
          data={contents.census}
          style={assets.style}
          theme={assets.theme}
          assets={assets}
          lang={lang}
        />
      );
    case 'receipt':
      return (
        <ReceiptDocument
          data={contents.receipt}
          style={assets.style}
          theme={assets.theme}
          assets={assets}
          lang={lang}
        />
      );
    case 'certificate':
      return (
        <CertificateDocument
          data={contents.certificate}
          style={assets.style}
          theme={assets.theme}
          assets={assets}
          lang={lang}
        />
      );
  }
}

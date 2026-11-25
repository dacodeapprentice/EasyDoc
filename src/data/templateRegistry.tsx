import React from 'react';
import {
  DocumentAssetBundle,
  DocumentType,
  LanguageCode,
  TemplatePdfStructure,
} from '../types/document';
import {
  DEFAULT_CV,
  DEFAULT_LETTER,
  DEFAULT_CENSUS,
  DEFAULT_RECEIPT,
  DEFAULT_CERTIFICATE,
  TemplateDefaultMap,
} from './defaultData';
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
  pdfStructure: TemplatePdfStructure;
  getPdfFilename: (contents: TemplateDefaultMap) => string;
}

export const TEMPLATE_REGISTRY: Record<DocumentType, TemplateMetadata> = {
  cv: {
    type: 'cv',
    titleKey: 'curriculum_vitae',
    descriptionKey: 'cv_desc',
    includesKey: 'cv_includes',
    Icon: FileText,
    pdfStructure: {
      templateId: 'cv',
      sections: [
        { id: 'personal_contact', labelKey: 'personal_info', required: true },
        { id: 'profile_summary', labelKey: 'profile_summary' },
        { id: 'work_experience', labelKey: 'work_experience' },
        { id: 'education', labelKey: 'education' },
        { id: 'skills_languages', labelKey: 'key_competencies' },
      ],
      supportedFeatures: [
        'photo_avatar',
        'multi_item_list',
        'header_accent',
        'color_theme',
        'typography',
        'paper_size',
        'margins_density',
      ],
      recommendedPaperSizes: ['a4', 'letter', 'executive', 'b5', 'legal'],
    },
    getPdfFilename: (contents) =>
      `CV_${contents.cv.fullName.replace(/\s+/g, '_') || 'Resume'}.pdf`,
  },
  letter: {
    type: 'letter',
    titleKey: 'presentation_letter',
    descriptionKey: 'letter_desc',
    includesKey: 'letter_includes',
    Icon: Mail,
    pdfStructure: {
      templateId: 'letter',
      sections: [
        { id: 'sender_letterhead', labelKey: 'sender_letterhead', required: true },
        { id: 'issue_date', labelKey: 'issue_date' },
        { id: 'recipient_block', labelKey: 'recipient_details' },
        { id: 'formal_subject', labelKey: 'formal_subject' },
        { id: 'letter_body', labelKey: 'opening_paragraph', required: true },
        { id: 'formal_signoff', labelKey: 'formal_signoff' },
      ],
      supportedFeatures: [
        'org_logo',
        'header_accent',
        'color_theme',
        'typography',
        'paper_size',
        'margins_density',
      ],
      recommendedPaperSizes: ['a4', 'letter', 'executive', 'a5', 'statement'],
    },
    getPdfFilename: (contents) =>
      `Letter_${contents.letter.senderName.replace(/\s+/g, '_') || 'Presentation'}.pdf`,
  },
  census: {
    type: 'census',
    titleKey: 'census_record',
    descriptionKey: 'census_desc',
    includesKey: 'census_includes',
    Icon: FileSpreadsheet,
    pdfStructure: {
      templateId: 'census',
      sections: [
        { id: 'registry_header', labelKey: 'census_registry', required: true },
        { id: 'dwelling_infrastructure', labelKey: 'head_household' },
        { id: 'resident_roster', labelKey: 'resident_roster' },
        { id: 'observations_certification', labelKey: 'field_notes' },
      ],
      supportedFeatures: [
        'multi_item_list',
        'header_accent',
        'color_theme',
        'typography',
        'paper_size',
        'margins_density',
      ],
      recommendedPaperSizes: ['a4', 'legal', 'letter', 'folio', 'a3'],
    },
    getPdfFilename: (contents) =>
      `Census_${contents.census.censusCode || 'Record'}.pdf`,
  },
  receipt: {
    type: 'receipt',
    titleKey: 'payment_receipt',
    descriptionKey: 'receipt_desc',
    includesKey: 'receipt_includes',
    Icon: Receipt,
    pdfStructure: {
      templateId: 'receipt',
      sections: [
        { id: 'business_voucher_header', labelKey: 'commercial_receipt', required: true },
        { id: 'customer_billing', labelKey: 'billed_to' },
        { id: 'itemized_ledger', labelKey: 'item_description', required: true },
        { id: 'totals_signatory_notes', labelKey: 'total_paid' },
      ],
      supportedFeatures: [
        'org_logo',
        'multi_item_list',
        'financial_totals',
        'header_accent',
        'color_theme',
        'typography',
        'paper_size',
        'margins_density',
      ],
      recommendedPaperSizes: ['a5', 'a4', 'letter', 'statement', 'pos80'],
    },
    getPdfFilename: (contents) =>
      `Receipt_${contents.receipt.receiptNumber || 'Payment'}.pdf`,
  },
  certificate: {
    type: 'certificate',
    titleKey: 'certificate_award',
    descriptionKey: 'certificate_desc',
    includesKey: 'certificate_includes',
    Icon: Award,
    pdfStructure: {
      templateId: 'certificate',
      sections: [
        { id: 'institution_header', labelKey: 'cert_org' },
        { id: 'recipient_distinction', labelKey: 'cert_recipient', required: true },
        { id: 'citation_award_date', labelKey: 'cert_citation' },
        { id: 'signatories_seal', labelKey: 'primary_signatory' },
      ],
      supportedFeatures: [
        'official_seal',
        'color_theme',
        'typography',
        'paper_size',
        'margins_density',
      ],
      recommendedPaperSizes: ['a4-landscape', 'letter-landscape', 'a4', 'letter', 'a3-landscape'],
    },
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

export function isValidDocumentType(type: unknown): type is DocumentType {
  return typeof type === 'string' && type in TEMPLATE_REGISTRY;
}

export function buildTemplatePdfManifest(docType: DocumentType) {
  const structure = TEMPLATE_REGISTRY[docType].pdfStructure;
  return {
    type: docType,
    sections: structure.sections.map((s) => s.id),
    supportedFeatures: [...structure.supportedFeatures],
  };
}

export function normalizeTemplateContentMap(
  raw: Partial<TemplateDefaultMap> | undefined
): TemplateDefaultMap {
  return {
    cv: { ...structuredClone(DEFAULT_CV), ...(raw?.cv || {}) },
    letter: { ...structuredClone(DEFAULT_LETTER), ...(raw?.letter || {}) },
    census: { ...structuredClone(DEFAULT_CENSUS), ...(raw?.census || {}) },
    receipt: { ...structuredClone(DEFAULT_RECEIPT), ...(raw?.receipt || {}) },
    certificate: { ...structuredClone(DEFAULT_CERTIFICATE), ...(raw?.certificate || {}) },
  };
}

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

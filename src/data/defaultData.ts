import {
  CvData,
  LetterData,
  CensusData,
  ReceiptData,
  CertificateData,
  DocumentType,
  LanguageCode,
} from '../types/document';

export {
  PAPER_SIZE_ASSETS as PAPER_SIZES,
  COLOR_THEME_ASSETS as COLOR_THEMES,
  FONT_ASSETS,
  DENSITY_ASSETS,
  HEADER_ACCENT_ASSETS,
  SELECTABLE_HEADER_ACCENTS,
  DEFAULT_STYLE,
  getPaperLayout,
  resolveDocumentAssets,
} from '../assets/documentAssets';
export type { DocumentLayoutTokens as PaperLayoutTokens } from '../types/document';

export const DEFAULT_CV: CvData = {
  fullName: '',
  professionalTitle: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  summary: '',
  experience: [
    {
      id: 'exp-1',
      role: '',
      company: '',
      location: '',
      period: '',
      highlights: [''],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: '',
      institution: '',
      year: '',
      details: '',
    },
  ],
  skills: [],
  languages: [],
};

export const DEFAULT_LETTER: LetterData = {
  senderName: '',
  senderTitle: '',
  senderCompany: '',
  senderAddress: '',
  senderEmail: '',
  senderPhone: '',
  date: '',
  recipientName: '',
  recipientTitle: '',
  recipientCompany: '',
  recipientAddress: '',
  subject: '',
  salutation: '',
  openingParagraph: '',
  bodyParagraphOne: '',
  bodyParagraphTwo: '',
  closingParagraph: '',
  signoff: '',
  enclosureNotice: '',
};

export const DEFAULT_CENSUS: CensusData = {
  censusCode: '',
  districtRegion: '',
  enumerationArea: '',
  surveyDate: '',
  headOfHousehold: '',
  residentialAddress: '',
  dwellingType: '',
  tenureStatus: '',
  totalRooms: '',
  primaryWaterSource: '',
  electricityAccess: '',
  householdMembers: [
    {
      id: 'mem-1',
      fullName: '',
      relationship: '',
      age: '',
      gender: '',
      educationLevel: '',
      occupation: '',
    },
  ],
  officialNotes: '',
  enumeratorName: '',
  supervisorSignatureRef: '',
};

export const DEFAULT_RECEIPT: ReceiptData = {
  receiptNumber: '',
  issueDate: '',
  paymentMethod: '',
  transactionRef: '',
  businessName: '',
  businessAddress: '',
  businessEmail: '',
  businessTaxId: '',
  customerName: '',
  customerCompany: '',
  customerEmail: '',
  customerAddress: '',
  items: [
    {
      id: 'item-1',
      description: '',
      quantity: '',
      unitPrice: '',
      total: 0,
    },
  ],
  taxRatePercent: '',
  discountAmount: '',
  notes: '',
  cashierOrAgent: '',
};

export const DEFAULT_CERTIFICATE: CertificateData = {
  certificateId: '',
  recipientName: '',
  title: '',
  courseOrAchievement: '',
  issuingOrganization: '',
  dateOfAward: '',
  description: '',
  primarySignatoryName: '',
  primarySignatoryTitle: '',
  secondarySignatoryName: '',
  secondarySignatoryTitle: '',
};

export interface TemplateDefaultMap {
  cv: CvData;
  letter: LetterData;
  census: CensusData;
  receipt: ReceiptData;
  certificate: CertificateData;
}

export const DEFAULT_TEMPLATE_CONTENT: TemplateDefaultMap = {
  cv: DEFAULT_CV,
  letter: DEFAULT_LETTER,
  census: DEFAULT_CENSUS,
  receipt: DEFAULT_RECEIPT,
  certificate: DEFAULT_CERTIFICATE,
};

export function getDefaultTemplateContent<T extends DocumentType>(type: T): TemplateDefaultMap[T] {
  return structuredClone(DEFAULT_TEMPLATE_CONTENT[type]);
}

export const getLocalizedCv = (_lang?: LanguageCode): CvData => getDefaultTemplateContent('cv');
export const getLocalizedLetter = (_lang?: LanguageCode): LetterData => getDefaultTemplateContent('letter');
export const getLocalizedCensus = (_lang?: LanguageCode): CensusData => getDefaultTemplateContent('census');
export const getLocalizedReceipt = (_lang?: LanguageCode): ReceiptData => getDefaultTemplateContent('receipt');
export const getLocalizedCertificate = (_lang?: LanguageCode): CertificateData =>
  getDefaultTemplateContent('certificate');

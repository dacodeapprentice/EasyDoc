import {
  ColorTheme,
  ColorThemeId,
  CustomPaperDimensions,
  DensityAsset,
  DensityChoice,
  DesignPresetId,
  DesignPresetSpec,
  DocumentAssetBundle,
  DocumentLayoutTokens,
  DocumentStyle,
  DocumentType,
  FontAsset,
  FontFamilyChoice,
  GoogleFontId,
  HeaderAccentAsset,
  HeaderStyleChoice,
  PaperSizeId,
  PaperSizeSpec,
} from '../types/document';
import { buildThemeFromCustomPalette } from './colorPaletteUtils';

export const STANDARD_PAPER_SIZE_ASSETS: Record<Exclude<PaperSizeId, 'custom'>, PaperSizeSpec> = {
  a4: {
    id: 'a4',
    name: 'A4',
    widthMm: 210,
    heightMm: 297,
    widthPx: 794,
    heightPx: 1123,
    dimensionsLabel: '210 × 297 mm',
    jsPdfFormat: 'a4',
    cssPageSize: 'A4 portrait',
    orientation: 'portrait',
  },
  letter: {
    id: 'letter',
    name: 'US Letter',
    widthMm: 215.9,
    heightMm: 279.4,
    widthPx: 816,
    heightPx: 1056,
    dimensionsLabel: '216 × 279 mm',
    jsPdfFormat: 'letter',
    cssPageSize: 'letter portrait',
    orientation: 'portrait',
  },
  legal: {
    id: 'legal',
    name: 'US Legal',
    widthMm: 215.9,
    heightMm: 355.6,
    widthPx: 816,
    heightPx: 1344,
    dimensionsLabel: '216 × 356 mm',
    jsPdfFormat: 'legal',
    cssPageSize: 'legal portrait',
    orientation: 'portrait',
  },
  a5: {
    id: 'a5',
    name: 'A5',
    widthMm: 148,
    heightMm: 210,
    widthPx: 559,
    heightPx: 794,
    dimensionsLabel: '148 × 210 mm',
    jsPdfFormat: 'a5',
    cssPageSize: 'A5 portrait',
    orientation: 'portrait',
  },
  a3: {
    id: 'a3',
    name: 'A3',
    widthMm: 297,
    heightMm: 420,
    widthPx: 1123,
    heightPx: 1587,
    dimensionsLabel: '297 × 420 mm',
    jsPdfFormat: 'a3',
    cssPageSize: 'A3 portrait',
    orientation: 'portrait',
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    widthMm: 184.1,
    heightMm: 266.7,
    widthPx: 696,
    heightPx: 1008,
    dimensionsLabel: '184 × 267 mm',
    jsPdfFormat: [184.1, 266.7],
    cssPageSize: '184.1mm 266.7mm',
    orientation: 'portrait',
  },
  b5: {
    id: 'b5',
    name: 'B5 (ISO)',
    widthMm: 176,
    heightMm: 250,
    widthPx: 665,
    heightPx: 945,
    dimensionsLabel: '176 × 250 mm',
    jsPdfFormat: [176, 250],
    cssPageSize: '176mm 250mm',
    orientation: 'portrait',
  },
  statement: {
    id: 'statement',
    name: 'Half Letter',
    widthMm: 139.7,
    heightMm: 215.9,
    widthPx: 528,
    heightPx: 816,
    dimensionsLabel: '140 × 216 mm',
    jsPdfFormat: [139.7, 215.9],
    cssPageSize: '139.7mm 215.9mm',
    orientation: 'portrait',
  },
  folio: {
    id: 'folio',
    name: 'Folio / Legal',
    widthMm: 215.9,
    heightMm: 330.2,
    widthPx: 816,
    heightPx: 1248,
    dimensionsLabel: '216 × 330 mm',
    jsPdfFormat: [215.9, 330.2],
    cssPageSize: '215.9mm 330.2mm',
    orientation: 'portrait',
  },
  pos80: {
    id: 'pos80',
    name: 'Thermal 80mm',
    widthMm: 80,
    heightMm: 200,
    widthPx: 302,
    heightPx: 756,
    dimensionsLabel: '80 × 200 mm',
    jsPdfFormat: [80, 200],
    cssPageSize: '80mm 200mm',
    orientation: 'portrait',
  },
  'a4-landscape': {
    id: 'a4-landscape',
    name: 'A4 Landscape',
    widthMm: 297,
    heightMm: 210,
    widthPx: 1123,
    heightPx: 794,
    dimensionsLabel: '297 × 210 mm',
    jsPdfFormat: 'a4',
    cssPageSize: 'A4 landscape',
    orientation: 'landscape',
  },
  'letter-landscape': {
    id: 'letter-landscape',
    name: 'Letter Landscape',
    widthMm: 279.4,
    heightMm: 215.9,
    widthPx: 1056,
    heightPx: 816,
    dimensionsLabel: '279 × 216 mm',
    jsPdfFormat: 'letter',
    cssPageSize: 'letter landscape',
    orientation: 'landscape',
  },
  'a3-landscape': {
    id: 'a3-landscape',
    name: 'A3 Landscape',
    widthMm: 420,
    heightMm: 297,
    widthPx: 1587,
    heightPx: 1123,
    dimensionsLabel: '420 × 297 mm',
    jsPdfFormat: 'a3',
    cssPageSize: 'A3 landscape',
    orientation: 'landscape',
  },
};

export const PAPER_SIZE_ASSETS = STANDARD_PAPER_SIZE_ASSETS;

export const DOC_TYPE_PAPER_SIZES: Record<DocumentType, Exclude<PaperSizeId, 'custom'>[]> = {
  cv: ['a4', 'letter', 'executive', 'b5', 'legal'],
  letter: ['a4', 'letter', 'executive', 'a5', 'statement'],
  census: ['a4', 'legal', 'letter', 'folio', 'a3'],
  receipt: ['a5', 'a4', 'letter', 'statement', 'pos80'],
  certificate: ['a4-landscape', 'letter-landscape', 'a4', 'letter', 'a3-landscape'],
};

export function getPaperSizesForDocType(docType: DocumentType): PaperSizeSpec[] {
  const ids = DOC_TYPE_PAPER_SIZES[docType] || DOC_TYPE_PAPER_SIZES.cv;
  return ids.map((id) => STANDARD_PAPER_SIZE_ASSETS[id]);
}

export function getDefaultPaperSizeForDocType(docType: DocumentType): Exclude<PaperSizeId, 'custom'> {
  return DOC_TYPE_PAPER_SIZES[docType]?.[0] || 'a4';
}

export const DEFAULT_CUSTOM_PAPER: CustomPaperDimensions = {
  widthMm: 210,
  heightMm: 297,
  unit: 'mm',
};

export const RECOMMENDED_MIN_PAPER_MM = 95;
export const RECOMMENDED_MAX_PAPER_MM = 450;

export function isPaperDimRecommended(mm: number): boolean {
  return Number.isFinite(mm) && mm >= RECOMMENDED_MIN_PAPER_MM && mm <= RECOMMENDED_MAX_PAPER_MM;
}

export function clampPaperMm(val: number, fallback = 210): number {
  if (!Number.isFinite(val)) return fallback;
  return Math.min(450, Math.max(95, Math.round(val)));
}

export function sanitizeCustomPaperMm(val: number, fallback = 210): number {
  if (!Number.isFinite(val) || val <= 0) return fallback;
  return Math.max(0.01, Math.round(val * 1000) / 1000);
}

export function resolvePaperSizeSpec(
  paperSize: PaperSizeId = 'a4',
  customDimensions?: CustomPaperDimensions
): PaperSizeSpec {
  if (paperSize !== 'custom') {
    return STANDARD_PAPER_SIZE_ASSETS[paperSize] || STANDARD_PAPER_SIZE_ASSETS.a4;
  }

  const widthMm = sanitizeCustomPaperMm(customDimensions?.widthMm ?? 210, 210);
  const heightMm = sanitizeCustomPaperMm(customDimensions?.heightMm ?? 297, 297);
  const widthPx = Math.max(1, Math.round((widthMm / 25.4) * 96));
  const heightPx = Math.max(1, Math.round((heightMm / 25.4) * 96));
  const orientation: 'portrait' | 'landscape' = widthMm > heightMm ? 'landscape' : 'portrait';
  const fmtMm = (mm: number) => (mm < 10 ? Number(mm.toFixed(1)) : Math.round(mm));

  return {
    id: 'custom',
    name: 'Custom',
    widthMm,
    heightMm,
    widthPx,
    heightPx,
    dimensionsLabel: `${fmtMm(widthMm)} × ${fmtMm(heightMm)} mm`,
    jsPdfFormat: [widthMm, heightMm],
    cssPageSize: `${widthMm}mm ${heightMm}mm`,
    orientation,
  };
}

export const COLOR_THEME_ASSETS: Record<Exclude<ColorThemeId, 'custom'>, ColorTheme> = {
  'slate-emerald': {
    id: 'slate-emerald',
    name: 'Slate & Emerald',
    primary: '#059669',
    primaryDark: '#064e3b',
    primaryLight: '#ecfdf5',
    secondary: '#0284c7',
    accent: '#0f766e',
    border: '#cbd5e1',
    textHeader: '#0f172a',
    tagColor: '#047857',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
  },
  'navy-cerulean': {
    id: 'navy-cerulean',
    name: 'Navy & Cerulean',
    primary: '#0284c7',
    primaryDark: '#0c4a6e',
    primaryLight: '#f0f9ff',
    secondary: '#059669',
    accent: '#0369a1',
    border: '#cbd5e1',
    textHeader: '#0f172a',
    tagColor: '#0284c7',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
  },
  'nordic-forest': {
    id: 'nordic-forest',
    name: 'Nordic Forest & Moss',
    primary: '#15803d',
    primaryDark: '#14532d',
    primaryLight: '#f0fdf4',
    secondary: '#0d9488',
    accent: '#166534',
    border: '#cbd5e1',
    textHeader: '#052e16',
    tagColor: '#15803d',
    badgeBg: '#dcfce7',
    badgeText: '#14532d',
  },
  'teal-aegean': {
    id: 'teal-aegean',
    name: 'Teal & Aegean Sea',
    primary: '#0d9488',
    primaryDark: '#134e4a',
    primaryLight: '#f0fdfa',
    secondary: '#0284c7',
    accent: '#0f766e',
    border: '#cbd5e1',
    textHeader: '#111827',
    tagColor: '#0d9488',
    badgeBg: '#ccfbf1',
    badgeText: '#115e59',
  },
  'cobalt-seafoam': {
    id: 'cobalt-seafoam',
    name: 'Cobalt & Seafoam',
    primary: '#1d4ed8',
    primaryDark: '#1e3a8a',
    primaryLight: '#eff6ff',
    secondary: '#10b981',
    accent: '#2563eb',
    border: '#cbd5e1',
    textHeader: '#0f172a',
    tagColor: '#1d4ed8',
    badgeBg: '#dbeafe',
    badgeText: '#1e40af',
  },
};

export const GOOGLE_FONT_ASSETS: Record<GoogleFontId, FontAsset> = {
  'plus-jakarta-sans': {
    id: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans',
    category: 'Sans',
    cssFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    description: 'Modern geometric sans with crisp proportions.',
    cssClass: 'font-sans-title',
    previewClass: '',
  },
  'dm-sans': {
    id: 'dm-sans',
    name: 'DM Sans',
    category: 'Sans',
    cssFamily: "'DM Sans', system-ui, sans-serif",
    description: 'Clean low-contrast grotesque for contemporary clarity.',
    cssClass: 'doc-font-body',
    previewClass: '',
  },
  manrope: {
    id: 'manrope',
    name: 'Manrope',
    category: 'Sans',
    cssFamily: "'Manrope', system-ui, sans-serif",
    description: 'Balanced technical sans suited to structured records.',
    cssClass: 'doc-font-body',
    previewClass: '',
  },
  outfit: {
    id: 'outfit',
    name: 'Outfit',
    category: 'Display',
    cssFamily: "'Outfit', system-ui, sans-serif",
    description: 'Confident geometric display face for strong headers.',
    cssClass: 'doc-font-body',
    previewClass: '',
  },
  'bricolage-grotesque': {
    id: 'bricolage-grotesque',
    name: 'Bricolage Grotesque',
    category: 'Display',
    cssFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    description: 'Expressive editorial grotesque with distinctive poise.',
    cssClass: 'doc-font-body',
    previewClass: '',
  },
  'ibm-plex-sans': {
    id: 'ibm-plex-sans',
    name: 'IBM Plex Sans',
    category: 'Sans',
    cssFamily: "'IBM Plex Sans', system-ui, sans-serif",
    description: 'Authoritative corporate humanist sans-serif.',
    cssClass: 'doc-font-body',
    previewClass: '',
  },
  'source-serif-4': {
    id: 'source-serif-4',
    name: 'Source Serif 4',
    category: 'Serif',
    cssFamily: "'Source Serif 4', Georgia, serif",
    description: 'Crisp, balanced humanist serif for long-form legibility.',
    cssClass: 'font-serif-reading',
    previewClass: 'font-serif-reading',
  },
  lora: {
    id: 'lora',
    name: 'Lora',
    category: 'Serif',
    cssFamily: "'Lora', Georgia, serif",
    description: 'Contemporary literary serif with brushed curves.',
    cssClass: 'font-serif-lora',
    previewClass: 'font-serif-lora',
  },
  'playfair-display': {
    id: 'playfair-display',
    name: 'Playfair Display',
    category: 'Serif',
    cssFamily: "'Playfair Display', Georgia, serif",
    description: 'High-contrast editorial serif for distinguished titles.',
    cssClass: 'doc-font-body',
    previewClass: '',
  },
  fraunces: {
    id: 'fraunces',
    name: 'Fraunces',
    category: 'Display',
    cssFamily: "'Fraunces', Georgia, serif",
    description: 'Warm, refined soft serif with classic character.',
    cssClass: 'doc-font-body',
    previewClass: '',
  },
  'cormorant-garamond': {
    id: 'cormorant-garamond',
    name: 'Cormorant Garamond',
    category: 'Serif',
    cssFamily: "'Cormorant Garamond', Georgia, serif",
    description: 'Formal classical book serif with refined proportions.',
    cssClass: 'doc-font-body',
    previewClass: '',
  },
  'jetbrains-mono': {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: 'Mono',
    cssFamily: "'JetBrains Mono', monospace",
    description: 'Clean monospaced typeface with crisp tabular numerals.',
    cssClass: 'font-mono-tabular',
    previewClass: 'font-mono-tabular',
  },
};

export const FONT_ASSETS = GOOGLE_FONT_ASSETS;

export function resolveGoogleFontAsset(fontId?: FontFamilyChoice): FontAsset {
  if (!fontId || fontId === 'source-serif') {
    return GOOGLE_FONT_ASSETS['source-serif-4'];
  }
  return GOOGLE_FONT_ASSETS[fontId] || GOOGLE_FONT_ASSETS['source-serif-4'];
}

export const DESIGN_PRESETS: Record<DesignPresetId, DesignPresetSpec> = {
  'executive-spine': {
    id: 'executive-spine',
    nameKey: 'design_executive_name',
    shortLabelKey: 'design_executive_short',
    descriptionKey: 'design_executive_desc',
    headerStyle: 'left-bar',
    density: 'standard',
    defaultThemeId: 'slate-emerald',
    defaultHeadingFont: 'plus-jakarta-sans',
    defaultBodyFont: 'source-serif-4',
    defaultMonoFont: 'jetbrains-mono',
  },
  'modern-banner': {
    id: 'modern-banner',
    nameKey: 'design_banner_name',
    shortLabelKey: 'design_banner_short',
    descriptionKey: 'design_banner_desc',
    headerStyle: 'banner',
    density: 'standard',
    defaultThemeId: 'navy-cerulean',
    defaultHeadingFont: 'outfit',
    defaultBodyFont: 'dm-sans',
    defaultMonoFont: 'jetbrains-mono',
  },
  'editorial-serif': {
    id: 'editorial-serif',
    nameKey: 'design_editorial_name',
    shortLabelKey: 'design_editorial_short',
    descriptionKey: 'design_editorial_desc',
    headerStyle: 'classic',
    density: 'generous',
    defaultThemeId: 'nordic-forest',
    defaultHeadingFont: 'playfair-display',
    defaultBodyFont: 'lora',
    defaultMonoFont: 'jetbrains-mono',
  },
  'split-sidebar': {
    id: 'split-sidebar',
    nameKey: 'design_split_name',
    shortLabelKey: 'design_split_short',
    descriptionKey: 'design_split_desc',
    headerStyle: 'minimal',
    density: 'standard',
    defaultThemeId: 'teal-aegean',
    defaultHeadingFont: 'manrope',
    defaultBodyFont: 'ibm-plex-sans',
    defaultMonoFont: 'jetbrains-mono',
  },
  'swiss-grid': {
    id: 'swiss-grid',
    nameKey: 'design_swiss_name',
    shortLabelKey: 'design_swiss_short',
    descriptionKey: 'design_swiss_desc',
    headerStyle: 'minimal',
    density: 'compact',
    defaultThemeId: 'cobalt-seafoam',
    defaultHeadingFont: 'bricolage-grotesque',
    defaultBodyFont: 'dm-sans',
    defaultMonoFont: 'jetbrains-mono',
  },
};

export const DESIGN_PRESET_LIST: DesignPresetSpec[] = [
  DESIGN_PRESETS['executive-spine'],
  DESIGN_PRESETS['modern-banner'],
  DESIGN_PRESETS['editorial-serif'],
  DESIGN_PRESETS['split-sidebar'],
  DESIGN_PRESETS['swiss-grid'],
];

export interface DocTypeDesignMeta {
  nameKey: string;
  shortLabelKey: string;
  descriptionKey: string;
}

export const DOC_TYPE_DESIGN_META: Record<DocumentType, Record<DesignPresetId, DocTypeDesignMeta>> = {
  cv: {
    'executive-spine': {
      nameKey: 'design_executive_name',
      shortLabelKey: 'design_executive_short',
      descriptionKey: 'design_executive_desc',
    },
    'modern-banner': {
      nameKey: 'design_banner_name',
      shortLabelKey: 'design_banner_short',
      descriptionKey: 'design_banner_desc',
    },
    'editorial-serif': {
      nameKey: 'design_editorial_name',
      shortLabelKey: 'design_editorial_short',
      descriptionKey: 'design_editorial_desc',
    },
    'split-sidebar': {
      nameKey: 'design_split_name',
      shortLabelKey: 'design_split_short',
      descriptionKey: 'design_split_desc',
    },
    'swiss-grid': {
      nameKey: 'design_swiss_name',
      shortLabelKey: 'design_swiss_short',
      descriptionKey: 'design_swiss_desc',
    },
  },
  letter: {
    'executive-spine': {
      nameKey: 'design_letter_spine_name',
      shortLabelKey: 'design_letter_spine_short',
      descriptionKey: 'design_letter_spine_desc',
    },
    'modern-banner': {
      nameKey: 'design_letter_banner_name',
      shortLabelKey: 'design_letter_banner_short',
      descriptionKey: 'design_letter_banner_desc',
    },
    'editorial-serif': {
      nameKey: 'design_letter_editorial_name',
      shortLabelKey: 'design_letter_editorial_short',
      descriptionKey: 'design_letter_editorial_desc',
    },
    'split-sidebar': {
      nameKey: 'design_letter_split_name',
      shortLabelKey: 'design_letter_split_short',
      descriptionKey: 'design_letter_split_desc',
    },
    'swiss-grid': {
      nameKey: 'design_letter_swiss_name',
      shortLabelKey: 'design_letter_swiss_short',
      descriptionKey: 'design_letter_swiss_desc',
    },
  },
  census: {
    'executive-spine': {
      nameKey: 'design_census_spine_name',
      shortLabelKey: 'design_census_spine_short',
      descriptionKey: 'design_census_spine_desc',
    },
    'modern-banner': {
      nameKey: 'design_census_banner_name',
      shortLabelKey: 'design_census_banner_short',
      descriptionKey: 'design_census_banner_desc',
    },
    'editorial-serif': {
      nameKey: 'design_census_editorial_name',
      shortLabelKey: 'design_census_editorial_short',
      descriptionKey: 'design_census_editorial_desc',
    },
    'split-sidebar': {
      nameKey: 'design_census_split_name',
      shortLabelKey: 'design_census_split_short',
      descriptionKey: 'design_census_split_desc',
    },
    'swiss-grid': {
      nameKey: 'design_census_swiss_name',
      shortLabelKey: 'design_census_swiss_short',
      descriptionKey: 'design_census_swiss_desc',
    },
  },
  receipt: {
    'executive-spine': {
      nameKey: 'design_receipt_spine_name',
      shortLabelKey: 'design_receipt_spine_short',
      descriptionKey: 'design_receipt_spine_desc',
    },
    'modern-banner': {
      nameKey: 'design_receipt_banner_name',
      shortLabelKey: 'design_receipt_banner_short',
      descriptionKey: 'design_receipt_banner_desc',
    },
    'editorial-serif': {
      nameKey: 'design_receipt_editorial_name',
      shortLabelKey: 'design_receipt_editorial_short',
      descriptionKey: 'design_receipt_editorial_desc',
    },
    'split-sidebar': {
      nameKey: 'design_receipt_split_name',
      shortLabelKey: 'design_receipt_split_short',
      descriptionKey: 'design_receipt_split_desc',
    },
    'swiss-grid': {
      nameKey: 'design_receipt_swiss_name',
      shortLabelKey: 'design_receipt_swiss_short',
      descriptionKey: 'design_receipt_swiss_desc',
    },
  },
  certificate: {
    'executive-spine': {
      nameKey: 'design_cert_spine_name',
      shortLabelKey: 'design_cert_spine_short',
      descriptionKey: 'design_cert_spine_desc',
    },
    'modern-banner': {
      nameKey: 'design_cert_banner_name',
      shortLabelKey: 'design_cert_banner_short',
      descriptionKey: 'design_cert_banner_desc',
    },
    'editorial-serif': {
      nameKey: 'design_cert_editorial_name',
      shortLabelKey: 'design_cert_editorial_short',
      descriptionKey: 'design_cert_editorial_desc',
    },
    'split-sidebar': {
      nameKey: 'design_cert_split_name',
      shortLabelKey: 'design_cert_split_short',
      descriptionKey: 'design_cert_split_desc',
    },
    'swiss-grid': {
      nameKey: 'design_cert_swiss_name',
      shortLabelKey: 'design_cert_swiss_short',
      descriptionKey: 'design_cert_swiss_desc',
    },
  },
};

export function getDocTypeDesignMeta(
  docType: DocumentType,
  designId: DesignPresetId
): DocTypeDesignMeta {
  return DOC_TYPE_DESIGN_META[docType]?.[designId] || DESIGN_PRESETS[designId] || DESIGN_PRESETS['executive-spine'];
}

export const DENSITY_ASSETS: Record<DensityChoice, DensityAsset> = {
  compact: {
    id: 'compact',
    labelKey: 'compact',
    description: 'Tight margins',
    paddingScale: 0.78,
  },
  standard: {
    id: 'standard',
    labelKey: 'standard',
    description: 'Balanced',
    paddingScale: 1,
  },
  generous: {
    id: 'generous',
    labelKey: 'generous',
    description: 'Airy spacing',
    paddingScale: 1.22,
  },
};

export const HEADER_ACCENT_ASSETS: Record<HeaderStyleChoice, HeaderAccentAsset> = {
  'left-bar': {
    id: 'left-bar',
    labelKey: 'left_accent',
  },
  banner: {
    id: 'banner',
    labelKey: 'top_banner',
  },
  minimal: {
    id: 'minimal',
    labelKey: 'minimal',
  },
  classic: {
    id: 'classic',
    labelKey: 'minimal',
  },
};

export const SELECTABLE_HEADER_ACCENTS: HeaderAccentAsset[] = [
  HEADER_ACCENT_ASSETS['left-bar'],
  HEADER_ACCENT_ASSETS.banner,
  HEADER_ACCENT_ASSETS.minimal,
];

export const DEFAULT_STYLE: DocumentStyle = {
  designId: 'executive-spine',
  themeId: 'slate-emerald',
  fontFamily: 'source-serif-4',
  headingFont: 'plus-jakarta-sans',
  bodyFont: 'source-serif-4',
  monoFont: 'jetbrains-mono',
  density: 'standard',
  headerStyle: 'left-bar',
  showWatermarkOrSeal: true,
  paperSize: 'a4',
};

export function inferDesignFromLegacyStyle(style: DocumentStyle): DesignPresetId {
  if (style.designId && style.designId in DESIGN_PRESETS) {
    return style.designId;
  }
  if (style.headerStyle === 'banner') return 'modern-banner';
  if (style.headerStyle === 'classic') return 'editorial-serif';
  if (style.headerStyle === 'minimal') return 'swiss-grid';
  return 'executive-spine';
}

export function getPaperLayout(
  paperOrId: PaperSizeId | PaperSizeSpec = 'a4',
  density: DensityChoice = 'standard',
  customDimensions?: CustomPaperDimensions
): DocumentLayoutTokens {
  const paper =
    typeof paperOrId === 'string'
      ? resolvePaperSizeSpec(paperOrId, customDimensions)
      : paperOrId;
  const densityAsset = DENSITY_ASSETS[density] || DENSITY_ASSETS.standard;

  const isUltraNarrow = paper.widthPx < 490;
  const isCompact = paper.widthPx < 640;
  const isLarge = paper.widthPx >= 950;
  const isShort = paper.heightPx < 1075;
  const isTall = paper.heightPx >= 1250;
  const isLandscape = paper.widthPx > paper.heightPx;
  const scaleFactor = Math.max(0.25, paper.widthPx / 794);

  const minDimPx = Math.min(paper.widthPx, paper.heightPx);
  const basePadding =
    minDimPx < 40
      ? 0
      : minDimPx < 140
      ? Math.max(2, Math.round(minDimPx * 0.04))
      : paper.widthPx < 360
      ? Math.max(6, Math.round(paper.widthPx * 0.045))
      : Math.min(96, Math.max(16, Math.round(paper.widthPx * 0.056)));
  const paddingPx = minDimPx < 40 ? 0 : Math.max(2, Math.round(basePadding * densityAsset.paddingScale));

  return {
    paper,
    isCompact,
    isUltraNarrow,
    isShort,
    isTall,
    isLarge,
    isLandscape,
    scaleFactor,
    paddingPx,
    headerMbClass: isUltraNarrow
      ? 'mb-3'
      : isCompact
      ? 'mb-4'
      : isShort
      ? 'mb-5'
      : isTall
      ? 'mb-8'
      : isLarge
      ? 'mb-10'
      : 'mb-7',
    sectionMbClass: isUltraNarrow
      ? 'mb-3'
      : isCompact
      ? 'mb-4'
      : isShort
      ? 'mb-5'
      : isTall
      ? 'mb-8'
      : isLarge
      ? 'mb-9'
      : 'mb-6',
    itemGapClass: isUltraNarrow
      ? 'space-y-2.5'
      : isCompact
      ? 'space-y-3'
      : isShort
      ? 'space-y-3.5'
      : isTall
      ? 'space-y-6'
      : isLarge
      ? 'space-y-7'
      : 'space-y-5',
    titleSizeClass: isUltraNarrow
      ? 'text-lg'
      : isCompact
      ? 'text-xl'
      : isLarge
      ? 'text-4xl'
      : 'text-3xl',
    subtitleSizeClass: isUltraNarrow
      ? 'text-[11px]'
      : isCompact
      ? 'text-xs'
      : isLarge
      ? 'text-xl'
      : 'text-base',
    bodySizeClass: isUltraNarrow
      ? 'text-[10.5px] leading-snug'
      : isCompact
      ? 'text-[11px] leading-relaxed'
      : isTall
      ? 'text-sm leading-7'
      : isLarge
      ? 'text-base leading-relaxed'
      : 'text-sm leading-relaxed',
    metaSizeClass: isUltraNarrow
      ? 'text-[9.5px]'
      : isCompact
      ? 'text-[10px]'
      : isLarge
      ? 'text-sm'
      : 'text-xs',
    smallSizeClass: isUltraNarrow
      ? 'text-[8.5px]'
      : isCompact
      ? 'text-[9.5px]'
      : isLarge
      ? 'text-xs'
      : 'text-[11px]',
    accentBarWidthClass: isCompact ? 'w-1.5' : isLarge ? 'w-3.5' : 'w-2.5',
    accentBannerHeightClass: isCompact ? 'h-2' : isLarge ? 'h-4' : 'h-3',
    tableTextClass: isUltraNarrow
      ? 'text-[9px]'
      : isCompact
      ? 'text-[10px]'
      : isLarge
      ? 'text-sm'
      : 'text-xs',
    tableCellPaddingClass: isUltraNarrow
      ? 'py-1.5 px-1.5'
      : isCompact
      ? 'py-2 px-2'
      : isTall || isLarge
      ? 'py-4 px-3'
      : 'py-3 px-3',
    tableHeaderPaddingClass: isCompact ? 'py-2 px-2' : 'py-2.5 px-3',
  };
}

/**
 * Picks up the selected design composition, theme/custom palette, Google Font roles,
 * paper dimensions (including responsive custom paper sizes), and layout tokens into
 * a single mountable bundle consumed by all document templates.
 */
export function resolveDocumentAssets(style: DocumentStyle): DocumentAssetBundle {
  const designId = inferDesignFromLegacyStyle(style);
  const design = DESIGN_PRESETS[designId] || DESIGN_PRESETS['executive-spine'];

  const theme =
    style.themeId === 'custom' && style.customPalette
      ? buildThemeFromCustomPalette(style.customPalette)
      : COLOR_THEME_ASSETS[
          (style.themeId !== 'custom' ? style.themeId : design.defaultThemeId) || 'slate-emerald'
        ] || COLOR_THEME_ASSETS['slate-emerald'];

  const bodyFontAsset = resolveGoogleFontAsset(style.bodyFont || style.fontFamily || design.defaultBodyFont);
  const headingFontAsset = resolveGoogleFontAsset(style.headingFont || design.defaultHeadingFont);
  const monoFontAsset = resolveGoogleFontAsset(style.monoFont || design.defaultMonoFont);

  const paper = resolvePaperSizeSpec(style.paperSize || 'a4', style.customPaperSize);
  const density = DENSITY_ASSETS[style.density || design.density] || DENSITY_ASSETS.standard;
  const headerAccent =
    HEADER_ACCENT_ASSETS[style.headerStyle || design.headerStyle] || HEADER_ACCENT_ASSETS['left-bar'];
  const layout = getPaperLayout(paper, density.id);

  return {
    style: {
      ...style,
      designId,
    },
    design,
    theme,
    font: bodyFontAsset,
    typography: {
      heading: headingFontAsset,
      body: bodyFontAsset,
      mono: monoFontAsset,
    },
    paper,
    density,
    headerAccent,
    layout,
  };
}

import {
  ColorTheme,
  ColorThemeId,
  DensityAsset,
  DensityChoice,
  DocumentAssetBundle,
  DocumentLayoutTokens,
  DocumentStyle,
  FontAsset,
  FontFamilyChoice,
  HeaderAccentAsset,
  HeaderStyleChoice,
  PaperSizeId,
  PaperSizeSpec,
} from '../types/document';

export const PAPER_SIZE_ASSETS: Record<PaperSizeId, PaperSizeSpec> = {
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
  },
};

export const COLOR_THEME_ASSETS: Record<ColorThemeId, ColorTheme> = {
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

export const FONT_ASSETS: Record<FontFamilyChoice, FontAsset> = {
  'source-serif': {
    id: 'source-serif',
    name: 'Source Serif 4',
    description: 'Crisp, balanced humanist serif for high legibility.',
    cssClass: 'font-serif-reading',
    previewClass: 'font-serif-reading',
  },
  lora: {
    id: 'lora',
    name: 'Lora',
    description: 'Literary contemporary serif with graceful curves.',
    cssClass: 'font-serif-lora',
    previewClass: 'font-serif-lora',
  },
};

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
    paddingScale: 1.25,
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
  themeId: 'slate-emerald',
  fontFamily: 'source-serif',
  density: 'standard',
  headerStyle: 'left-bar',
  showWatermarkOrSeal: true,
  paperSize: 'a4',
};

export function getPaperLayout(
  paperSize: PaperSizeId = 'a4',
  density: DensityChoice = 'standard'
): DocumentLayoutTokens {
  const paper = PAPER_SIZE_ASSETS[paperSize] || PAPER_SIZE_ASSETS.a4;
  const densityAsset = DENSITY_ASSETS[density] || DENSITY_ASSETS.standard;
  const isCompact = paper.id === 'a5';
  const isShort = paper.id === 'letter';
  const isTall = paper.id === 'legal';
  const isLarge = paper.id === 'a3';

  const basePadding = isCompact
    ? 28
    : isLarge
    ? 64
    : isShort
    ? 40
    : isTall
    ? 48
    : 46;

  const paddingPx = Math.round(basePadding * densityAsset.paddingScale);

  return {
    paper,
    isCompact,
    isShort,
    isTall,
    isLarge,
    paddingPx,
    headerMbClass: isCompact ? 'mb-4' : isShort ? 'mb-5' : isTall ? 'mb-8' : isLarge ? 'mb-10' : 'mb-7',
    sectionMbClass: isCompact ? 'mb-4' : isShort ? 'mb-5' : isTall ? 'mb-8' : isLarge ? 'mb-9' : 'mb-6',
    itemGapClass: isCompact ? 'space-y-3' : isShort ? 'space-y-3.5' : isTall ? 'space-y-6' : isLarge ? 'space-y-7' : 'space-y-5',
    titleSizeClass: isCompact ? 'text-xl' : isLarge ? 'text-4xl' : 'text-3xl',
    subtitleSizeClass: isCompact ? 'text-xs' : isLarge ? 'text-xl' : 'text-base',
    bodySizeClass: isCompact
      ? 'text-[11px] leading-relaxed'
      : isTall
      ? 'text-sm leading-7'
      : isLarge
      ? 'text-base leading-relaxed'
      : 'text-sm leading-relaxed',
    metaSizeClass: isCompact ? 'text-[10px]' : isLarge ? 'text-sm' : 'text-xs',
    smallSizeClass: isCompact ? 'text-[9.5px]' : isLarge ? 'text-xs' : 'text-[11px]',
    accentBarWidthClass: isCompact ? 'w-1.5' : isLarge ? 'w-3.5' : 'w-2.5',
    accentBannerHeightClass: isCompact ? 'h-2' : isLarge ? 'h-4' : 'h-3',
    tableTextClass: isCompact ? 'text-[10px]' : isLarge ? 'text-sm' : 'text-xs',
    tableCellPaddingClass: isCompact
      ? 'py-2 px-2'
      : isTall || isLarge
      ? 'py-4 px-3'
      : 'py-3 px-3',
    tableHeaderPaddingClass: isCompact ? 'py-2 px-2' : 'py-2.5 px-3',
  };
}

/**
 * Picks up the selected common assets (theme colors, font family, paper dimensions,
 * spacing density, header accent motif, and paper-responsive layout tokens) into
 * a single mountable bundle consumed by all document templates.
 */
export function resolveDocumentAssets(style: DocumentStyle): DocumentAssetBundle {
  const theme = COLOR_THEME_ASSETS[style.themeId] || COLOR_THEME_ASSETS['slate-emerald'];
  const font = FONT_ASSETS[style.fontFamily] || FONT_ASSETS['source-serif'];
  const paper = PAPER_SIZE_ASSETS[style.paperSize] || PAPER_SIZE_ASSETS.a4;
  const density = DENSITY_ASSETS[style.density] || DENSITY_ASSETS.standard;
  const headerAccent = HEADER_ACCENT_ASSETS[style.headerStyle] || HEADER_ACCENT_ASSETS['left-bar'];
  const layout = getPaperLayout(paper.id, density.id);

  return {
    style,
    theme,
    font,
    paper,
    density,
    headerAccent,
    layout,
  };
}

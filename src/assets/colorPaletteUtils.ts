import { ColorTheme, CustomColorPalette } from '../types/document';

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function normalizeHex(input: string, fallback = '#059669'): string {
  const cleaned = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const [r, g, b] = cleaned.split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = normalizeHex(hex);
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const lig = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hue < 60) [r1, g1, b1] = [c, x, 0];
  else if (hue < 120) [r1, g1, b1] = [x, c, 0];
  else if (hue < 180) [r1, g1, b1] = [0, c, x];
  else if (hue < 240) [r1, g1, b1] = [0, x, c];
  else if (hue < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function ensureReadableOnWhite(hex: string, maxLuminance = 0.28): string {
  const lum = getRelativeLuminance(hex);
  if (lum <= maxLuminance) return hex;
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  return hslToHex(h, clamp(s, 20, 85), Math.min(l, 32));
}

function mixWithWhite(hex: string, weight = 0.92): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r * (1 - weight) + 255 * weight,
    g * (1 - weight) + 255 * weight,
    b * (1 - weight) + 255 * weight
  );
}

export function buildThemeFromCustomPalette(custom: CustomColorPalette): ColorTheme {
  const primary = normalizeHex(custom.primary, '#0f766e');
  const secondary = normalizeHex(custom.secondary, '#0284c7');
  const textHeader = ensureReadableOnWhite(normalizeHex(custom.textHeader, '#0f172a'), 0.22);

  const { r, g, b } = hexToRgb(primary);
  const { h, s, l } = rgbToHsl(r, g, b);

  const primaryDark = hslToHex(h, clamp(s + 6, 20, 90), clamp(l - 18, 14, 28));
  const primaryLight = mixWithWhite(primary, 0.93);
  const badgeBg = mixWithWhite(primary, 0.85);
  const badgeText = ensureReadableOnWhite(primaryDark, 0.2);
  const accent = ensureReadableOnWhite(secondary, 0.32);
  const border = mixWithWhite(primary, 0.72);

  return {
    id: 'custom',
    name: custom.name || 'Custom Palette',
    primary,
    primaryDark,
    primaryLight,
    secondary,
    accent,
    border,
    textHeader,
    tagColor: ensureReadableOnWhite(primary, 0.28),
    badgeBg,
    badgeText,
  };
}

const HARMONY_LABELS = [
  'Nordic Mineral',
  'Oceanic Ink',
  'Terracotta Slate',
  'Alpine Pine',
  'Royal Indigo',
  'Burgundy Graphite',
  'Aegean Teal',
  'Bronze Cedar',
  'Plum Cobalt',
  'Midnight Sage',
];

export function generateRandomCustomPalette(): CustomColorPalette {
  const baseHue = Math.floor(Math.random() * 360);
  const strategyRoll = Math.random();

  // Pick harmonious secondary hue offset (analogous, split-complementary, or triadic)
  const hueOffset =
    strategyRoll < 0.35
      ? 35 + Math.floor(Math.random() * 25)
      : strategyRoll < 0.7
      ? 145 + Math.floor(Math.random() * 35)
      : 205 + Math.floor(Math.random() * 30);

  const primarySat = 52 + Math.floor(Math.random() * 28); // 52-80%
  const primaryLig = 30 + Math.floor(Math.random() * 14); // 30-44% (rich, readable on white)

  const secondarySat = 48 + Math.floor(Math.random() * 28);
  const secondaryLig = 34 + Math.floor(Math.random() * 14);

  const primary = hslToHex(baseHue, primarySat, primaryLig);
  const secondary = hslToHex(baseHue + hueOffset, secondarySat, secondaryLig);
  // Crisp dark tinted neutral for document headings
  const textHeader = hslToHex(baseHue, 18 + Math.floor(Math.random() * 12), 11 + Math.floor(Math.random() * 6));

  const label = HARMONY_LABELS[Math.floor(Math.random() * HARMONY_LABELS.length)];

  return {
    name: label,
    primary,
    secondary,
    textHeader,
  };
}

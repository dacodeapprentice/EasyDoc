import React, { useEffect, useRef, useState } from 'react';
import {
  CustomColorPalette,
  DesignPresetId,
  DocumentStyle,
  DocumentType,
  GoogleFontId,
  LanguageCode,
  PaperSizeId,
} from '../types/document';
import {
  COLOR_THEME_ASSETS,
  DEFAULT_CUSTOM_PAPER,
  DESIGN_PRESET_LIST,
  GOOGLE_FONT_ASSETS,
  getDocTypeDesignMeta,
  getPaperSizesForDocType,
  inferDesignFromLegacyStyle,
  isPaperDimRecommended,
  resolveDocumentAssets,
  sanitizeCustomPaperMm,
} from '../assets/documentAssets';
import { generateRandomCustomPalette, normalizeHex } from '../assets/colorPaletteUtils';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  History,
  Maximize,
  Palette,
  Shuffle,
  Sliders,
  Type,
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface StyleCustomizerProps {
  docType: DocumentType;
  style: DocumentStyle;
  onChange: (updated: DocumentStyle) => void;
  hasPickedDesign: boolean;
  onSelectDesign: () => void;
  lang?: LanguageCode;
}

type FontTargetMode = 'all' | 'heading' | 'body' | 'mono';

const PALETTE_HISTORY_STORAGE_KEY = 'easydoc_palette_history_v1';
const MAX_PALETTE_HISTORY = 15;

function paletteKey(p: CustomColorPalette): string {
  return `${normalizeHex(p.primary)}|${normalizeHex(p.secondary)}|${normalizeHex(p.textHeader)}`;
}

function loadSavedPaletteHistory(): CustomColorPalette[] {
  try {
    const raw = localStorage.getItem(PALETTE_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomColorPalette =>
        Boolean(item) &&
        typeof item.primary === 'string' &&
        typeof item.secondary === 'string' &&
        typeof item.textHeader === 'string'
    );
  } catch {
    return [];
  }
}

function persistPaletteHistory(history: CustomColorPalette[]): void {
  try {
    localStorage.setItem(PALETTE_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage quota errors
  }
}

function formatUnitValue(mm: number, unit: 'mm' | 'in' | 'px'): string {
  if (unit === 'in') return String(Number((mm / 25.4).toFixed(2)));
  if (unit === 'px') return String(Math.round((mm / 25.4) * 96));
  return String(Math.round(mm * 10) / 10);
}

function parseUnitToMm(raw: string, unit: 'mm' | 'in' | 'px'): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  if (unit === 'in') return parsed * 25.4;
  if (unit === 'px') return (parsed / 96) * 25.4;
  return parsed;
}

const MinimalDesignIllustration: React.FC<{
  docType: DocumentType;
  designId: DesignPresetId;
  primaryColor: string;
  tintColor: string;
  inkColor: string;
}> = ({ docType, designId, primaryColor, tintColor, inkColor }) => {
  if (docType === 'letter') {
    switch (designId) {
      case 'executive-spine':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="3.5" height="77" rx="1" fill={primaryColor} />
            <rect x="9" y="8" width="22" height="3.5" rx="1" fill={inkColor} />
            <rect x="38" y="9" width="14" height="1.5" rx="0.75" fill="#cbd5e1" />
            <rect x="38" y="12.5" width="14" height="1.5" rx="0.75" fill="#e2e8f0" />
            <line x1="9" y1="19" x2="52" y2="19" stroke="#e4e4e7" strokeWidth="1" />
            <rect x="9" y="23" width="14" height="2" rx="1" fill="#94a3b8" />
            <rect x="9" y="28" width="20" height="2" rx="1" fill={inkColor} opacity="0.75" />
            <rect x="9" y="34" width="43" height="4.5" rx="1" fill={tintColor} stroke={primaryColor} strokeWidth="0.6" />
            <rect x="9" y="43" width="43" height="2" rx="1" fill="#cbd5e1" />
            <rect x="9" y="47" width="40" height="2" rx="1" fill="#e2e8f0" />
            <rect x="9" y="51" width="42" height="2" rx="1" fill="#cbd5e1" />
            <rect x="9" y="55" width="34" height="2" rx="1" fill="#e2e8f0" />
            <rect x="9" y="65" width="16" height="2.5" rx="1" fill={inkColor} />
          </svg>
        );
      case 'modern-banner':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="57" height="3.5" rx="1" fill={primaryColor} />
            <rect x="6" y="7.5" width="48" height="13" rx="2" fill={tintColor} />
            <rect x="10" y="11" width="22" height="3" rx="1" fill={inkColor} />
            <rect x="10" y="16" width="14" height="1.5" rx="0.75" fill={primaryColor} />
            <rect x="6" y="24" width="26" height="9" rx="1.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="34" y="24" width="20" height="9" rx="1.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="6" y="36" width="48" height="4.5" rx="1" fill={tintColor} />
            <rect x="6" y="44" width="48" height="2" rx="1" fill="#cbd5e1" />
            <rect x="6" y="48" width="44" height="2" rx="1" fill="#e2e8f0" />
            <rect x="6" y="52" width="46" height="2" rx="1" fill="#cbd5e1" />
            <rect x="6" y="56" width="38" height="2" rx="1" fill="#e2e8f0" />
            <rect x="6" y="65" width="16" height="2.5" rx="1" fill={inkColor} />
          </svg>
        );
      case 'editorial-serif':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <line x1="2" y1="2.5" x2="58" y2="2.5" stroke={primaryColor} strokeWidth="1.5" />
            <line x1="2" y1="77.5" x2="58" y2="77.5" stroke={primaryColor} strokeWidth="1.5" />
            <rect x="18" y="8" width="24" height="3" rx="1" fill={inkColor} />
            <rect x="14" y="13" width="32" height="1.5" rx="0.75" fill="#cbd5e1" />
            <line x1="10" y1="18" x2="50" y2="18" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="10" y="22" width="16" height="2" rx="1" fill="#94a3b8" />
            <rect x="10" y="26" width="20" height="2" rx="1" fill={inkColor} opacity="0.75" />
            <line x1="10" y1="32" x2="50" y2="32" stroke="#cbd5e1" strokeWidth="0.8" />
            <rect x="15" y="34.5" width="30" height="2" rx="1" fill={primaryColor} />
            <line x1="10" y1="39" x2="50" y2="39" stroke="#cbd5e1" strokeWidth="0.8" />
            <rect x="10" y="44" width="40" height="2" rx="1" fill="#cbd5e1" />
            <rect x="10" y="48" width="38" height="2" rx="1" fill="#e2e8f0" />
            <rect x="10" y="52" width="40" height="2" rx="1" fill="#cbd5e1" />
            <rect x="10" y="56" width="30" height="2" rx="1" fill="#e2e8f0" />
            <rect x="10" y="65" width="16" height="2.5" rx="1" fill={inkColor} />
          </svg>
        );
      case 'split-sidebar':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="20" height="77" rx="2" fill={tintColor} />
            <line x1="21.5" y1="1.5" x2="21.5" y2="78.5" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="5" y="10" width="13" height="3" rx="1" fill={inkColor} />
            <rect x="5" y="15" width="10" height="1.5" rx="0.75" fill={primaryColor} />
            <rect x="5" y="23" width="12" height="1.5" rx="0.75" fill="#94a3b8" />
            <rect x="5" y="27" width="11" height="1.5" rx="0.75" fill="#94a3b8" />
            <rect x="5" y="31" width="12" height="1.5" rx="0.75" fill="#94a3b8" />
            <rect x="26" y="10" width="12" height="1.5" rx="0.75" fill="#94a3b8" />
            <rect x="26" y="15" width="18" height="2" rx="1" fill={inkColor} opacity="0.8" />
            <rect x="26" y="21" width="28" height="4" rx="1" fill={tintColor} stroke={primaryColor} strokeWidth="0.6" />
            <rect x="26" y="30" width="28" height="2" rx="1" fill="#cbd5e1" />
            <rect x="26" y="34" width="26" height="2" rx="1" fill="#e2e8f0" />
            <rect x="26" y="38" width="28" height="2" rx="1" fill="#cbd5e1" />
            <rect x="26" y="42" width="24" height="2" rx="1" fill="#e2e8f0" />
            <rect x="26" y="54" width="14" height="2.5" rx="1" fill={inkColor} />
          </svg>
        );
      case 'swiss-grid':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="57" height="2.5" fill={inkColor} />
            <rect x="6" y="8" width="24" height="3.5" fill={inkColor} />
            <rect x="38" y="9" width="16" height="2" fill="#cbd5e1" />
            <line x1="6" y1="16" x2="54" y2="16" stroke={inkColor} strokeWidth="1" />
            <line x1="6" y1="22" x2="20" y2="22" stroke={inkColor} strokeWidth="0.9" />
            <rect x="6" y="25" width="12" height="2" fill="#94a3b8" />
            <line x1="6" y1="32" x2="20" y2="32" stroke={inkColor} strokeWidth="0.9" />
            <rect x="6" y="35" width="14" height="2" fill={inkColor} />
            <rect x="6" y="39" width="12" height="1.5" fill="#cbd5e1" />
            <line x1="6" y1="46" x2="20" y2="46" stroke={inkColor} strokeWidth="0.9" />
            <rect x="6" y="49" width="14" height="2" fill={primaryColor} />
            <rect x="24" y="22" width="30" height="2" fill="#cbd5e1" />
            <rect x="24" y="26" width="28" height="2" fill="#e2e8f0" />
            <rect x="24" y="30" width="30" height="2" fill="#cbd5e1" />
            <rect x="24" y="34" width="26" height="2" fill="#e2e8f0" />
            <rect x="24" y="42" width="28" height="2" fill="#cbd5e1" />
            <rect x="24" y="46" width="24" height="2" fill="#e2e8f0" />
            <rect x="24" y="56" width="16" height="2.5" fill={inkColor} />
          </svg>
        );
    }
  }

  if (docType === 'census') {
    switch (designId) {
      case 'executive-spine':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="3.5" height="77" rx="1" fill={primaryColor} />
            <rect x="9" y="8" width="24" height="3.5" rx="1" fill={inkColor} />
            <rect x="42" y="8" width="10" height="3.5" rx="1.5" fill={tintColor} stroke={primaryColor} strokeWidth="0.6" />
            <rect x="9" y="17" width="44" height="15" rx="2" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.9" />
            <rect x="12" y="20" width="14" height="2" rx="0.75" fill="#94a3b8" />
            <rect x="30" y="20" width="18" height="2" rx="0.75" fill="#94a3b8" />
            <rect x="12" y="25" width="36" height="2" rx="0.75" fill="#cbd5e1" />
            <rect x="9" y="37" width="44" height="4" rx="0.5" fill="#f1f5f9" />
            <line x1="9" y1="45" x2="53" y2="45" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="9" y1="50" x2="53" y2="50" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="9" y1="55" x2="53" y2="55" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="9" y="61" width="44" height="6" rx="1" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.7" />
          </svg>
        );
      case 'modern-banner':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="57" height="3.5" rx="1" fill={primaryColor} />
            <rect x="6" y="7.5" width="48" height="11" rx="2" fill={tintColor} />
            <rect x="9" y="11" width="24" height="3" rx="1" fill={inkColor} />
            <rect x="6" y="21" width="10.5" height="6" rx="1" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.7" />
            <rect x="18.5" y="21" width="10.5" height="6" rx="1" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.7" />
            <rect x="31" y="21" width="10.5" height="6" rx="1" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.7" />
            <rect x="43.5" y="21" width="10.5" height="6" rx="1" fill={tintColor} stroke={primaryColor} strokeWidth="0.6" />
            <rect x="6" y="30" width="48" height="10" rx="1.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="6" y="44" width="48" height="4.5" rx="0.5" fill={tintColor} />
            <line x1="6" y1="52.5" x2="54" y2="52.5" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="6" y1="57.5" x2="54" y2="57.5" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="6" y1="62.5" x2="54" y2="62.5" stroke="#e2e8f0" strokeWidth="0.8" />
          </svg>
        );
      case 'editorial-serif':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <line x1="2" y1="2.5" x2="58" y2="2.5" stroke={primaryColor} strokeWidth="1.5" />
            <line x1="2" y1="77.5" x2="58" y2="77.5" stroke={primaryColor} strokeWidth="1.5" />
            <rect x="16" y="8" width="28" height="3" rx="1" fill={inkColor} />
            <rect x="22" y="13" width="16" height="2.5" rx="1" fill={tintColor} />
            <line x1="8" y1="19" x2="52" y2="19" stroke="#cbd5e1" strokeWidth="0.9" />
            <rect x="10" y="22" width="18" height="2" rx="1" fill="#94a3b8" />
            <rect x="32" y="22" width="18" height="2" rx="1" fill="#94a3b8" />
            <rect x="10" y="27" width="38" height="2" rx="1" fill="#cbd5e1" />
            <line x1="8" y1="32" x2="52" y2="32" stroke="#cbd5e1" strokeWidth="0.9" />
            <rect x="8" y="37" width="44" height="4" fill="#f1f5f9" />
            <line x1="8" y1="45" x2="52" y2="45" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="8" y1="50" x2="52" y2="50" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="8" y1="55" x2="52" y2="55" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="8" y="65" width="16" height="2.5" rx="1" fill={inkColor} />
            <rect x="36" y="65" width="16" height="2.5" rx="1" fill="#cbd5e1" />
          </svg>
        );
      case 'split-sidebar':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="20" height="77" rx="2" fill={tintColor} />
            <line x1="21.5" y1="1.5" x2="21.5" y2="78.5" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="5" y="8" width="13" height="3" rx="1" fill={inkColor} />
            <rect x="5" y="13" width="11" height="2.5" rx="1" fill={primaryColor} />
            <rect x="5" y="21" width="12" height="1.5" rx="0.75" fill="#64748b" />
            <rect x="5" y="26" width="10" height="1.5" rx="0.75" fill="#94a3b8" />
            <rect x="5" y="64" width="13" height="4" rx="1" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.7" />
            <rect x="26" y="9" width="28" height="14" rx="1" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.7" />
            <rect x="26" y="28" width="28" height="4" fill="#f1f5f9" />
            <line x1="26" y1="36" x2="54" y2="36" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="26" y1="41" x2="54" y2="41" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="26" y1="46" x2="54" y2="46" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="26" y="54" width="28" height="8" rx="1" fill="#f8fafc" />
          </svg>
        );
      case 'swiss-grid':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="57" height="2.5" fill={inkColor} />
            <rect x="6" y="8" width="26" height="3.5" fill={inkColor} />
            <rect x="42" y="8" width="12" height="3" fill={tintColor} />
            <line x1="6" y1="15" x2="54" y2="15" stroke={inkColor} strokeWidth="1" />
            <line x1="6" y1="20" x2="18" y2="20" stroke={inkColor} strokeWidth="0.9" />
            <rect x="6" y="23" width="10" height="2" fill={inkColor} />
            <rect x="22" y="20" width="32" height="10" fill="#f8fafc" />
            <line x1="6" y1="36" x2="18" y2="36" stroke={inkColor} strokeWidth="0.9" />
            <rect x="6" y="39" width="11" height="2" fill={inkColor} />
            <rect x="22" y="36" width="32" height="3.5" fill="#f1f5f9" />
            <line x1="22" y1="43" x2="54" y2="43" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="22" y1="48" x2="54" y2="48" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="6" y1="56" x2="18" y2="56" stroke={inkColor} strokeWidth="0.9" />
            <rect x="22" y="56" width="32" height="7" fill="#f8fafc" />
          </svg>
        );
    }
  }

  if (docType === 'receipt') {
    switch (designId) {
      case 'executive-spine':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="3.5" height="77" rx="1" fill={primaryColor} />
            <rect x="9" y="8" width="22" height="3.5" rx="1" fill={inkColor} />
            <rect x="40" y="8" width="12" height="3.5" rx="1.5" fill={tintColor} />
            <rect x="9" y="17" width="44" height="10" rx="1.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="9" y="31" width="44" height="4" fill="#f1f5f9" />
            <line x1="9" y1="39" x2="53" y2="39" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="9" y1="44" x2="53" y2="44" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="9" y1="49" x2="53" y2="49" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="33" y="54" width="20" height="2" rx="0.75" fill="#cbd5e1" />
            <line x1="33" y1="59" x2="53" y2="59" stroke={primaryColor} strokeWidth="1.5" />
            <rect x="33" y="61.5" width="20" height="3" rx="0.75" fill={inkColor} />
          </svg>
        );
      case 'modern-banner':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="57" height="3.5" rx="1" fill={primaryColor} />
            <rect x="6" y="7.5" width="48" height="12" rx="2" fill={tintColor} />
            <rect x="10" y="11" width="20" height="3" rx="1" fill={inkColor} />
            <rect x="6" y="22" width="26" height="11" rx="1.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="34" y="22" width="20" height="11" rx="1.5" fill={tintColor} stroke={primaryColor} strokeWidth="0.7" />
            <rect x="37" y="26.5" width="14" height="3.5" rx="0.75" fill={inkColor} />
            <rect x="6" y="37" width="48" height="4" fill={tintColor} />
            <line x1="6" y1="45" x2="54" y2="45" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="6" y1="50" x2="54" y2="50" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="6" y1="55" x2="54" y2="55" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="32" y1="62" x2="54" y2="62" stroke={primaryColor} strokeWidth="1.5" />
            <rect x="32" y="64.5" width="22" height="3" rx="0.75" fill={inkColor} />
          </svg>
        );
      case 'editorial-serif':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <line x1="2" y1="2.5" x2="58" y2="2.5" stroke={primaryColor} strokeWidth="1.5" />
            <line x1="2" y1="77.5" x2="58" y2="77.5" stroke={primaryColor} strokeWidth="1.5" />
            <rect x="17" y="8" width="26" height="3" rx="1" fill={inkColor} />
            <rect x="14" y="13" width="32" height="1.5" rx="0.75" fill="#cbd5e1" />
            <line x1="8" y1="18" x2="52" y2="18" stroke="#cbd5e1" strokeWidth="0.9" />
            <rect x="8" y="21" width="18" height="5" rx="1" fill="#f8fafc" />
            <rect x="34" y="21" width="18" height="5" rx="1" fill="#f8fafc" />
            <line x1="8" y1="29" x2="52" y2="29" stroke="#cbd5e1" strokeWidth="0.9" />
            <rect x="8" y="33" width="44" height="4" fill="#f1f5f9" />
            <line x1="8" y1="41" x2="52" y2="41" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="8" y1="46" x2="52" y2="46" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="8" y1="51" x2="52" y2="51" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="30" y1="58" x2="52" y2="58" stroke={primaryColor} strokeWidth="1.4" />
            <rect x="30" y="60.5" width="22" height="3" rx="0.75" fill={inkColor} />
          </svg>
        );
      case 'split-sidebar':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="20" height="77" rx="2" fill={tintColor} />
            <line x1="21.5" y1="1.5" x2="21.5" y2="78.5" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="5" y="9" width="13" height="3" rx="1" fill={inkColor} />
            <rect x="5" y="15" width="11" height="2" rx="1" fill={primaryColor} />
            <rect x="5" y="22" width="12" height="1.5" rx="0.75" fill="#94a3b8" />
            <rect x="5" y="26" width="10" height="1.5" rx="0.75" fill="#94a3b8" />
            <rect x="4" y="61" width="15" height="11" rx="1.5" fill={inkColor} />
            <rect x="6" y="65" width="11" height="3" rx="0.75" fill="#ffffff" />
            <rect x="26" y="10" width="28" height="8" rx="1" fill="#f8fafc" />
            <rect x="26" y="22" width="28" height="4" fill="#f1f5f9" />
            <line x1="26" y1="30" x2="54" y2="30" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="26" y1="35" x2="54" y2="35" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="26" y1="40" x2="54" y2="40" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="36" y1="48" x2="54" y2="48" stroke={primaryColor} strokeWidth="1.4" />
            <rect x="36" y="51" width="18" height="2.5" fill={inkColor} />
          </svg>
        );
      case 'swiss-grid':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="57" height="2.5" fill={inkColor} />
            <rect x="6" y="8" width="22" height="3.5" fill={inkColor} />
            <rect x="38" y="8" width="16" height="4.5" fill={inkColor} />
            <line x1="6" y1="16" x2="54" y2="16" stroke={inkColor} strokeWidth="1" />
            <rect x="6" y="19" width="13" height="6" fill="#f8fafc" />
            <rect x="23" y="19" width="13" height="6" fill="#f8fafc" />
            <rect x="40" y="19" width="14" height="6" fill="#f8fafc" />
            <line x1="6" y1="28" x2="54" y2="28" stroke="#cbd5e1" strokeWidth="0.8" />
            <rect x="6" y="32" width="48" height="3.5" fill="#f1f5f9" />
            <line x1="6" y1="39" x2="54" y2="39" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="6" y1="44" x2="54" y2="44" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="6" y1="49" x2="54" y2="49" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="6" y="55" width="20" height="7" fill="#f8fafc" />
            <line x1="32" y1="59" x2="54" y2="59" stroke={inkColor} strokeWidth="1.4" />
            <rect x="32" y="61.5" width="22" height="3" fill={inkColor} />
          </svg>
        );
    }
  }

  if (docType === 'certificate') {
    switch (designId) {
      case 'executive-spine':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="3.5" height="77" rx="1" fill={primaryColor} />
            <rect x="8" y="6" width="46" height="68" rx="1" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="12" y="11" width="7" height="7" rx="1.5" fill={tintColor} />
            <rect x="22" y="12" width="22" height="3.5" rx="1" fill={inkColor} />
            <rect x="12" y="28" width="16" height="1.5" rx="0.75" fill="#94a3b8" />
            <rect x="12" y="32" width="34" height="5" rx="1" fill={primaryColor} />
            <rect x="12" y="40" width="36" height="2" rx="1" fill="#cbd5e1" />
            <rect x="12" y="45" width="22" height="4" rx="1" fill={tintColor} />
            <line x1="12" y1="63" x2="23" y2="63" stroke="#94a3b8" strokeWidth="1" />
            <line x1="26" y1="63" x2="37" y2="63" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="46" cy="61" r="4.5" fill={tintColor} stroke={primaryColor} strokeWidth="1" />
          </svg>
        );
      case 'modern-banner':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="57" height="4" rx="1" fill={primaryColor} />
            <rect x="1.5" y="75.5" width="57" height="3" rx="1" fill={primaryColor} opacity="0.65" />
            <rect x="7" y="9" width="46" height="16" rx="2" fill={tintColor} />
            <circle cx="30" cy="14" r="3" fill="#ffffff" stroke={primaryColor} strokeWidth="0.9" />
            <rect x="16" y="19.5" width="28" height="3" rx="1" fill={inkColor} />
            <rect x="13" y="34" width="34" height="5" rx="1" fill={primaryColor} />
            <rect x="14" y="42" width="32" height="2" rx="1" fill="#cbd5e1" />
            <rect x="18" y="47" width="24" height="4.5" rx="1" fill={tintColor} />
            <line x1="8" y1="64" x2="20" y2="64" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="30" cy="63" r="4.5" fill={tintColor} stroke={primaryColor} strokeWidth="1" />
            <line x1="40" y1="64" x2="52" y2="64" stroke="#94a3b8" strokeWidth="1" />
          </svg>
        );
      case 'editorial-serif':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="4.5" y="4.5" width="51" height="71" rx="1" fill="none" stroke={primaryColor} strokeWidth="1.2" />
            <rect x="6.5" y="6.5" width="47" height="67" rx="0.5" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx="30" cy="14" r="4" fill={tintColor} stroke={primaryColor} strokeWidth="0.8" />
            <rect x="16" y="21" width="28" height="3" rx="1" fill={inkColor} />
            <rect x="24" y="26" width="12" height="1" rx="0.5" fill={primaryColor} />
            <rect x="13" y="34" width="34" height="5" rx="1" fill={inkColor} />
            <rect x="15" y="42" width="30" height="2" rx="1" fill="#cbd5e1" />
            <rect x="18" y="47" width="24" height="4.5" rx="1" fill={tintColor} />
            <line x1="10" y1="63" x2="21" y2="63" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="30" cy="62" r="4.5" fill={tintColor} stroke={primaryColor} strokeWidth="1" />
            <line x1="39" y1="63" x2="50" y2="63" stroke="#94a3b8" strokeWidth="1" />
          </svg>
        );
      case 'split-sidebar':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="1.5" y="1.5" width="20" height="77" rx="2" fill={tintColor} />
            <line x1="21.5" y1="1.5" x2="21.5" y2="78.5" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="11.5" cy="14" r="5" fill="#ffffff" stroke={primaryColor} strokeWidth="1.1" />
            <rect x="5" y="23" width="13" height="2.5" rx="0.75" fill={inkColor} />
            <circle cx="11.5" cy="58" r="4.5" fill="#ffffff" stroke={primaryColor} strokeWidth="1" />
            <rect x="6" y="66" width="11" height="1.5" rx="0.75" fill="#64748b" />
            <rect x="26" y="12" width="24" height="3.5" rx="1" fill={inkColor} />
            <rect x="26" y="28" width="28" height="5" rx="1" fill={primaryColor} />
            <rect x="26" y="36" width="26" height="2" rx="1" fill="#cbd5e1" />
            <rect x="26" y="42" width="20" height="4.5" rx="1" fill={tintColor} />
            <line x1="26" y1="65" x2="38" y2="65" stroke="#94a3b8" strokeWidth="1" />
            <line x1="42" y1="65" x2="54" y2="65" stroke="#94a3b8" strokeWidth="1" />
          </svg>
        );
      case 'swiss-grid':
        return (
          <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
            <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
            <rect x="5" y="5" width="50" height="70" fill="none" stroke={inkColor} strokeWidth="0.9" />
            <rect x="8" y="10" width="24" height="3.5" fill={inkColor} />
            <circle cx="47" cy="13" r="4" fill={tintColor} stroke={primaryColor} strokeWidth="0.9" />
            <line x1="8" y1="20" x2="52" y2="20" stroke={inkColor} strokeWidth="1" />
            <line x1="8" y1="26" x2="20" y2="26" stroke={inkColor} strokeWidth="0.9" />
            <rect x="8" y="29" width="10" height="2" fill="#94a3b8" />
            <rect x="24" y="26" width="28" height="5" fill={primaryColor} />
            <rect x="24" y="34" width="18" height="4" fill={tintColor} />
            <rect x="24" y="41" width="26" height="2" fill="#cbd5e1" />
            <line x1="8" y1="64" x2="24" y2="64" stroke="#94a3b8" strokeWidth="1" />
            <line x1="36" y1="64" x2="52" y2="64" stroke="#94a3b8" strokeWidth="1" />
          </svg>
        );
    }
  }

  // Default: CV compositions
  switch (designId) {
    case 'executive-spine':
      return (
        <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
          <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
          <rect x="1.5" y="1.5" width="3.5" height="77" rx="1" fill={primaryColor} />
          <rect x="9" y="8" width="24" height="4" rx="1" fill={inkColor} />
          <rect x="9" y="14" width="16" height="2" rx="1" fill={primaryColor} />
          <circle cx="48" cy="12" r="5" fill={tintColor} stroke={primaryColor} strokeWidth="1" />
          <line x1="9" y1="22" x2="52" y2="22" stroke="#e4e4e7" strokeWidth="1" />
          <rect x="9" y="27" width="18" height="2" rx="1" fill={primaryColor} opacity="0.75" />
          <rect x="9" y="32" width="42" height="2" rx="1" fill="#cbd5e1" />
          <rect x="9" y="36" width="36" height="2" rx="1" fill="#e2e8f0" />
          <rect x="9" y="44" width="20" height="2" rx="1" fill={primaryColor} opacity="0.75" />
          <rect x="9" y="49" width="42" height="2" rx="1" fill="#cbd5e1" />
          <rect x="9" y="53" width="32" height="2" rx="1" fill="#e2e8f0" />
          <rect x="9" y="57" width="38" height="2" rx="1" fill="#e2e8f0" />
          <rect x="9" y="65" width="15" height="4" rx="1" fill={tintColor} />
          <rect x="26" y="65" width="15" height="4" rx="1" fill={tintColor} />
        </svg>
      );

    case 'modern-banner':
      return (
        <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
          <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
          <rect x="1.5" y="1.5" width="57" height="3.5" rx="1" fill={primaryColor} />
          <rect x="6" y="8" width="48" height="16" rx="2" fill={tintColor} />
          <rect x="10" y="12" width="22" height="3.5" rx="1" fill={inkColor} />
          <rect x="10" y="17.5" width="14" height="2" rx="1" fill={primaryColor} />
          <rect x="6" y="29" width="3" height="3" rx="0.5" fill={primaryColor} />
          <rect x="11" y="29.5" width="18" height="2" rx="1" fill={inkColor} opacity="0.8" />
          <rect x="6" y="35" width="48" height="11" rx="2" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="10" y="39" width="30" height="2" rx="1" fill="#cbd5e1" />
          <rect x="10" y="42.5" width="22" height="1.5" rx="0.75" fill="#e2e8f0" />
          <rect x="6" y="51" width="3" height="3" rx="0.5" fill={primaryColor} />
          <rect x="11" y="51.5" width="20" height="2" rx="1" fill={inkColor} opacity="0.8" />
          <rect x="6" y="57" width="48" height="2" rx="1" fill="#cbd5e1" />
          <rect x="6" y="61" width="40" height="2" rx="1" fill="#e2e8f0" />
          <rect x="6" y="65" width="44" height="2" rx="1" fill="#e2e8f0" />
        </svg>
      );

    case 'editorial-serif':
      return (
        <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
          <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
          <line x1="2" y1="2.5" x2="58" y2="2.5" stroke={primaryColor} strokeWidth="1.5" />
          <line x1="2" y1="77.5" x2="58" y2="77.5" stroke={primaryColor} strokeWidth="1.5" />
          <rect x="16" y="9" width="28" height="3.5" rx="1" fill={inkColor} />
          <rect x="21" y="14.5" width="18" height="2" rx="1" fill={primaryColor} />
          <rect x="14" y="19" width="32" height="1.5" rx="0.75" fill="#cbd5e1" />
          <line x1="10" y1="24" x2="50" y2="24" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="10" y="29" width="16" height="2" rx="1" fill={primaryColor} opacity="0.8" />
          <rect x="10" y="34" width="40" height="2" rx="1" fill="#cbd5e1" />
          <rect x="10" y="38" width="38" height="2" rx="1" fill="#e2e8f0" />
          <rect x="10" y="42" width="34" height="2" rx="1" fill="#e2e8f0" />
          <rect x="10" y="50" width="18" height="2" rx="1" fill={primaryColor} opacity="0.8" />
          <rect x="10" y="55" width="40" height="2" rx="1" fill="#cbd5e1" />
          <rect x="10" y="59" width="36" height="2" rx="1" fill="#e2e8f0" />
          <rect x="10" y="63" width="30" height="2" rx="1" fill="#e2e8f0" />
        </svg>
      );

    case 'split-sidebar':
      return (
        <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
          <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
          <rect x="1.5" y="1.5" width="20" height="77" rx="2" fill={tintColor} />
          <line x1="21.5" y1="1.5" x2="21.5" y2="78.5" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="11.5" cy="12" r="4.5" fill="#ffffff" stroke={primaryColor} strokeWidth="1.2" />
          <rect x="5" y="20" width="13" height="2.5" rx="1" fill={inkColor} />
          <rect x="5" y="24.5" width="10" height="1.5" rx="0.75" fill={primaryColor} />
          <rect x="5" y="32" width="12" height="1.5" rx="0.75" fill="#94a3b8" />
          <rect x="5" y="36" width="11" height="1.5" rx="0.75" fill="#94a3b8" />
          <rect x="5" y="46" width="13" height="3.5" rx="1" fill="#ffffff" />
          <rect x="5" y="52" width="10" height="3.5" rx="1" fill="#ffffff" />
          <rect x="26" y="10" width="16" height="2.5" rx="1" fill={primaryColor} />
          <rect x="26" y="15" width="28" height="2" rx="1" fill="#cbd5e1" />
          <rect x="26" y="19" width="24" height="2" rx="1" fill="#e2e8f0" />
          <rect x="26" y="28" width="18" height="2.5" rx="1" fill={primaryColor} />
          <rect x="26" y="33" width="28" height="2" rx="1" fill="#cbd5e1" />
          <rect x="26" y="37" width="26" height="2" rx="1" fill="#e2e8f0" />
          <rect x="26" y="41" width="22" height="2" rx="1" fill="#e2e8f0" />
          <rect x="26" y="50" width="16" height="2.5" rx="1" fill={primaryColor} />
          <rect x="26" y="55" width="28" height="2" rx="1" fill="#cbd5e1" />
          <rect x="26" y="59" width="20" height="2" rx="1" fill="#e2e8f0" />
        </svg>
      );

    case 'swiss-grid':
      return (
        <svg viewBox="0 0 60 80" className="w-full h-auto block" aria-hidden="true">
          <rect x="1" y="1" width="58" height="78" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
          <rect x="1.5" y="1.5" width="57" height="2.5" fill={inkColor} />
          <rect x="6" y="9" width="28" height="4" fill={inkColor} />
          <rect x="6" y="15" width="18" height="2" fill={primaryColor} />
          <line x1="6" y1="23" x2="20" y2="23" stroke={inkColor} strokeWidth="1" />
          <rect x="6" y="26" width="12" height="2" fill={inkColor} />
          <rect x="24" y="25" width="30" height="2" fill="#cbd5e1" />
          <rect x="24" y="29" width="26" height="2" fill="#e2e8f0" />
          <line x1="6" y1="38" x2="20" y2="38" stroke={inkColor} strokeWidth="1" />
          <rect x="6" y="41" width="13" height="2" fill={inkColor} />
          <rect x="24" y="40" width="30" height="2" fill="#cbd5e1" />
          <rect x="24" y="44" width="28" height="2" fill="#e2e8f0" />
          <rect x="24" y="48" width="22" height="2" fill="#e2e8f0" />
          <line x1="6" y1="57" x2="20" y2="57" stroke={inkColor} strokeWidth="1" />
          <rect x="6" y="60" width="11" height="2" fill={inkColor} />
          <rect x="24" y="59" width="14" height="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.75" />
          <rect x="40" y="59" width="14" height="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.75" />
        </svg>
      );
  }
};

export const StyleCustomizer: React.FC<StyleCustomizerProps> = ({
  docType,
  style,
  onChange,
  hasPickedDesign,
  onSelectDesign,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const [showCustomPaletteEditor, setShowCustomPaletteEditor] = useState<boolean>(
    style.themeId === 'custom'
  );
  const [fontTargetMode, setFontTargetMode] = useState<FontTargetMode>('all');
  const [paletteHistory, setPaletteHistory] = useState<CustomColorPalette[]>(() =>
    loadSavedPaletteHistory()
  );
  const customCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusedDimFieldRef = useRef<'widthMm' | 'heightMm' | null>(null);

  const resolvedAssets = resolveDocumentAssets(style);
  const activeDesignId = inferDesignFromLegacyStyle(style);
  const activePaperSize = style.paperSize || 'a4';
  const customDims = style.customPaperSize || DEFAULT_CUSTOM_PAPER;
  const activeUnit = customDims.unit || 'mm';
  const docPaperPresets = getPaperSizesForDocType(docType);

  const [widthDraft, setWidthDraft] = useState<string>(() =>
    formatUnitValue(customDims.widthMm, activeUnit)
  );
  const [heightDraft, setHeightDraft] = useState<string>(() =>
    formatUnitValue(customDims.heightMm, activeUnit)
  );

  useEffect(() => {
    if (focusedDimFieldRef.current !== 'widthMm') {
      setWidthDraft(formatUnitValue(customDims.widthMm, activeUnit));
    }
    if (focusedDimFieldRef.current !== 'heightMm') {
      setHeightDraft(formatUnitValue(customDims.heightMm, activeUnit));
    }
  }, [customDims.widthMm, customDims.heightMm, activeUnit]);

  const activePaletteValues: CustomColorPalette =
    style.themeId === 'custom' && style.customPalette
      ? style.customPalette
      : {
          name: resolvedAssets.theme.name,
          primary: resolvedAssets.theme.primary,
          secondary: resolvedAssets.theme.secondary,
          textHeader: resolvedAssets.theme.textHeader,
        };

  const pushToPaletteHistory = (palette: CustomColorPalette) => {
    const normalized: CustomColorPalette = {
      name: palette.name || 'Custom Palette',
      primary: normalizeHex(palette.primary),
      secondary: normalizeHex(palette.secondary),
      textHeader: normalizeHex(palette.textHeader),
    };
    const key = paletteKey(normalized);

    setPaletteHistory((prev) => {
      const next = [normalized, ...prev.filter((item) => paletteKey(item) !== key)].slice(
        0,
        MAX_PALETTE_HISTORY
      );
      persistPaletteHistory(next);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (customCommitTimerRef.current) {
        clearTimeout(customCommitTimerRef.current);
      }
    };
  }, []);

  const handleChooseDesign = (designId: DesignPresetId) => {
    const preset = DESIGN_PRESET_LIST.find((d) => d.id === designId);
    if (!preset) return;

    onChange({
      ...style,
      designId: preset.id,
      headerStyle: preset.headerStyle,
      density: preset.density,
      themeId: style.themeId === 'custom' ? 'custom' : preset.defaultThemeId,
      headingFont: preset.defaultHeadingFont,
      bodyFont: preset.defaultBodyFont,
      monoFont: preset.defaultMonoFont,
      fontFamily: preset.defaultBodyFont,
    });
    onSelectDesign();
  };

  const handleSelectPaperPreset = (paperId: PaperSizeId) => {
    if (paperId === 'custom') {
      const baseCustom = style.customPaperSize || {
        widthMm: resolvedAssets.paper.widthMm,
        heightMm: resolvedAssets.paper.heightMm,
        unit: 'mm' as const,
      };
      const unit = baseCustom.unit || 'mm';
      setWidthDraft(formatUnitValue(baseCustom.widthMm, unit));
      setHeightDraft(formatUnitValue(baseCustom.heightMm, unit));
      onChange({
        ...style,
        paperSize: 'custom',
        customPaperSize: { ...baseCustom, unit },
      });
    } else {
      onChange({ ...style, paperSize: paperId });
    }
  };

  const updateCustomDimension = (field: 'widthMm' | 'heightMm', rawInput: string) => {
    if (field === 'widthMm') {
      setWidthDraft(rawInput);
    } else {
      setHeightDraft(rawInput);
    }

    const mmValue = parseUnitToMm(rawInput, activeUnit);
    if (mmValue === null) return;

    onChange({
      ...style,
      paperSize: 'custom',
      customPaperSize: {
        ...customDims,
        [field]: sanitizeCustomPaperMm(mmValue, customDims[field]),
      },
    });
  };

  const handleToggleUnit = (nextUnit: 'mm' | 'in' | 'px') => {
    focusedDimFieldRef.current = null;
    setWidthDraft(formatUnitValue(customDims.widthMm, nextUnit));
    setHeightDraft(formatUnitValue(customDims.heightMm, nextUnit));
    onChange({
      ...style,
      paperSize: 'custom',
      customPaperSize: {
        ...customDims,
        unit: nextUnit,
      },
    });
  };

  const handleSwapCustomDimensions = () => {
    focusedDimFieldRef.current = null;
    setWidthDraft(formatUnitValue(customDims.heightMm, activeUnit));
    setHeightDraft(formatUnitValue(customDims.widthMm, activeUnit));
    onChange({
      ...style,
      paperSize: 'custom',
      customPaperSize: {
        ...customDims,
        widthMm: customDims.heightMm,
        heightMm: customDims.widthMm,
      },
    });
  };

  const handleRandomPalette = () => {
    // Preserve previous user-customized palette in history before replacing it
    if (style.themeId === 'custom' && style.customPalette) {
      pushToPaletteHistory(style.customPalette);
    }

    const nextPalette = generateRandomCustomPalette();
    pushToPaletteHistory(nextPalette);

    onChange({
      ...style,
      themeId: 'custom',
      customPalette: nextPalette,
    });
  };

  const handleUpdateCustomPaletteColor = (
    field: 'primary' | 'secondary' | 'textHeader',
    val: string
  ) => {
    const base = { ...activePaletteValues, name: 'Custom Palette' };
    const updatedPalette: CustomColorPalette = {
      ...base,
      [field]: normalizeHex(val, base[field]),
    };

    onChange({
      ...style,
      themeId: 'custom',
      customPalette: updatedPalette,
    });

    if (customCommitTimerRef.current) {
      clearTimeout(customCommitTimerRef.current);
    }
    customCommitTimerRef.current = setTimeout(() => {
      pushToPaletteHistory(updatedPalette);
    }, 650);
  };

  const handleApplyHistoryPalette = (preset: CustomColorPalette) => {
    if (style.themeId === 'custom' && style.customPalette) {
      const currentKey = paletteKey(style.customPalette);
      if (currentKey !== paletteKey(preset)) {
        pushToPaletteHistory(style.customPalette);
      }
    }
    onChange({
      ...style,
      themeId: 'custom',
      customPalette: preset,
    });
  };

  const handleClearPaletteHistory = () => {
    setPaletteHistory([]);
    persistPaletteHistory([]);
  };

  const handleSelectGoogleFont = (fontId: GoogleFontId) => {
    if (fontTargetMode === 'all') {
      onChange({
        ...style,
        fontFamily: fontId,
        headingFont: fontId,
        bodyFont: fontId,
        monoFont: fontId,
      });
      return;
    }

    if (fontTargetMode === 'heading') {
      onChange({
        ...style,
        headingFont: fontId,
      });
      return;
    }

    if (fontTargetMode === 'body') {
      onChange({
        ...style,
        fontFamily: fontId,
        bodyFont: fontId,
      });
      return;
    }

    onChange({
      ...style,
      monoFont: fontId,
    });
  };

  const parsedWidthMm = parseUnitToMm(widthDraft, activeUnit);
  const parsedHeightMm = parseUnitToMm(heightDraft, activeUnit);
  const isWidthWarning = parsedWidthMm === null || !isPaperDimRecommended(parsedWidthMm);
  const isHeightWarning = parsedHeightMm === null || !isPaperDimRecommended(parsedHeightMm);
  const hasCustomSizeWarning = isWidthWarning || isHeightWarning;

  const activePaletteKey = paletteKey(activePaletteValues);

  const activeDesignMeta = getDocTypeDesignMeta(docType, resolvedAssets.design.id);

  return (
    <div className="space-y-5 text-xs font-sans-title">
      {/* STEP 1: Horizontal Line of 5 Minimalistic Document Design Illustrations (Adapted to docType) */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="font-semibold text-zinc-700 uppercase tracking-wider text-xs">
            {t('design_choose_title')}
          </span>
          {hasPickedDesign && (
            <span className="text-[11px] font-medium text-blue-600 truncate">
              {t(activeDesignMeta.nameKey)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {DESIGN_PRESET_LIST.map((preset) => {
            const isSelected = activeDesignId === preset.id;
            const docDesignMeta = getDocTypeDesignMeta(docType, preset.id);
            const previewTheme =
              style.themeId === 'custom' && isSelected
                ? resolvedAssets.theme
                : COLOR_THEME_ASSETS[preset.defaultThemeId];

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleChooseDesign(preset.id)}
                title={`${t(docDesignMeta.nameKey)} — ${t(docDesignMeta.descriptionKey)}`}
                aria-pressed={isSelected && hasPickedDesign}
                className={`group flex flex-col items-center p-1.5 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected && hasPickedDesign
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : isSelected
                    ? 'border-zinc-400 bg-zinc-50 hover:border-blue-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/70'
                }`}
              >
                <div className="w-full relative">
                  <MinimalDesignIllustration
                    docType={docType}
                    designId={preset.id}
                    primaryColor={previewTheme.primary}
                    tintColor={previewTheme.primaryLight}
                    inkColor={previewTheme.textHeader}
                  />
                  {isSelected && hasPickedDesign && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-semibold truncate w-full text-center ${
                    isSelected && hasPickedDesign ? 'text-blue-700' : 'text-zinc-700'
                  }`}
                >
                  {t(docDesignMeta.shortLabelKey)}
                </span>
              </button>
            );
          })}
        </div>

        {hasPickedDesign ? (
          <p className="mt-2 text-[11px] text-zinc-500 leading-snug">
            <strong className="text-zinc-800 font-semibold">{t(activeDesignMeta.nameKey)}:</strong>{' '}
            {t(activeDesignMeta.descriptionKey)}
          </p>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-3.5 text-center">
            <p className="text-xs font-medium text-zinc-700">
              {t('design_choose_prompt')}
            </p>
          </div>
        )}
      </div>

      {/* STEP 2: Refinement Settings (Revealed Once a Document Design is Chosen) */}
      {hasPickedDesign && (
        <div className="space-y-5 pt-1">
          {/* 1. Size Choice + Responsive Custom Size (with mm & px display + px unit option) */}
          <div className="pt-4 border-t border-zinc-200">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider">
                <Maximize className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('paper_size_title')}</span>
              </div>
              <span className="text-[10.5px] font-mono-tabular tabular-nums text-zinc-500 truncate">
                {resolvedAssets.paper.dimensionsLabel} · {resolvedAssets.paper.widthPx} × {resolvedAssets.paper.heightPx} px
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {docPaperPresets.map((spec) => {
                const isSelected = activePaperSize === spec.id;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => handleSelectPaperPreset(spec.id)}
                    className={`p-2 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-zinc-900 truncate">{spec.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono-tabular tabular-nums mt-0.5">
                      {spec.dimensionsLabel}
                    </div>
                    <div className="text-[9.5px] text-zinc-400 font-mono-tabular tabular-nums">
                      {spec.widthPx} × {spec.heightPx} px
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleSelectPaperPreset('custom')}
                className={`p-2 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  activePaperSize === 'custom'
                    ? hasCustomSizeWarning
                      ? 'border-red-500 bg-red-50/50 text-red-700'
                      : 'border-blue-600 bg-blue-50/50 text-blue-700'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                }`}
              >
                <div className="text-xs font-semibold text-zinc-900">{t('custom_size')}</div>
                <div
                  className={`text-[10px] font-mono-tabular tabular-nums mt-0.5 ${
                    activePaperSize === 'custom' && hasCustomSizeWarning ? 'text-red-600 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  {activePaperSize === 'custom'
                    ? resolvedAssets.paper.dimensionsLabel
                    : t('custom_size_any')}
                </div>
                <div className="text-[9.5px] text-zinc-400 font-mono-tabular tabular-nums">
                  {activePaperSize === 'custom'
                    ? `${resolvedAssets.paper.widthPx} × ${resolvedAssets.paper.heightPx} px`
                    : t('custom_size_range_hint')}
                </div>
              </button>
            </div>

            {activePaperSize === 'custom' && (
              <div
                className={`mt-2.5 p-3 rounded-xl border space-y-2.5 transition-colors ${
                  hasCustomSizeWarning
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-zinc-200 bg-zinc-50/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-0.5 bg-zinc-200/70 rounded-lg">
                    {(['mm', 'in', 'px'] as const).map((unitOpt) => (
                      <button
                        key={unitOpt}
                        type="button"
                        onClick={() => handleToggleUnit(unitOpt)}
                        className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                          activeUnit === unitOpt
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        {unitOpt}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSwapCustomDimensions}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <ArrowLeftRight className="w-3 h-3 text-zinc-500" />
                    <span>{t('swap_orientation')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      className={`block text-[11px] font-medium mb-1 ${
                        isWidthWarning ? 'text-red-700' : 'text-zinc-600'
                      }`}
                    >
                      {t('width_label')} ({activeUnit})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={widthDraft}
                      aria-invalid={isWidthWarning}
                      onFocus={() => {
                        focusedDimFieldRef.current = 'widthMm';
                      }}
                      onBlur={() => {
                        focusedDimFieldRef.current = null;
                        if (parsedWidthMm !== null) {
                          setWidthDraft(formatUnitValue(sanitizeCustomPaperMm(parsedWidthMm, customDims.widthMm), activeUnit));
                        }
                      }}
                      onChange={(e) => updateCustomDimension('widthMm', e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs font-mono-tabular tabular-nums border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        isWidthWarning
                          ? 'border-red-500 bg-red-50/80 text-red-900 focus:ring-red-500'
                          : 'border-zinc-200 bg-white text-zinc-900 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-[11px] font-medium mb-1 ${
                        isHeightWarning ? 'text-red-700' : 'text-zinc-600'
                      }`}
                    >
                      {t('height_label')} ({activeUnit})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={heightDraft}
                      aria-invalid={isHeightWarning}
                      onFocus={() => {
                        focusedDimFieldRef.current = 'heightMm';
                      }}
                      onBlur={() => {
                        focusedDimFieldRef.current = null;
                        if (parsedHeightMm !== null) {
                          setHeightDraft(formatUnitValue(sanitizeCustomPaperMm(parsedHeightMm, customDims.heightMm), activeUnit));
                        }
                      }}
                      onChange={(e) => updateCustomDimension('heightMm', e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs font-mono-tabular tabular-nums border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        isHeightWarning
                          ? 'border-red-500 bg-red-50/80 text-red-900 focus:ring-red-500'
                          : 'border-zinc-200 bg-white text-zinc-900 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                </div>

                {hasCustomSizeWarning && (
                  <p role="alert" className="flex items-start gap-1.5 text-[11px] text-red-600 font-medium leading-snug pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span>{t('custom_size_warning')}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Random Color Palette Maker + Custom Color Palette + Preset History */}
          <div className="pt-4 border-t border-zinc-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('color_palette_maker')}</span>
              </div>

              <button
                type="button"
                onClick={handleRandomPalette}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Shuffle className="w-3 h-3" />
                <span>{t('random_palette')}</span>
              </button>
            </div>

            {/* Active Palette Summary Strip + Custom Toggle */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center -space-x-1 shrink-0">
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: resolvedAssets.theme.primary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: resolvedAssets.theme.secondary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: resolvedAssets.theme.textHeader }}
                  />
                </div>
                <span className="font-semibold text-zinc-900 text-xs truncate">
                  {resolvedAssets.theme.id === 'custom' && resolvedAssets.theme.name === 'Custom Palette'
                    ? t('custom_palette')
                    : resolvedAssets.theme.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomPaletteEditor((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors shrink-0 ${
                  showCustomPaletteEditor || style.themeId === 'custom'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>{t('custom_palette')}</span>
              </button>
            </div>

            {/* Custom Color Palette Pickers */}
            {showCustomPaletteEditor && (
              <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 grid grid-cols-3 gap-2">
                {(
                  [
                    { field: 'primary', label: t('primary_color'), value: activePaletteValues.primary },
                    { field: 'secondary', label: t('secondary_color'), value: activePaletteValues.secondary },
                    { field: 'textHeader', label: t('ink_color'), value: activePaletteValues.textHeader },
                  ] as const
                ).map((item) => (
                  <div key={item.field} className="space-y-1">
                    <label className="block text-[10px] font-semibold text-zinc-600 truncate">
                      {item.label}
                    </label>
                    <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-zinc-200 bg-white cursor-pointer">
                      <input
                        type="color"
                        value={item.value}
                        onChange={(e) => handleUpdateCustomPaletteColor(item.field, e.target.value)}
                        className="w-5 h-5 rounded border-0 bg-transparent p-0 cursor-pointer shrink-0"
                        aria-label={item.label}
                      />
                      <span className="text-[10px] font-mono-tabular text-zinc-700 uppercase truncate">
                        {item.value}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Preset History (Saves user's previous random & custom palettes) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                  <History className="w-3 h-3 text-zinc-400" />
                  <span>{t('preset_history')}</span>
                </div>
                {paletteHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearPaletteHistory}
                    className="text-[10px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    {t('clear_history')}
                  </button>
                )}
              </div>

              {paletteHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 px-3 py-2 text-[11px] text-zinc-500">
                  {t('preset_history_empty')}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-1.5">
                  {paletteHistory.map((hist, idx) => {
                    const histKey = paletteKey(hist);
                    const isSelected = style.themeId === 'custom' && activePaletteKey === histKey;
                    return (
                      <button
                        key={`${histKey}-${idx}`}
                        type="button"
                        onClick={() => handleApplyHistoryPalette(hist)}
                        title={`${!hist.name || hist.name === 'Custom Palette' ? t('custom_palette') : hist.name} (${hist.primary} / ${hist.secondary})`}
                        className={`flex items-center justify-center -space-x-1 py-2 px-1.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50'
                            : 'border-zinc-200 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: hist.primary }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: hist.secondary }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: hist.textHeader }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. Google Fonts Scrollable List (Changes all font styles present in the selected design) */}
          <div className="pt-4 border-t border-zinc-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-700 uppercase tracking-wider">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('google_fonts_title')}</span>
              </div>
            </div>

            {/* Target Scope: All Styles (default) vs individual roles in the design */}
            <div className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-lg">
              {(
                [
                  { id: 'all', label: t('font_target_all') },
                  { id: 'heading', label: t('font_target_heading') },
                  { id: 'body', label: t('font_target_body') },
                  { id: 'mono', label: t('font_target_mono') },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFontTargetMode(mode.id)}
                  className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                    fontTargetMode === mode.id
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-zinc-500 leading-snug">
              {t('google_fonts_hint')}
            </p>

            {/* Scrollable List of Google Fonts */}
            <ul
              role="listbox"
              aria-label={t('google_fonts_title')}
              className="max-h-56 overflow-y-auto custom-scrollbar rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100"
            >
              {Object.values(GOOGLE_FONT_ASSETS).map((fontAsset) => {
                const currentHeadId = resolvedAssets.typography.heading.id;
                const currentBodyId = resolvedAssets.typography.body.id;
                const currentMonoId = resolvedAssets.typography.mono.id;

                const isSelected =
                  fontTargetMode === 'all'
                    ? currentHeadId === fontAsset.id && currentBodyId === fontAsset.id
                    : fontTargetMode === 'heading'
                    ? currentHeadId === fontAsset.id
                    : fontTargetMode === 'body'
                    ? currentBodyId === fontAsset.id
                    : currentMonoId === fontAsset.id;

                return (
                  <li
                    key={fontAsset.id}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => handleSelectGoogleFont(fontAsset.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectGoogleFont(fontAsset.id);
                      }
                    }}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                      isSelected
                        ? 'bg-blue-50/70 text-blue-700'
                        : 'hover:bg-zinc-50 text-zinc-900'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-xs font-semibold truncate"
                        style={{ fontFamily: fontAsset.cssFamily }}
                      >
                        {fontAsset.name}
                      </div>
                      <div
                        className="text-[11px] text-zinc-500 truncate mt-0.5"
                        style={{ fontFamily: fontAsset.cssFamily }}
                      >
                        Ag Bb Cc · 12345
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {fontAsset.category}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

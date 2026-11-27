import jsPDFImport, { jsPDF as jsPDFNamed } from 'jspdf';
import html2canvas from 'html2canvas';
import { EasyDocPdfPayload, PaperSizeSpec } from '../types/document';
import { PAPER_SIZES } from '../data/defaultData';
import { attachHiddenPayloadToJsPdf } from './pdfProjectCodec';
import {
  assignSliceIndex,
  collectPdfTextLayer,
  PdfLinkAnnotation,
  PdfTextRun,
  renderPdfTextLayerForPage,
} from './pdfTextLayer';

// Robust constructor resolution for jsPDF across both ESM and CommonJS bundles
const JsPdfConstructor: any =
  typeof jsPDFNamed === 'function'
    ? jsPDFNamed
    : typeof jsPDFImport === 'function'
    ? jsPDFImport
    : (jsPDFImport as any)?.default && typeof (jsPDFImport as any).default === 'function'
    ? (jsPDFImport as any).default
    : (jsPDFImport as any)?.jsPDF;

export interface PdfLineBox {
  top: number;
  bottom: number;
}

export interface PdfBlockBox {
  id: number;
  parentId: number | null;
  top: number;
  bottom: number;
  keepWithNext: boolean;
  lineBoxes?: PdfLineBox[];
}

export interface PdfPageSlice {
  startY: number;
  endY: number;
  topMarginPx: number;
  bottomMarginPx: number;
}

interface VerticalBackdropBand {
  left: number;
  width: number;
  backgroundColor: string;
  borderRightWidth: number;
  borderRightColor: string;
}

function isDescendantOf(
  candidate: PdfBlockBox,
  ancestorId: number,
  blockById: Map<number, PdfBlockBox>
): boolean {
  let curr = candidate.parentId;
  while (curr !== null) {
    if (curr === ancestorId) return true;
    curr = blockById.get(curr)?.parentId ?? null;
  }
  return false;
}

function isAncestorOf(
  candidate: PdfBlockBox,
  descendantId: number,
  blockById: Map<number, PdfBlockBox>
): boolean {
  const desc = blockById.get(descendantId);
  return desc ? isDescendantOf(desc, candidate.id, blockById) : false;
}

function findPrevBlockBottom(
  targetBlock: PdfBlockBox,
  startY: number,
  blocks: PdfBlockBox[],
  blockById: Map<number, PdfBlockBox>
): number | null {
  let prevBottom: number | null = null;
  for (const b of blocks) {
    if (b.id === targetBlock.id) continue;
    if (isAncestorOf(b, targetBlock.id, blockById)) continue;
    if (b.bottom <= targetBlock.top + 0.5 && b.bottom > startY) {
      if (prevBottom === null || b.bottom > prevBottom) {
        prevBottom = b.bottom;
      }
    }
  }
  return prevBottom;
}

function snapToGapAbove(
  targetBlock: PdfBlockBox,
  startY: number,
  blocks: PdfBlockBox[],
  blockById: Map<number, PdfBlockBox>
): number {
  const prevBottom = findPrevBlockBottom(targetBlock, startY, blocks, blockById);
  if (
    prevBottom !== null &&
    prevBottom < targetBlock.top - 0.5 &&
    targetBlock.top - prevBottom <= 56
  ) {
    return Math.floor((prevBottom + targetBlock.top) / 2);
  }
  return Math.floor(targetBlock.top);
}

function findPrevLineBottom(lines: PdfLineBox[], lineTop: number, startY: number): number | null {
  let prevBottom: number | null = null;
  for (const line of lines) {
    if (line.bottom <= lineTop + 0.5 && line.bottom > startY) {
      if (prevBottom === null || line.bottom > prevBottom) {
        prevBottom = line.bottom;
      }
    }
  }
  return prevBottom;
}

/**
 * Computes non-cutting page slice intervals [startY, endY] in unscaled CSS pixels
 * given measured block rectangles, line boxes for oversized blocks, page height, and margins.
 */
export function computeSmartPageSlices(params: {
  pageHeightPx: number;
  contentBottomPx: number;
  topMarginPx: number;
  bottomMarginPx: number;
  blocks: PdfBlockBox[];
}): PdfPageSlice[] {
  const pageH = Math.max(100, Math.round(params.pageHeightPx));
  const contentBottom = Math.max(1, Math.ceil(params.contentBottomPx));
  const topMargin = Math.max(0, Math.min(Math.floor(pageH * 0.2), Math.round(params.topMarginPx)));
  const bottomMargin = Math.max(0, Math.min(Math.floor(pageH * 0.2), Math.round(params.bottomMarginPx)));

  if (contentBottom <= pageH) {
    return [
      {
        startY: 0,
        endY: contentBottom,
        topMarginPx: 0,
        bottomMarginPx: 0,
      },
    ];
  }

  // Sort outer-before-inner, top-to-bottom
  const sortedBlocks = [...params.blocks].sort((a, b) => {
    if (Math.abs(a.top - b.top) > 0.5) return a.top - b.top;
    return b.bottom - a.bottom;
  });

  const blockById = new Map<number, PdfBlockBox>();
  const hasChildren = new Set<number>();
  for (const b of sortedBlocks) {
    blockById.set(b.id, b);
    if (b.parentId !== null) {
      hasChildren.add(b.parentId);
    }
  }

  const slices: PdfPageSlice[] = [];
  let startY = 0;
  let pageIndex = 0;
  const maxPages = 100;

  while (startY < contentBottom - 1.5 && pageIndex < maxPages) {
    const pageTopMargin = pageIndex === 0 ? 0 : topMargin;
    const usableH = Math.max(40, pageH - pageTopMargin - bottomMargin);
    const rawEndY = Math.min(contentBottom, startY + usableH);

    // Final page: all remaining content fits cleanly above the bottom margin
    if (contentBottom <= startY + usableH) {
      slices.push({
        startY,
        endY: contentBottom,
        topMarginPx: pageTopMargin,
        bottomMarginPx: bottomMargin,
      });
      break;
    }

    let candidateY = rawEndY;
    const maxAdjustIters = sortedBlocks.length * 2 + 16;

    for (let iter = 0; iter < maxAdjustIters; iter++) {
      let moved = false;

      for (const block of sortedBlocks) {
        if (block.top >= candidateY - 0.5 || block.bottom <= candidateY + 0.5) continue;

        const blockH = block.bottom - block.top;
        const isParent = hasChildren.has(block.id);

        // Large or already-started parent wrappers should break between their inner child blocks
        if (isParent && (blockH > usableH || block.top <= startY + 2)) {
          continue;
        }

        if (block.top > startY + 2 && blockH <= usableH) {
          const nextY = snapToGapAbove(block, startY, sortedBlocks, blockById);
          if (nextY < candidateY - 0.5 && nextY > startY + 2) {
            candidateY = nextY;
            moved = true;
            break;
          }
        } else if (!isParent && block.lineBoxes && block.lineBoxes.length > 0) {
          // Oversized single leaf block: only cut in the whitespace between rendered lines
          for (const line of block.lineBoxes) {
            if (line.top < candidateY - 0.5 && line.bottom > candidateY + 0.5 && line.top > startY + 2) {
              const prevLineBottom = findPrevLineBottom(block.lineBoxes, line.top, startY);
              const safeLineY =
                prevLineBottom !== null && prevLineBottom > startY + 1 && prevLineBottom <= line.top
                  ? Math.floor((prevLineBottom + line.top) / 2)
                  : Math.floor(line.top);
              if (safeLineY < candidateY - 0.5 && safeLineY > startY + 2) {
                candidateY = safeLineY;
                moved = true;
              }
              break;
            }
          }
          if (moved) break;
        }
      }

      if (moved) continue;

      // Keep-with-next pass: never leave a heading or table <thead> alone at the bottom of a page
      let keepMoved = false;
      for (const k of sortedBlocks) {
        if (!k.keepWithNext) continue;
        if (k.top <= startY + 2 || k.bottom > candidateY + 0.5) continue;

        const hasFollowingContentOnPage = sortedBlocks.some((other) => {
          if (other.id === k.id) return false;
          if (isDescendantOf(other, k.id, blockById) || isAncestorOf(other, k.id, blockById)) {
            return false;
          }
          if (
            other.top >= k.bottom - 1 &&
            other.top < candidateY - 0.5 &&
            other.bottom <= candidateY + 0.5
          ) {
            return true;
          }
          // Handle multi-column side-by-side layout (e.g., swiss-grid) where content sits beside k
          if (
            !other.keepWithNext &&
            Math.abs(other.top - k.top) < 8 &&
            other.bottom > k.bottom + 4 &&
            other.bottom <= candidateY + 0.5
          ) {
            return true;
          }
          return false;
        });

        if (!hasFollowingContentOnPage) {
          const nextY = snapToGapAbove(k, startY, sortedBlocks, blockById);
          if (nextY < candidateY - 0.5 && nextY > startY + 2) {
            candidateY = nextY;
            keepMoved = true;
            break;
          }
        }
      }

      if (!keepMoved) break;
    }

    // Guarantee forward progress even on degenerate oversized unbreakable elements
    const endY = candidateY > startY + 4 ? Math.min(contentBottom, candidateY) : rawEndY;

    slices.push({
      startY,
      endY,
      topMarginPx: pageTopMargin,
      bottomMarginPx: bottomMargin,
    });

    startY = endY;
    pageIndex++;
  }

  return slices;
}

function collectLineBoxesInElement(el: Element, rootTop: number): PdfLineBox[] {
  const doc = el.ownerDocument;
  if (!doc) return [];

  const rawBoxes: PdfLineBox[] = [];

  try {
    const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode()) !== null) {
      if (!node.textContent || !/\S/.test(node.textContent)) continue;
      const range = doc.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r.height > 1 && r.width > 0.5) {
          rawBoxes.push({
            top: r.top - rootTop,
            bottom: r.bottom - rootTop,
          });
        }
      }
    }
  } catch {
    // Fallback cleanly if Range APIs throw on detached nodes
  }

  const mediaNodes = el.querySelectorAll('img, svg');
  mediaNodes.forEach((media) => {
    const r = media.getBoundingClientRect();
    if (r.height > 2 && r.width > 2) {
      rawBoxes.push({
        top: r.top - rootTop,
        bottom: r.bottom - rootTop,
      });
    }
  });

  if (rawBoxes.length === 0) return [];
  rawBoxes.sort((a, b) => a.top - b.top || a.bottom - b.bottom);

  // Coalesce glyphs/spans on the same visual line
  const merged: PdfLineBox[] = [rawBoxes[0]];
  for (let i = 1; i < rawBoxes.length; i++) {
    const curr = rawBoxes[i];
    const prev = merged[merged.length - 1];
    if (curr.top <= prev.bottom - 1.5 && Math.abs(curr.top - prev.top) < 6) {
      prev.top = Math.min(prev.top, curr.top);
      prev.bottom = Math.max(prev.bottom, curr.bottom);
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
}

function measureDocumentLayout(rootEl: HTMLElement, pageHeightPx: number): {
  blocks: PdfBlockBox[];
  contentBottomPx: number;
  topMarginPx: number;
  bottomMarginPx: number;
  verticalBackdrops: VerticalBackdropBand[];
} {
  const win = rootEl.ownerDocument.defaultView || window;
  const rootRect = rootEl.getBoundingClientRect();
  const rootTop = rootRect.top;
  const rootLeft = rootRect.left;

  const blockEls = Array.from(rootEl.querySelectorAll('[data-pdf-block="true"]'));
  const idByEl = new Map<Element, number>();
  blockEls.forEach((el, idx) => idByEl.set(el, idx + 1));

  const blocks: PdfBlockBox[] = blockEls.map((el, idx) => {
    const id = idx + 1;
    let parentId: number | null = null;
    let p = el.parentElement;
    while (p && p !== rootEl.parentElement) {
      if (idByEl.has(p)) {
        parentId = idByEl.get(p)!;
        break;
      }
      p = p.parentElement;
    }

    const r = el.getBoundingClientRect();
    return {
      id,
      parentId,
      top: Math.max(0, r.top - rootTop),
      bottom: Math.max(0, r.bottom - rootTop),
      keepWithNext: el.getAttribute('data-pdf-keep-with-next') === 'true',
    };
  });

  // Only measure per-line boxes for leaf blocks that could potentially exceed a page or cross a break
  const hasChildSet = new Set<number>();
  for (const b of blocks) {
    if (b.parentId !== null) hasChildSet.add(b.parentId);
  }
  blockEls.forEach((el, idx) => {
    const b = blocks[idx];
    if (!hasChildSet.has(b.id) && b.bottom - b.top > 48) {
      const lines = collectLineBoxesInElement(el, rootTop);
      if (lines.length > 1) {
        b.lineBoxes = lines;
      }
    }
  });

  // Determine natural document sheet margins (handles both standard DocumentSheet & split-sidebar main pane)
  const sheetEl = (rootEl.firstElementChild as HTMLElement) || rootEl;
  const sheetCs = win.getComputedStyle(sheetEl);
  let padTop = parseFloat(sheetCs.paddingTop) || 0;
  let padBottom = parseFloat(sheetCs.paddingBottom) || 0;

  if (padTop < 4) {
    const mainPane = rootEl.querySelector('.col-span-8, .col-span-9') as HTMLElement | null;
    if (mainPane) {
      const paneCs = win.getComputedStyle(mainPane);
      padTop = parseFloat(paneCs.paddingTop) || padTop;
      padBottom = parseFloat(paneCs.paddingBottom) || padBottom;
    }
  }

  const maxAllowedMargin = Math.max(16, Math.round(pageHeightPx * 0.16));
  const topMarginPx = Math.max(18, Math.min(maxAllowedMargin, Math.round(padTop || 36)));
  const bottomMarginPx = Math.max(18, Math.min(maxAllowedMargin, Math.round(padBottom || 36)));

  // Calculate true content bottom (ignoring empty sheet padding and decorative full-height accents)
  let contentBottomPx = 0;
  for (const b of blocks) {
    if (b.bottom > contentBottomPx) contentBottomPx = b.bottom;
  }

  const extraContentEls = rootEl.querySelectorAll('p, h1, h2, h3, li, tr, header, footer, img, svg');
  extraContentEls.forEach((el) => {
    if (el.closest('[data-pdf-vertical-accent="true"]')) return;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.bottom - rootTop > contentBottomPx) {
      contentBottomPx = r.bottom - rootTop;
    }
  });

  if (contentBottomPx <= 0) {
    contentBottomPx = Math.max(pageHeightPx, rootEl.scrollHeight || pageHeightPx);
  }

  // Capture vertical accents & sidebars so continuation pages render seamless left spines/sidebars
  const verticalBackdrops: VerticalBackdropBand[] = [];
  const backdropEls = rootEl.querySelectorAll('[data-pdf-vertical-accent="true"], [data-pdf-sidebar="true"]');
  backdropEls.forEach((el) => {
    const cs = win.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return;
    verticalBackdrops.push({
      left: r.left - rootLeft,
      width: r.width,
      backgroundColor: cs.backgroundColor || 'transparent',
      borderRightWidth: parseFloat(cs.borderRightWidth) || 0,
      borderRightColor: cs.borderRightColor || 'transparent',
    });
  });

  return {
    blocks,
    contentBottomPx,
    topMarginPx,
    bottomMarginPx,
    verticalBackdrops,
  };
}

export const PDF_JPEG_QUALITY = 0.9;
const MAX_SINGLE_CANVAS_PIXELS = 12_000_000;
const MAX_SINGLE_CANVAS_SIDE_PX = 8192;
const MAX_PNG_CANVAS_PIXELS = 4_200_000;
const MAX_PNG_MULTI_PAGE_THRESHOLD = 3;

export function estimateDataUrlByteLength(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const base64Len = dataUrl.length - commaIdx - 1;
  if (base64Len <= 0) return 0;
  let padding = 0;
  if (dataUrl.endsWith('==')) padding = 2;
  else if (dataUrl.endsWith('=')) padding = 1;
  return Math.max(0, Math.floor((base64Len * 3) / 4) - padding);
}

export function computeOptimalRasterScale(params: {
  targetWidthPx: number;
  pageHeightPx: number;
  pageCount?: number;
  totalHeightPx?: number;
}): number {
  const pageCount = Math.max(1, params.pageCount ?? 1);
  const effectiveHeight = pageCount === 1 ? (params.totalHeightPx ?? params.pageHeightPx) : params.pageHeightPx;
  const maxDimPx = Math.max(1, params.targetWidthPx, effectiveHeight);

  let scale = maxDimPx > 3600 ? 0.75 : maxDimPx > 2000 ? 1.0 : maxDimPx > 1400 ? 1.5 : 2.0;

  if (pageCount > 1) {
    const totalCssPixels = params.targetWidthPx * params.pageHeightPx * pageCount;
    if (totalCssPixels > 15_000_000) {
      scale = Math.min(scale, 1.0);
    } else if (totalCssPixels > 9_000_000) {
      scale = Math.min(scale, 1.25);
    } else if (totalCssPixels > 5_000_000) {
      scale = Math.min(scale, 1.5);
    }
  }

  // Enforce hard per-canvas pixel & side limits to prevent browser OOM crashes
  const pageCssPixels = Math.max(1, params.targetWidthPx * effectiveHeight);
  const maxScaleByPixels = Math.sqrt(MAX_SINGLE_CANVAS_PIXELS / pageCssPixels);
  const maxScaleBySide = MAX_SINGLE_CANVAS_SIDE_PX / maxDimPx;
  const safeScale = Math.min(scale, maxScaleByPixels, maxScaleBySide);

  return Math.max(0.5, Math.round(safeScale * 100) / 100);
}

export function encodeOptimizedPageImage(
  canvas: HTMLCanvasElement,
  options?: { allowPng?: boolean }
): { dataUrl: string; format: 'JPEG' | 'PNG'; compression: 'FAST' } {
  const jpegDataUrl = canvas.toDataURL('image/jpeg', PDF_JPEG_QUALITY);
  const isActualJpeg = jpegDataUrl.startsWith('data:image/jpeg');
  if (!isActualJpeg) {
    return {
      dataUrl: jpegDataUrl,
      format: jpegDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG',
      compression: 'FAST',
    };
  }

  const pixelCount = canvas.width * canvas.height;
  if (options?.allowPng && pixelCount > 0 && pixelCount <= MAX_PNG_CANVAS_PIXELS) {
    const pngDataUrl = canvas.toDataURL('image/png');
    if (pngDataUrl.startsWith('data:image/png')) {
      const jpegBytes = estimateDataUrlByteLength(jpegDataUrl);
      const pngBytes = estimateDataUrlByteLength(pngDataUrl);
      // jsPDF strips unused opaque alpha and applies Sub+Flate (~6-10% smaller than raw canvas PNG),
      // so raw PNG <= 98% of JPEG bytes guarantees smaller lossless PDF stream without visible loss.
      if (pngBytes > 0 && pngBytes < jpegBytes * 0.98) {
        return { dataUrl: pngDataUrl, format: 'PNG', compression: 'FAST' };
      }
    }
  }

  return { dataUrl: jpegDataUrl, format: 'JPEG', compression: 'FAST' };
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Converts the vector DOM document into a high-resolution pixelated raster PDF file
 * matching the selected paper dimensions and triggers immediate download.
 */
export async function exportToPdf(
  elementId: string,
  filename: string,
  paperSpec: PaperSizeSpec = PAPER_SIZES.a4,
  projectPayload?: EasyDocPdfPayload
): Promise<boolean> {
  const source = document.getElementById(elementId);
  if (!source) {
    console.error(`Target document element #${elementId} not found.`);
    return false;
  }

  const targetWidthPx = paperSpec.widthPx;
  const pageHeightPx = paperSpec.heightPx;

  // 1. Temporarily unscale the wrapper so the element is rendered at 100% natural paper resolution
  const scaleWrapper = document.getElementById('document-scale-wrapper');
  const prevTransform = scaleWrapper ? scaleWrapper.style.transform : '';
  const prevTransition = scaleWrapper ? scaleWrapper.style.transition : '';

  let tempContainer: HTMLElement | null = null;
  let domRestored = false;

  const restoreDom = () => {
    if (domRestored) return;
    domRestored = true;
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
      tempContainer = null;
    }
    if (scaleWrapper) {
      scaleWrapper.style.transform = prevTransform;
      scaleWrapper.style.transition = prevTransition;
    }
  };

  const mountCloneContainer = (): HTMLElement => {
    if (tempContainer) return tempContainer.firstElementChild as HTMLElement;
    tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: ${targetWidthPx}px !important;
      z-index: -99999 !important;
      background-color: #ffffff !important;
      pointer-events: none !important;
      overflow: visible !important;
    `;
    const clone = source.cloneNode(true) as HTMLElement;
    clone.style.width = `${targetWidthPx}px`;
    clone.style.minWidth = `${targetWidthPx}px`;
    clone.style.maxWidth = `${targetWidthPx}px`;
    clone.style.transform = 'none';
    clone.style.backgroundColor = '#ffffff';
    clone.style.display = 'block';
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    return clone;
  };

  try {
    if (scaleWrapper) {
      scaleWrapper.style.transition = 'none';
      scaleWrapper.style.transform = 'none';
      // Force DOM reflow to synchronously apply unscaled layout
      void scaleWrapper.offsetHeight;
    }

    // Check if source is hidden (e.g. mobile editor view)
    const isHidden = source.offsetParent === null || source.offsetWidth === 0;
    let targetElement: HTMLElement = isHidden ? mountCloneContainer() : source;

    if (document.fonts) {
      await document.fonts.ready;
    }

    // Helper to convert modern CSS color functions (oklch, oklab, color-mix, color(), lab, lch) to standard rgb/rgba
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

    const colorCache = new Map<string, string>();
    const UNSUPPORTED_COLOR_REGEX = /\b(oklch|oklab|color-mix|color|lab|lch)\s*\(/i;

    const resolveCssColorToRgba = (colorStr: string): string => {
      if (!colorStr || !UNSUPPORTED_COLOR_REGEX.test(colorStr)) return colorStr;
      const cached = colorCache.get(colorStr);
      if (cached) return cached;

      if (!colorCtx) return 'rgba(0, 0, 0, 0)';
      try {
        colorCtx.clearRect(0, 0, 1, 1);
        colorCtx.fillStyle = 'rgba(0, 0, 0, 0)';
        colorCtx.fillStyle = colorStr;
        colorCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
        const result =
          a === 0
            ? 'rgba(0, 0, 0, 0)'
            : a === 255
            ? `rgb(${r}, ${g}, ${b})`
            : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
        colorCache.set(colorStr, result);
        return result;
      } catch {
        return 'rgba(0, 0, 0, 0)';
      }
    };

    const replaceUnsupportedColors = (val: string): string => {
      if (!val || !UNSUPPORTED_COLOR_REGEX.test(val)) return val;
      const fnRegex = /\b(oklch|oklab|color-mix|color|lab|lch)\s*\(/gi;
      let output = '';
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = fnRegex.exec(val)) !== null) {
        const start = match.index;
        if (start < lastIndex) continue;

        output += val.slice(lastIndex, start);
        let depth = 1;
        let i = fnRegex.lastIndex;
        while (i < val.length && depth > 0) {
          if (val[i] === '(') depth++;
          else if (val[i] === ')') depth--;
          i++;
        }

        const expr = val.slice(start, i);
        output += resolveCssColorToRgba(expr);
        lastIndex = i;
        fnRegex.lastIndex = i;
      }

      output += val.slice(lastIndex);
      return output;
    };

    const COLOR_CSS_PROPS = [
      'color',
      'background-color',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'outline-color',
      'text-decoration-color',
      'column-rule-color',
      'caret-color',
      'fill',
      'stroke',
      'box-shadow',
      'text-shadow',
      'background-image',
    ];

    const sanitizeClonedColors = (clonedDoc: Document, clonedEl: HTMLElement) => {
      const styleTags = clonedDoc.querySelectorAll('style');
      styleTags.forEach((tag) => {
        if (tag.textContent && UNSUPPORTED_COLOR_REGEX.test(tag.textContent)) {
          tag.textContent = replaceUnsupportedColors(tag.textContent);
        }
      });

      const win = clonedDoc.defaultView || window;
      const elements: Element[] = [
        clonedDoc.documentElement,
        clonedDoc.body,
        clonedEl,
        ...Array.from(clonedEl.querySelectorAll('*')),
      ].filter((n): n is Element => Boolean(n));

      for (const node of elements) {
        const el = node as HTMLElement | SVGElement;
        if (!el.style) continue;
        const cs = win.getComputedStyle(el);
        for (const prop of COLOR_CSS_PROPS) {
          const computedVal = cs.getPropertyValue(prop);
          if (computedVal && UNSUPPORTED_COLOR_REGEX.test(computedVal)) {
            el.style.setProperty(prop, replaceUnsupportedColors(computedVal), 'important');
          }
        }
      }
    };

    if (typeof JsPdfConstructor !== 'function') {
      throw new Error('jsPDF constructor is not available.');
    }

    const isCustomPaper = paperSpec.id === 'custom';
    const rawDocHeightPx = isCustomPaper
      ? pageHeightPx
      : Math.max(pageHeightPx, targetElement.scrollHeight || pageHeightPx);

    const measuredInitial = !isCustomPaper ? measureDocumentLayout(targetElement, pageHeightPx) : null;
    const needsMultiPage =
      !isCustomPaper &&
      rawDocHeightPx > pageHeightPx + 3 &&
      measuredInitial !== null &&
      measuredInitial.contentBottomPx > pageHeightPx - 4;

    const pdf = new JsPdfConstructor({
      orientation: paperSpec.orientation || (paperSpec.widthMm > paperSpec.heightMm ? 'landscape' : 'portrait'),
      unit: 'mm',
      format: paperSpec.jsPdfFormat,
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    if (!needsMultiPage) {
      // Single-page and custom paper sizes keep exact existing capture behavior
      const textLayer = collectPdfTextLayer(targetElement);
      const rasterScale = computeOptimalRasterScale({
        targetWidthPx,
        pageHeightPx,
        pageCount: 1,
        totalHeightPx: isCustomPaper ? pageHeightPx : rawDocHeightPx,
      });

      const canvas = await html2canvas(targetElement, {
        scale: rasterScale,
        width: targetWidthPx,
        ...(isCustomPaper ? { height: pageHeightPx } : {}),
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        onclone: sanitizeClonedColors,
      });

      restoreDom();

      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      const encodedPage = encodeOptimizedPageImage(canvas, { allowPng: true });
      canvas.width = 0;
      canvas.height = 0;
      pdf.addImage(
        encodedPage.dataUrl,
        encodedPage.format,
        0,
        0,
        pdfWidth,
        imgHeight,
        undefined,
        encodedPage.compression
      );

      const singleSlice = {
        startY: 0,
        endY: isCustomPaper ? pageHeightPx : rawDocHeightPx,
        topMarginPx: 0,
        bottomMarginPx: 0,
      };
      const visibleRuns = isCustomPaper
        ? textLayer.runs.filter((r) => assignSliceIndex(r.top + r.height / 2, [singleSlice], pageHeightPx) === 0)
        : textLayer.runs;
      const visibleLinks = isCustomPaper
        ? textLayer.links.filter((l) => assignSliceIndex(l.top + l.height / 2, [singleSlice], pageHeightPx) === 0)
        : textLayer.links;

      renderPdfTextLayerForPage({
        pdf,
        slice: singleSlice,
        runs: visibleRuns,
        links: visibleLinks,
        targetWidthPx,
        pdfWidthMm: pdfWidth,
      });
    } else {
      // Multi-page smart pagination: clone at (0,0) offscreen so scrolled viewports never offset slices
      const cleanEl = isHidden ? targetElement : mountCloneContainer();
      const imgs = Array.from(cleanEl.querySelectorAll('img'));
      if (imgs.length > 0) {
        await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
      }

      const layoutMetrics = measureDocumentLayout(cleanEl, pageHeightPx);
      const slices = computeSmartPageSlices({
        pageHeightPx,
        contentBottomPx: layoutMetrics.contentBottomPx,
        topMarginPx: layoutMetrics.topMarginPx,
        bottomMarginPx: layoutMetrics.bottomMarginPx,
        blocks: layoutMetrics.blocks,
      });

      const textLayer = collectPdfTextLayer(cleanEl);
      const runsByPage: PdfTextRun[][] = slices.map(() => []);
      for (const run of textLayer.runs) {
        const idx = assignSliceIndex(run.top + run.height / 2, slices);
        if (idx >= 0) runsByPage[idx].push(run);
      }
      const linksByPage: PdfLinkAnnotation[][] = slices.map(() => []);
      for (const link of textLayer.links) {
        const idx = assignSliceIndex(link.top + link.height / 2, slices);
        if (idx >= 0) linksByPage[idx].push(link);
      }

      const rasterScale = computeOptimalRasterScale({
        targetWidthPx,
        pageHeightPx,
        pageCount: slices.length,
      });
      const pageCanvasW = Math.round(targetWidthPx * rasterScale);
      const pageCanvasH = Math.round(pageHeightPx * rasterScale);
      const allowPngInMultiPage = slices.length <= MAX_PNG_MULTI_PAGE_THRESHOLD;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = pageCanvasW;
      pageCanvas.height = pageCanvasH;
      const pageCtx = pageCanvas.getContext('2d');
      if (!pageCtx) {
        throw new Error('Could not acquire 2D context for PDF page composition.');
      }

      for (let i = 0; i < slices.length; i++) {
        if (i > 0) {
          await yieldToMainThread();
        }
        const slice = slices[i];
        const sliceHeightCss = Math.max(1, Math.ceil(slice.endY - slice.startY));

        const sliceCanvas = await html2canvas(cleanEl, {
          scale: rasterScale,
          x: 0,
          y: slice.startY,
          width: targetWidthPx,
          height: sliceHeightCss,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
          scrollX: 0,
          scrollY: 0,
          onclone: sanitizeClonedColors,
        });

        // Paint crisp white sheet + continuous vertical accents/sidebars across full page height
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvasW, pageCanvasH);

        for (const band of layoutMetrics.verticalBackdrops) {
          const bx = band.left * rasterScale;
          const bw = band.width * rasterScale;
          const resolvedBg = resolveCssColorToRgba(band.backgroundColor);
          if (resolvedBg && resolvedBg !== 'rgba(0, 0, 0, 0)' && resolvedBg !== 'transparent') {
            pageCtx.fillStyle = resolvedBg;
            pageCtx.fillRect(bx, 0, bw, pageCanvasH);
          }
          if (band.borderRightWidth > 0) {
            const resolvedBorder = resolveCssColorToRgba(band.borderRightColor);
            if (resolvedBorder && resolvedBorder !== 'rgba(0, 0, 0, 0)' && resolvedBorder !== 'transparent') {
              pageCtx.fillStyle = resolvedBorder;
              pageCtx.fillRect(
                bx + bw - band.borderRightWidth * rasterScale,
                0,
                Math.max(1, band.borderRightWidth * rasterScale),
                pageCanvasH
              );
            }
          }
        }

        // Composite this page's rendered DOM slice cleanly inside the page margins
        const destY = Math.round(slice.topMarginPx * rasterScale);
        const maxDrawH = Math.max(1, Math.ceil((pageHeightPx - slice.topMarginPx - slice.bottomMarginPx + 1) * rasterScale));
        const drawH = Math.min(sliceCanvas.height, maxDrawH);
        const drawW = Math.min(sliceCanvas.width, pageCanvasW);

        pageCtx.drawImage(sliceCanvas, 0, 0, drawW, drawH, 0, destY, drawW, drawH);
        sliceCanvas.width = 0;
        sliceCanvas.height = 0;

        // Re-stroke continuous backdrops across top & bottom margin bands (covers page 0 bottom margin cleanly too)
        for (const band of layoutMetrics.verticalBackdrops) {
          const bx = band.left * rasterScale;
          const bw = band.width * rasterScale;
          const resolvedBg = resolveCssColorToRgba(band.backgroundColor);
          const resolvedBorder = band.borderRightWidth > 0 ? resolveCssColorToRgba(band.borderRightColor) : '';

          // Top margin extension on continuation pages
          if (destY > 0) {
            if (resolvedBg && resolvedBg !== 'rgba(0, 0, 0, 0)' && resolvedBg !== 'transparent') {
              pageCtx.fillStyle = resolvedBg;
              pageCtx.fillRect(bx, 0, bw, destY);
            }
            if (band.borderRightWidth > 0 && resolvedBorder && resolvedBorder !== 'rgba(0, 0, 0, 0)' && resolvedBorder !== 'transparent') {
              pageCtx.fillStyle = resolvedBorder;
              pageCtx.fillRect(bx + bw - band.borderRightWidth * rasterScale, 0, Math.max(1, band.borderRightWidth * rasterScale), destY);
            }
          }

          // Bottom margin extension below slice content
          const afterSliceY = destY + drawH;
          if (afterSliceY < pageCanvasH) {
            if (resolvedBg && resolvedBg !== 'rgba(0, 0, 0, 0)' && resolvedBg !== 'transparent') {
              pageCtx.fillStyle = resolvedBg;
              pageCtx.fillRect(bx, afterSliceY, bw, pageCanvasH - afterSliceY);
            }
            if (band.borderRightWidth > 0 && resolvedBorder && resolvedBorder !== 'rgba(0, 0, 0, 0)' && resolvedBorder !== 'transparent') {
              pageCtx.fillStyle = resolvedBorder;
              pageCtx.fillRect(bx + bw - band.borderRightWidth * rasterScale, afterSliceY, Math.max(1, band.borderRightWidth * rasterScale), pageCanvasH - afterSliceY);
            }
          }
        }

        if (i > 0) {
          pdf.addPage();
        }
        const encodedPage = encodeOptimizedPageImage(pageCanvas, { allowPng: allowPngInMultiPage });
        pdf.addImage(
          encodedPage.dataUrl,
          encodedPage.format,
          0,
          0,
          pdfWidth,
          pdfHeight,
          undefined,
          encodedPage.compression
        );

        renderPdfTextLayerForPage({
          pdf,
          slice,
          runs: runsByPage[i],
          links: linksByPage[i],
          targetWidthPx,
          pdfWidthMm: pdfWidth,
        });
      }

      pageCanvas.width = 0;
      pageCanvas.height = 0;
      restoreDom();
    }

    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

    if (projectPayload) {
      attachHiddenPayloadToJsPdf(pdf, projectPayload);
    }

    // 5. Trigger download using official pdf.save()
    let downloadSucceeded = false;
    try {
      pdf.save(safeFilename);
      downloadSucceeded = true;
    } catch (saveErr) {
      console.warn('pdf.save failed, falling back to direct blob anchor:', saveErr);
    }

    // Fallback if needed: direct anchor click
    if (!downloadSucceeded) {
      try {
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = blobUrl;
        downloadAnchor.download = safeFilename;
        downloadAnchor.rel = 'noopener';
        downloadAnchor.style.display = 'none';
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadSucceeded = true;

        setTimeout(() => {
          if (downloadAnchor.parentNode) {
            document.body.removeChild(downloadAnchor);
          }
          URL.revokeObjectURL(blobUrl);
        }, 2500);
      } catch (anchorErr) {
        console.error('All download methods failed:', anchorErr);
      }
    }

    return downloadSucceeded;
  } catch (error) {
    console.error('High-resolution pixelated PDF generation error:', error);
    return false;
  } finally {
    restoreDom();
  }
}

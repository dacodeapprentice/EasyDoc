export interface PdfTextRun {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSizePx: number;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic';
}

export interface PdfLinkAnnotation {
  url: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PdfTextLayerData {
  runs: PdfTextRun[];
  links: PdfLinkAnnotation[];
}

export interface PdfSliceWindow {
  startY: number;
  endY: number;
  topMarginPx: number;
  bottomMarginPx: number;
}

// Extra Windows-1252 codepoints (0x80..0x9F) supported by PDF WinAnsiEncoding
const WINANSI_EXT_CODEPOINTS = new Set<number>([
  0x20ac, // €
  0x201a, // ‚
  0x0192, // ƒ
  0x201e, // „
  0x2026, // …
  0x2020, // †
  0x2021, // ‡
  0x02c6, // ˆ
  0x2030, // ‰
  0x0160, // Š
  0x2039, // ‹
  0x0152, // Œ
  0x017d, // Ž
  0x2018, // ‘
  0x2019, // ’
  0x201c, // “
  0x201d, // ”
  0x2022, // •
  0x2013, // –
  0x2014, // —
  0x02dc, // ˜
  0x2122, // ™
  0x0161, // š
  0x203a, // ›
  0x0153, // œ
  0x017e, // ž
  0x0178, // Ÿ
]);

export function isWinAnsiCodePoint(cp: number): boolean {
  if (cp >= 0x0020 && cp <= 0x007e) return true;
  if (cp >= 0x00a0 && cp <= 0x00ff) return true;
  return WINANSI_EXT_CODEPOINTS.has(cp);
}

/**
 * Normalizes text to NFC and filters to characters supported by PDF WinAnsiEncoding
 * (ASCII + Western European Latin-1 + Windows-1252 punctuation/euro/ligatures).
 * Unsupported scripts (Japanese, Korean, Chinese, Arabic, etc.) are omitted cleanly
 * so jsPDF never falls back to raw UTF-16BE bytes inside a Type1 WinAnsi font stream.
 */
export function sanitizeTextForWinAnsi(rawText: string): string {
  if (!rawText) return '';

  const normalized = rawText
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff\u00ad]/g, '');

  let out = '';
  let hadUnsupported = false;

  for (const ch of normalized) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0x09 || cp === 0x0a || cp === 0x0d) {
      out += ' ';
      continue;
    }
    if (isWinAnsiCodePoint(cp)) {
      out += ch;
    } else {
      hadUnsupported = true;
    }
  }

  let cleaned = out.replace(/[ \t]+/g, ' ').trim();
  if (!cleaned) return '';

  if (hadUnsupported) {
    // Strip empty brackets/separators left behind when non-Latin text inside them was removed
    cleaned = cleaned.replace(/\(\s*\)|\[\s*\]/g, '').replace(/[ \t]+/g, ' ').trim();
    if (
      !/[A-Za-z0-9\u00c0-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u20ac$\u00a3@#%]/.test(
        cleaned
      )
    ) {
      return '';
    }
  }

  return cleaned;
}

const PLACEHOLDER_EMAILS = new Set([
  'email@example.com',
  'customer@example.com',
  'billing@example.com',
]);

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s,;<>()"']+|\b[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?:com|org|net|io|dev|pt|es|fr|de|co\.uk|edu|gov|ai|app)(?:\/[^\s,;<>()"']*)?/gi;

function extractLinkMatches(
  text: string
): Array<{ start: number; end: number; url: string }> {
  const results: Array<{ start: number; end: number; url: string }> = [];
  const occupied: Array<[number, number]> = [];

  EMAIL_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = EMAIL_PATTERN.exec(text)) !== null) {
    const raw = m[0];
    const start = m.index;
    const end = start + raw.length;
    if (!PLACEHOLDER_EMAILS.has(raw.toLowerCase())) {
      results.push({ start, end, url: `mailto:${raw}` });
    }
    occupied.push([start, end]);
  }

  URL_PATTERN.lastIndex = 0;
  while ((m = URL_PATTERN.exec(text)) !== null) {
    const raw = m[0];
    const start = m.index;
    const end = start + raw.length;
    // Skip domains that are already part of an email address
    if (occupied.some(([os, oe]) => start >= os && end <= oe)) continue;
    const lower = raw.toLowerCase();
    if (lower === 'example.com' || lower === 'www.example.com') continue;
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    results.push({ start, end, url: href });
  }

  return results;
}

interface VisualLinePiece {
  startOffset: number;
  endOffset: number;
  rawText: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function getVisibleRects(range: Range): DOMRect[] {
  const rectList = range.getClientRects();
  const visible: DOMRect[] = [];
  for (let i = 0; i < rectList.length; i++) {
    const r = rectList[i];
    if (r.width > 0.2 && r.height > 0.5) {
      visible.push(r);
    }
  }
  return visible;
}

function unionRects(
  rects: DOMRect[],
  rootLeft: number,
  rootTop: number
): { left: number; top: number; right: number; bottom: number } | null {
  if (rects.length === 0) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of rects) {
    if (r.left < left) left = r.left;
    if (r.top < top) top = r.top;
    if (r.right > right) right = r.right;
    if (r.bottom > bottom) bottom = r.bottom;
  }
  return {
    left: left - rootLeft,
    top: top - rootTop,
    right: right - rootLeft,
    bottom: bottom - rootTop,
  };
}

function splitTextNodeIntoVisualLines(
  doc: Document,
  textNode: Text,
  rootLeft: number,
  rootTop: number
): VisualLinePiece[] {
  const data = textNode.data;
  const len = data.length;
  if (len === 0 || !/\S/.test(data)) return [];

  const range = doc.createRange();
  range.selectNodeContents(textNode);
  const fullRects = getVisibleRects(range);
  if (fullRects.length === 0) return [];

  // Fast path: single visual line (no wrapping)
  const firstTop = fullRects[0].top;
  const singleLineTol = Math.max(4, fullRects[0].height * 0.45);
  if (fullRects.every((r) => Math.abs(r.top - firstTop) <= singleLineTol)) {
    const box = unionRects(fullRects, rootLeft, rootTop);
    if (!box) return [];
    return [
      {
        startOffset: 0,
        endOffset: len,
        rawText: data,
        ...box,
      },
    ];
  }

  // Multi-line wrapped text node: binary search exact line boundaries via Range.getClientRects()
  const pieces: VisualLinePiece[] = [];
  let offset = 0;

  while (offset < len) {
    while (offset < len && /[\r\n]/.test(data[offset])) {
      offset++;
    }
    if (offset >= len) break;

    let probeEnd = offset + 1;
    let baseRects: DOMRect[] = [];
    while (probeEnd <= len) {
      range.setStart(textNode, offset);
      range.setEnd(textNode, probeEnd);
      baseRects = getVisibleRects(range);
      if (baseRects.length > 0) break;
      probeEnd++;
    }
    if (baseRects.length === 0) break;

    const lineTop = baseRects[0].top;
    const tol = Math.max(4, baseRects[0].height * 0.45);

    let lo = probeEnd;
    let hi = len;
    let best = probeEnd;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      range.setStart(textNode, offset);
      range.setEnd(textNode, mid);
      const rects = getVisibleRects(range);
      const onSameLine =
        rects.length > 0 && rects.every((r) => Math.abs(r.top - lineTop) <= tol);
      if (onSameLine) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    // Avoid splitting UTF-16 surrogate pairs
    if (best < len) {
      const prevCode = data.charCodeAt(best - 1);
      if (prevCode >= 0xd800 && prevCode <= 0xdbff) {
        best++;
      }
    }

    range.setStart(textNode, offset);
    range.setEnd(textNode, best);
    const box = unionRects(getVisibleRects(range), rootLeft, rootTop);
    if (box) {
      pieces.push({
        startOffset: offset,
        endOffset: best,
        rawText: data.slice(offset, best),
        ...box,
      });
    }

    if (best <= offset) {
      offset++;
    } else {
      offset = best;
    }
  }

  return pieces;
}

function resolveFontStyle(cs: CSSStyleDeclaration): PdfTextRun['fontStyle'] {
  const weightNum = parseInt(cs.fontWeight, 10);
  const isBold = cs.fontWeight === 'bold' || cs.fontWeight === 'bolder' || (!isNaN(weightNum) && weightNum >= 600);
  const isItalic = cs.fontStyle === 'italic' || cs.fontStyle === 'oblique';
  if (isBold && isItalic) return 'bolditalic';
  if (isBold) return 'bold';
  if (isItalic) return 'italic';
  return 'normal';
}

function applyCssTextTransform(text: string, transform: string): string {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  return text;
}

const BLOCK_DISPLAY_TYPES = new Set([
  'block',
  'flex',
  'grid',
  'table',
  'table-row',
  'table-cell',
  'table-header-group',
  'table-row-group',
  'table-footer-group',
  'list-item',
  'flow-root',
]);

/**
 * Walks an unscaled DOM root in natural reading order (DOM tree order) and extracts
 * positioned text runs + clickable link annotations ready to overlay onto PDF pages.
 */
export function collectPdfTextLayer(rootEl: HTMLElement): PdfTextLayerData {
  const doc = rootEl.ownerDocument;
  const win = doc.defaultView || window;
  const rootRect = rootEl.getBoundingClientRect();
  const rootLeft = rootRect.left;
  const rootTop = rootRect.top;

  const runs: PdfTextRun[] = [];
  const links: PdfLinkAnnotation[] = [];

  // Inline buffer merges adjacent <span> / text nodes on the exact same visual line within a block
  let pending: (PdfTextRun & { right: number }) | null = null;

  const flushPending = () => {
    if (pending) {
      runs.push({
        text: pending.text,
        left: pending.left,
        top: pending.top,
        width: Math.max(0, pending.right - pending.left),
        height: pending.height,
        fontSizePx: pending.fontSizePx,
        fontStyle: pending.fontStyle,
      });
      pending = null;
    }
  };

  const visit = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'SVG') {
        return;
      }
      if (el.getAttribute('data-pdf-vertical-accent') === 'true') {
        return;
      }

      const cs = win.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
        return;
      }

      const isBlockBoundary = BLOCK_DISPLAY_TYPES.has(cs.display);
      if (isBlockBoundary) flushPending();

      for (let i = 0; i < el.childNodes.length; i++) {
        visit(el.childNodes[i]);
      }

      if (isBlockBoundary) flushPending();
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const parentEl = textNode.parentElement;
      if (!parentEl) return;

      const cs = win.getComputedStyle(parentEl);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
        return;
      }

      const fontSizePx = parseFloat(cs.fontSize) || 12;
      const fontStyle = resolveFontStyle(cs);
      const textTransform = cs.textTransform || 'none';
      const whiteSpace = cs.whiteSpace || 'normal';
      const preserveSpaces = whiteSpace.startsWith('pre');
      const isPlaceholderEl = Boolean(parentEl.closest('.italic.text-slate-400, .text-slate-400.italic'));
      const anchorEl = parentEl.closest('a[href]') as HTMLAnchorElement | null;

      const pieces = splitTextNodeIntoVisualLines(doc, textNode, rootLeft, rootTop);
      for (const piece of pieces) {
        const collapsed = preserveSpaces
          ? piece.rawText.replace(/[\r\n]+/g, ' ').trim()
          : piece.rawText.replace(/\s+/g, ' ').trim();
        const transformed = applyCssTextTransform(collapsed, textTransform);
        const sanitized = sanitizeTextForWinAnsi(transformed);

        if (sanitized) {
          const pieceHeight = Math.max(fontSizePx, piece.bottom - piece.top);
          const pieceMidY = piece.top + pieceHeight / 2;

          if (pending) {
            const pendingMidY = pending.top + pending.height / 2;
            const sameLine = Math.abs(pieceMidY - pendingMidY) <= Math.max(4, pending.fontSizePx * 0.45);
            const horizGap = piece.left - pending.right;
            const maxJoinGap = Math.max(6, Math.max(pending.fontSizePx, fontSizePx) * 0.8);

            if (sameLine && horizGap >= -2 && horizGap <= maxJoinGap) {
              const needsSpace =
                horizGap > Math.max(0.8, pending.fontSizePx * 0.14) &&
                !pending.text.endsWith(' ') &&
                !sanitized.startsWith(' ');
              pending.text = `${pending.text}${needsSpace ? ' ' : ''}${sanitized}`;
              pending.right = Math.max(pending.right, piece.right);
              pending.top = Math.min(pending.top, piece.top);
              pending.height = Math.max(pending.height, pieceHeight);
            } else {
              flushPending();
              pending = {
                text: sanitized,
                left: piece.left,
                top: piece.top,
                width: Math.max(0, piece.right - piece.left),
                right: piece.right,
                height: pieceHeight,
                fontSizePx,
                fontStyle,
              };
            }
          } else {
            pending = {
              text: sanitized,
              left: piece.left,
              top: piece.top,
              width: Math.max(0, piece.right - piece.left),
              right: piece.right,
              height: pieceHeight,
              fontSizePx,
              fontStyle,
            };
          }
        }

        // Clickable link annotations (skipped on italic placeholder hints)
        if (!isPlaceholderEl) {
          if (anchorEl && anchorEl.getAttribute('href')) {
            links.push({
              url: anchorEl.getAttribute('href')!,
              left: piece.left,
              top: piece.top,
              width: Math.max(1, piece.right - piece.left),
              height: Math.max(fontSizePx, piece.bottom - piece.top),
            });
          } else {
            const matches = extractLinkMatches(piece.rawText);
            for (const match of matches) {
              const linkRange = doc.createRange();
              linkRange.setStart(textNode, piece.startOffset + match.start);
              linkRange.setEnd(textNode, piece.startOffset + match.end);
              const linkBox = unionRects(getVisibleRects(linkRange), rootLeft, rootTop);
              if (linkBox) {
                links.push({
                  url: match.url,
                  left: linkBox.left,
                  top: linkBox.top,
                  width: Math.max(1, linkBox.right - linkBox.left),
                  height: Math.max(fontSizePx, linkBox.bottom - linkBox.top),
                });
              }
            }
          }
        }
      }
    }
  };

  visit(rootEl);
  flushPending();

  return { runs, links };
}

/**
 * Assigns each run/link centerY to a unique slice index in [0 .. slices.length - 1],
 * or -1 if outside an explicit clipped window (e.g. custom fixed-height paper).
 */
export function assignSliceIndex(
  centerY: number,
  slices: PdfSliceWindow[],
  clipMaxY?: number
): number {
  if (slices.length === 0) return -1;
  if (clipMaxY !== undefined && (centerY < 0 || centerY > clipMaxY)) {
    return -1;
  }
  if (slices.length === 1) return 0;

  for (let i = 0; i < slices.length; i++) {
    const s = slices[i];
    if (i === 0 && centerY <= s.endY) return 0;
    if (centerY > s.startY && centerY <= s.endY) return i;
  }
  if (centerY <= slices[0].startY) return 0;
  return slices.length - 1;
}

/**
 * Renders invisible selectable/searchable text runs and clickable link annotations
 * onto the current jsPDF page for a given vertical slice window.
 */
export function renderPdfTextLayerForPage(params: {
  pdf: any;
  slice: PdfSliceWindow;
  runs: PdfTextRun[];
  links: PdfLinkAnnotation[];
  targetWidthPx: number;
  pdfWidthMm: number;
}): void {
  const { pdf, slice, runs, links, targetWidthPx, pdfWidthMm } = params;
  if (!targetWidthPx || !pdfWidthMm) return;

  const pxToMm = pdfWidthMm / targetWidthPx;
  const ptPerMm = 72 / 25.4;

  for (const run of runs) {
    if (!run.text) continue;
    const localTopPx = run.top - slice.startY + slice.topMarginPx;
    const baselinePx = localTopPx + run.height * 0.78;
    const xMm = Math.max(0, run.left * pxToMm);
    const yMm = Math.max(0, baselinePx * pxToMm);
    const fontSizePt = Math.max(4, Math.min(72, run.fontSizePx * pxToMm * ptPerMm));

    pdf.setFont('helvetica', run.fontStyle);
    pdf.setFontSize(fontSizePt);

    const targetWidthMm = run.width * pxToMm;
    const naturalWidthMm = typeof pdf.getTextWidth === 'function' ? pdf.getTextWidth(run.text) : 0;
    const horizontalScale =
      targetWidthMm > 0.2 && naturalWidthMm > 0.2
        ? Math.max(0.7, Math.min(1.4, targetWidthMm / naturalWidthMm))
        : 1;

    pdf.text(run.text, xMm, yMm, {
      baseline: 'alphabetic',
      renderingMode: 'invisible',
      horizontalScale,
    });
  }

  if (typeof pdf.link === 'function') {
    for (const link of links) {
      const localTopPx = link.top - slice.startY + slice.topMarginPx;
      const xMm = Math.max(0, link.left * pxToMm);
      const yMm = Math.max(0, localTopPx * pxToMm);
      const wMm = Math.max(0.5, link.width * pxToMm);
      const hMm = Math.max(0.5, link.height * pxToMm);
      pdf.link(xMm, yMm, wMm, hMm, { url: link.url });
    }
  }
}

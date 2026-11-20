import jsPDFImport, { jsPDF as jsPDFNamed } from 'jspdf';
import html2canvas from 'html2canvas';
import { PaperSizeSpec } from '../types/document';
import { PAPER_SIZES } from '../data/defaultData';

// Robust constructor resolution for jsPDF across both ESM and CommonJS bundles
const JsPdfConstructor: any =
  typeof jsPDFNamed === 'function'
    ? jsPDFNamed
    : typeof jsPDFImport === 'function'
    ? jsPDFImport
    : (jsPDFImport as any)?.default && typeof (jsPDFImport as any).default === 'function'
    ? (jsPDFImport as any).default
    : (jsPDFImport as any)?.jsPDF;

export function printDocument(paperSpec: PaperSizeSpec = PAPER_SIZES.a4): void {
  const scaleWrapper = document.getElementById('document-scale-wrapper');
  const previousTransform = scaleWrapper ? scaleWrapper.style.transform : '';

  // Dynamically apply the selected paper size to @page before invoking browser print
  let pageStyle = document.getElementById('easydoc-print-page-style') as HTMLStyleElement | null;
  if (!pageStyle) {
    pageStyle = document.createElement('style');
    pageStyle.id = 'easydoc-print-page-style';
    document.head.appendChild(pageStyle);
  }
  pageStyle.textContent = `@media print { @page { size: ${paperSpec.cssPageSize}; margin: 10mm; } }`;

  if (scaleWrapper) {
    scaleWrapper.style.transform = 'none';
  }

  window.print();

  if (scaleWrapper) {
    scaleWrapper.style.transform = previousTransform;
  }
}

/**
 * Converts the vector DOM document into a high-resolution pixelated raster PDF file
 * matching the selected paper dimensions and triggers immediate download.
 */
export async function exportToPdf(
  elementId: string,
  filename: string,
  paperSpec: PaperSizeSpec = PAPER_SIZES.a4
): Promise<boolean> {
  const source = document.getElementById(elementId);
  if (!source) {
    console.error(`Target document element #${elementId} not found.`);
    return false;
  }

  const targetWidthPx = paperSpec.widthPx;

  // 1. Temporarily unscale the wrapper so the element is rendered at 100% natural paper resolution
  const scaleWrapper = document.getElementById('document-scale-wrapper');
  const prevTransform = scaleWrapper ? scaleWrapper.style.transform : '';
  const prevTransition = scaleWrapper ? scaleWrapper.style.transition : '';

  if (scaleWrapper) {
    scaleWrapper.style.transition = 'none';
    scaleWrapper.style.transform = 'none';
    // Force DOM reflow to synchronously apply unscaled layout
    void scaleWrapper.offsetHeight;
  }

  // Check if source is hidden (e.g. mobile editor view)
  const isHidden = source.offsetParent === null || source.offsetWidth === 0;
  let targetElement: HTMLElement = source;
  let tempContainer: HTMLElement | null = null;

  if (isHidden) {
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
    targetElement = clone;
  }

  try {
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

    // Balanced-parenthesis replacer so nested expressions like color-mix(in oklab, oklch(...) 60%, transparent) work cleanly
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

    // 2. High-resolution pixelated rasterization (2x scale for sharp, high-DPI graphics)
    const canvas = await html2canvas(targetElement, {
      scale: 2.0,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
        // Sanitize inline <style> tags as defense-in-depth
        const styleTags = clonedDoc.querySelectorAll('style');
        styleTags.forEach((tag) => {
          if (tag.textContent && UNSUPPORTED_COLOR_REGEX.test(tag.textContent)) {
            tag.textContent = replaceUnsupportedColors(tag.textContent);
          }
        });

        // Resolve computed CSS colors (including external <link rel="stylesheet"> Tailwind v4 oklch/oklab/color-mix rules)
        // directly onto inline !important styles so html2canvas receives standard rgb/rgba values.
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
      },
    });

    // Cleanup temporary elements / restore scale wrapper
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
    if (scaleWrapper) {
      scaleWrapper.style.transform = prevTransform;
      scaleWrapper.style.transition = prevTransition;
    }

    // 3. Convert high-resolution pixelated canvas into JPEG image data
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // 4. Instantiate jsPDF using exact selected paper format
    const pdf = new JsPdfConstructor({
      orientation: 'portrait',
      unit: 'mm',
      format: paperSpec.jsPdfFormat,
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Multi-page pagination if content exceeds 1 A4 page
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

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

    return true;
  } catch (error) {
    console.error('High-resolution pixelated PDF generation error:', error);
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
    if (scaleWrapper) {
      scaleWrapper.style.transform = prevTransform;
      scaleWrapper.style.transition = prevTransition;
    }
    return false;
  }
}

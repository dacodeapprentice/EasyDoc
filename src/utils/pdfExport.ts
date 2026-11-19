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

    // Helper to convert modern CSS color functions (oklch, oklab) to standard rgba
    const oklchToRgba = (colorStr: string): string => {
      if (!colorStr || (!colorStr.includes('oklch') && !colorStr.includes('oklab'))) return colorStr;
      try {
        const c = document.createElement('canvas');
        c.width = 1;
        c.height = 1;
        const ctx = c.getContext('2d');
        if (!ctx) return '#0f172a';
        ctx.fillStyle = '#0f172a';
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
      } catch {
        return '#0f172a';
      }
    };

    const sanitizeOklch = (val: string): string => {
      if (!val || (!val.includes('oklch') && !val.includes('oklab'))) return val;
      return val
        .replace(/oklch\([^)]+\)/gi, (m) => oklchToRgba(m))
        .replace(/oklab\([^)]+\)/gi, (m) => oklchToRgba(m));
    };

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
        // Sanitize styles in cloned document
        const styleTags = clonedDoc.querySelectorAll('style');
        styleTags.forEach((tag) => {
          if (tag.textContent && (tag.textContent.includes('oklch') || tag.textContent.includes('oklab'))) {
            tag.textContent = sanitizeOklch(tag.textContent);
          }
        });

        // Sanitize any elements with oklch in clonedEl
        const allNodes = clonedEl.querySelectorAll('*');
        allNodes.forEach((node) => {
          const el = node as HTMLElement;
          if (el.style) {
            const props = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'boxShadow'];
            props.forEach((prop) => {
              const val = (el.style as any)[prop];
              if (val && typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                el.style.setProperty(kebab, sanitizeOklch(val), 'important');
              }
            });
          }
        });
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

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { Upload, X, ZoomIn, ZoomOut, Check, Crop, Maximize2 } from 'lucide-react';
import { LanguageCode } from '../types/document';
import { getTranslation } from '../utils/i18n';

export type ImageUploadMode = 'photo' | 'logo';

interface ImageUploadCropProps {
  label: string;
  shape: 'circle' | 'square';
  mode?: ImageUploadMode;
  currentImage?: string | null;
  onImageChange: (base64: string | null) => void;
  lang?: LanguageCode;
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type HandleCorner = 'nw' | 'ne' | 'sw' | 'se';

const STAGE_W = 340;
const STAGE_H = 280;
const PHOTO_MASK_SIZE = 200;
const PHOTO_MASK_X = (STAGE_W - PHOTO_MASK_SIZE) / 2;
const PHOTO_MASK_Y = (STAGE_H - PHOTO_MASK_SIZE) / 2;
const LOGO_STAGE_PAD = 20;
const MIN_CROP_SIZE = 28;
const MAX_LOGO_OUTPUT_SIDE = 800;

const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  backgroundImage:
    'linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
};

export function computeLogoCropFrame(natW: number, natH: number): CropRect {
  if (!natW || !natH) {
    return { x: PHOTO_MASK_X, y: PHOTO_MASK_Y, w: PHOTO_MASK_SIZE, h: PHOTO_MASK_SIZE };
  }
  const maxW = STAGE_W - LOGO_STAGE_PAD * 2;
  const maxH = STAGE_H - LOGO_STAGE_PAD * 2;
  const fitScale = Math.min(maxW / natW, maxH / natH);
  const w = natW * fitScale;
  const h = natH * fitScale;
  return {
    x: (STAGE_W - w) / 2,
    y: (STAGE_H - h) / 2,
    w,
    h,
  };
}

export function computeLogoOutputDimensions(
  srcNatW: number,
  srcNatH: number,
  maxSide: number = MAX_LOGO_OUTPUT_SIDE
): { outW: number; outH: number } {
  if (srcNatW <= 0 || srcNatH <= 0) return { outW: 1, outH: 1 };
  const longest = Math.max(srcNatW, srcNatH);
  const scale = longest > maxSide ? maxSide / longest : 1;
  return {
    outW: Math.max(1, Math.round(srcNatW * scale)),
    outH: Math.max(1, Math.round(srcNatH * scale)),
  };
}

export function normalizeSvgString(rawText: string, maxSide: number = MAX_LOGO_OUTPUT_SIDE): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawText, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  const svgEl = doc.documentElement;
  if (parserError || !svgEl || svgEl.tagName.toLowerCase() !== 'svg') {
    throw new Error('Invalid SVG file');
  }

  // Strip scripts and inline event handlers for safety
  doc.querySelectorAll('script').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  const viewBoxAttr = svgEl.getAttribute('viewBox');
  let vbW = 0;
  let vbH = 0;
  if (viewBoxAttr) {
    const parts = viewBoxAttr
      .trim()
      .split(/[\s,]+/)
      .map((n) => parseFloat(n));
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2] > 0 && parts[3] > 0) {
      vbW = parts[2];
      vbH = parts[3];
    }
  }

  const parseLength = (val: string | null): number => {
    if (!val || val.includes('%')) return 0;
    const num = parseFloat(val);
    return Number.isFinite(num) && num > 0 ? num : 0;
  };

  const attrW = parseLength(svgEl.getAttribute('width'));
  const attrH = parseLength(svgEl.getAttribute('height'));

  let baseW = attrW || vbW || 400;
  let baseH = attrH || vbH || 400;
  if (attrW && !attrH && vbW && vbH) {
    baseH = (attrW * vbH) / vbW;
  } else if (!attrW && attrH && vbW && vbH) {
    baseW = (attrH * vbW) / vbH;
  }

  if (!viewBoxAttr && attrW > 0 && attrH > 0) {
    svgEl.setAttribute('viewBox', `0 0 ${attrW} ${attrH}`);
  }

  const longest = Math.max(baseW, baseH);
  const scale = longest > 0 ? maxSide / longest : 1;
  const targetW = Math.max(1, Math.round(baseW * scale));
  const targetH = Math.max(1, Math.round(baseH * scale));

  svgEl.setAttribute('width', String(targetW));
  svgEl.setAttribute('height', String(targetH));
  if (!svgEl.getAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const serialized = new XMLSerializer().serializeToString(svgEl);
  const bytes = new TextEncoder().encode(serialized);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

export const ImageUploadCrop: React.FC<ImageUploadCropProps> = ({
  label,
  shape,
  mode = 'photo',
  currentImage,
  onImageChange,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const maskId = `cropHole-${useId().replace(/:/g, '')}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Crop Controls
  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [logoCropRect, setLogoCropRect] = useState<CropRect>(() => computeLogoCropFrame(0, 0));

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastOffset = useRef({ x: 0, y: 0 });

  const [activeHandle, setActiveHandle] = useState<HandleCorner | null>(null);
  const handleStart = useRef<{ x: number; y: number; rect: CropRect }>({
    x: 0,
    y: 0,
    rect: { x: 0, y: 0, w: 0, h: 0 },
  });

  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);

  const isLogoMode = mode === 'logo';

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setRawSrc(null);
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (!rawSrc) return;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNatW(w);
      setNatH(h);
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      if (isLogoMode) {
        setLogoCropRect(computeLogoCropFrame(w, h));
      }
    };
    img.src = rawSrc;
  }, [rawSrc, isLogoMode]);

  const getRenderedSize = useCallback(
    (z: number) => {
      if (!natW || !natH) return { w: 0, h: 0 };
      if (isLogoMode) {
        const fitScale = Math.min(
          (STAGE_W - LOGO_STAGE_PAD * 2) / natW,
          (STAGE_H - LOGO_STAGE_PAD * 2) / natH
        );
        return { w: natW * fitScale * z, h: natH * fitScale * z };
      }
      const fitScale = Math.max(PHOTO_MASK_SIZE / natW, PHOTO_MASK_SIZE / natH);
      return { w: natW * fitScale * z, h: natH * fitScale * z };
    },
    [natW, natH, isLogoMode]
  );

  const activeMask: CropRect = isLogoMode
    ? logoCropRect
    : { x: PHOTO_MASK_X, y: PHOTO_MASK_Y, w: PHOTO_MASK_SIZE, h: PHOTO_MASK_SIZE };

  const clampOffset = useCallback(
    (ox: number, oy: number, z: number, rect: CropRect = activeMask) => {
      const { w: rW, h: rH } = getRenderedSize(z);
      if (!rW || !rH) return { x: 0, y: 0 };
      const baseLeft = (STAGE_W - rW) / 2;
      const baseTop = (STAGE_H - rH) / 2;
      const minX = rect.x + rect.w - baseLeft - rW;
      const maxX = rect.x - baseLeft;
      const minY = rect.y + rect.h - baseTop - rH;
      const maxY = rect.y - baseTop;
      return {
        x: minX > maxX ? (minX + maxX) / 2 : Math.max(minX, Math.min(maxX, ox)),
        y: minY > maxY ? (minY + maxY) / 2 : Math.max(minY, Math.min(maxY, oy)),
      };
    },
    [activeMask, getRenderedSize]
  );

  const handleApply = useCallback(() => {
    const { w: rW, h: rH } = getRenderedSize(zoom);
    if (!rW || !rH || !rawSrc || !natW || !natH) return;

    const imgLeft = (STAGE_W - rW) / 2 + offset.x;
    const imgTop = (STAGE_H - rH) / 2 + offset.y;

    const srcRenderedX = activeMask.x - imgLeft;
    const srcRenderedY = activeMask.y - imgTop;

    const scaleX = natW / rW;
    const scaleY = natH / rH;
    const srcNatX = Math.max(0, Math.min(natW - 1, srcRenderedX * scaleX));
    const srcNatY = Math.max(0, Math.min(natH - 1, srcRenderedY * scaleY));
    const srcNatW = Math.max(1, Math.min(natW - srcNatX, activeMask.w * scaleX));
    const srcNatH = Math.max(1, Math.min(natH - srcNatY, activeMask.h * scaleY));

    const canvas = document.createElement('canvas');

    if (isLogoMode) {
      const { outW, outH } = computeLogoOutputDimensions(srcNatW, srcNatH, MAX_LOGO_OUTPUT_SIDE);
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, outW, outH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, srcNatX, srcNatY, srcNatW, srcNatH, 0, 0, outW, outH);
        const baked = canvas.toDataURL('image/png');
        onImageChange(baked);
        closeModal();
      };
      img.src = rawSrc;
      return;
    }

    // Profile photo mode: 240x240 JPEG
    const OUT = 240;
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, srcNatX, srcNatY, srcNatW, srcNatH, 0, 0, OUT, OUT);
      const baked = canvas.toDataURL('image/jpeg', 0.85);
      onImageChange(baked);
      closeModal();
    };
    img.src = rawSrc;
  }, [activeMask, closeModal, getRenderedSize, isLogoMode, natH, natW, offset.x, offset.y, onImageChange, rawSrc, zoom]);

  // Keyboard accessibility (capture phase so arrow keys never scroll the page or slide the range input)
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Enter') {
        const targetEl = e.target as HTMLElement | null;
        const activeEl = document.activeElement as HTMLElement | null;
        const focusedButton = targetEl?.closest('button') || activeEl?.closest('button');
        const focusedInteractive =
          targetEl?.closest('a, select, textarea') || activeEl?.closest('a, select, textarea');
        if (focusedButton || focusedInteractive) {
          // Do not trigger Apply when focus is on another button (or let Apply's own native click fire once)
          return;
        }
        e.preventDefault();
        handleApply();
        return;
      }

      const step = 5;
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'ArrowLeft') setOffset((prev) => clampOffset(prev.x - step, prev.y, zoom));
        if (e.key === 'ArrowRight') setOffset((prev) => clampOffset(prev.x + step, prev.y, zoom));
        if (e.key === 'ArrowUp') setOffset((prev) => clampOffset(prev.x, prev.y - step, zoom));
        if (e.key === 'ArrowDown') setOffset((prev) => clampOffset(prev.x, prev.y + step, zoom));
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isModalOpen, zoom, clampOffset, closeModal, handleApply]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (isSvg && isLogoMode) {
      try {
        const rawText = await file.text();
        const svgDataUri = normalizeSvgString(rawText, MAX_LOGO_OUTPUT_SIDE);
        const testImg = new Image();
        testImg.onload = () => {
          setRawSrc(svgDataUri);
          setIsModalOpen(true);
        };
        testImg.src = svgDataUri;
      } catch (err) {
        console.warn('Failed to parse uploaded SVG logo:', err);
      }
      return;
    }

    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUri = evt.target?.result as string;
      const tempImg = new Image();
      tempImg.onload = () => {
        const maxDim = isLogoMode ? 1600 : 1200;
        if (tempImg.width > maxDim || tempImg.height > maxDim) {
          const ratio = Math.min(maxDim / tempImg.width, maxDim / tempImg.height);
          const offCanvas = document.createElement('canvas');
          offCanvas.width = Math.round(tempImg.width * ratio);
          offCanvas.height = Math.round(tempImg.height * ratio);
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
            offCtx.imageSmoothingEnabled = true;
            offCtx.imageSmoothingQuality = 'high';
            offCtx.drawImage(tempImg, 0, 0, offCanvas.width, offCanvas.height);
            setRawSrc(
              isLogoMode
                ? offCanvas.toDataURL('image/png')
                : offCanvas.toDataURL('image/jpeg', 0.9)
            );
          } else {
            setRawSrc(dataUri);
          }
        } else {
          setRawSrc(dataUri);
        }
        setIsModalOpen(true);
      };
      tempImg.src = dataUri;
    };
    reader.readAsDataURL(file);
  };

  const updateCropHandleDrag = (clientX: number, clientY: number) => {
    if (!activeHandle || !isLogoMode) return;
    const dx = clientX - handleStart.current.x;
    const dy = clientY - handleStart.current.y;
    const start = handleStart.current.rect;
    const { w: rW, h: rH } = getRenderedSize(zoom);
    const imgLeft = (STAGE_W - rW) / 2 + offset.x;
    const imgTop = (STAGE_H - rH) / 2 + offset.y;

    const minX = Math.max(LOGO_STAGE_PAD, imgLeft);
    const maxX = Math.min(STAGE_W - LOGO_STAGE_PAD, imgLeft + rW);
    const minY = Math.max(LOGO_STAGE_PAD, imgTop);
    const maxY = Math.min(STAGE_H - LOGO_STAGE_PAD, imgTop + rH);

    let left = start.x;
    let top = start.y;
    let right = start.x + start.w;
    let bottom = start.y + start.h;

    if (activeHandle === 'nw' || activeHandle === 'sw') {
      left = Math.max(minX, Math.min(right - MIN_CROP_SIZE, start.x + dx));
    }
    if (activeHandle === 'ne' || activeHandle === 'se') {
      right = Math.min(maxX, Math.max(left + MIN_CROP_SIZE, start.x + start.w + dx));
    }
    if (activeHandle === 'nw' || activeHandle === 'ne') {
      top = Math.max(minY, Math.min(bottom - MIN_CROP_SIZE, start.y + dy));
    }
    if (activeHandle === 'sw' || activeHandle === 'se') {
      bottom = Math.min(maxY, Math.max(top + MIN_CROP_SIZE, start.y + start.h + dy));
    }

    setLogoCropRect({ x: left, y: top, w: right - left, h: bottom - top });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastOffset.current = { ...offset };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (activeHandle) {
      updateCropHandleDrag(e.clientX, e.clientY);
      return;
    }
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const raw = { x: lastOffset.current.x + dx, y: lastOffset.current.y + dy };
    setOffset(clampOffset(raw.x, raw.y, zoom));
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    lastOffset.current = { ...offset };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (activeHandle) {
      updateCropHandleDrag(touch.clientX, touch.clientY);
      return;
    }
    if (!isDragging) return;
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    const raw = { x: lastOffset.current.x + dx, y: lastOffset.current.y + dy };
    setOffset(clampOffset(raw.x, raw.y, zoom));
  };

  const onHandleMouseDown = (corner: HandleCorner) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(corner);
    handleStart.current = { x: e.clientX, y: e.clientY, rect: { ...logoCropRect } };
  };

  const onHandleTouchStart = (corner: HandleCorner) => (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setActiveHandle(corner);
    handleStart.current = { x: touch.clientX, y: touch.clientY, rect: { ...logoCropRect } };
  };

  const handleZoomChange = (newZ: number) => {
    setZoom(newZ);
    if (isLogoMode) {
      const { w: newRW, h: newRH } = getRenderedSize(newZ);
      let nextRect = { ...logoCropRect };
      if (nextRect.w > newRW || nextRect.h > newRH) {
        const clampedW = Math.min(nextRect.w, newRW);
        const clampedH = Math.min(nextRect.h, newRH);
        nextRect = {
          x: Math.max(LOGO_STAGE_PAD, Math.min(STAGE_W - LOGO_STAGE_PAD - clampedW, nextRect.x)),
          y: Math.max(LOGO_STAGE_PAD, Math.min(STAGE_H - LOGO_STAGE_PAD - clampedH, nextRect.y)),
          w: clampedW,
          h: clampedH,
        };
        setLogoCropRect(nextRect);
      }
      setOffset((prev) => clampOffset(prev.x, prev.y, newZ, nextRect));
    } else {
      setOffset((prev) => clampOffset(prev.x, prev.y, newZ));
    }
  };

  const handleResetLogoFit = () => {
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
    setLogoCropRect(computeLogoCropFrame(natW, natH));
  };

  const defaultLogoFrame = isLogoMode ? computeLogoCropFrame(natW, natH) : null;
  const isLogoModified = Boolean(
    isLogoMode &&
      defaultLogoFrame &&
      (zoom > 1.005 ||
        Math.abs(offset.x) > 0.5 ||
        Math.abs(offset.y) > 0.5 ||
        Math.abs(logoCropRect.w - defaultLogoFrame.w) > 1.5 ||
        Math.abs(logoCropRect.h - defaultLogoFrame.h) > 1.5)
  );

  const { w: rW, h: rH } = getRenderedSize(zoom);
  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    width: rW > 0 ? `${rW}px` : 'auto',
    height: rH > 0 ? `${rH}px` : 'auto',
    left: rW > 0 ? `${(STAGE_W - rW) / 2 + offset.x}px` : '0',
    top: rH > 0 ? `${(STAGE_H - rH) / 2 + offset.y}px` : '0',
    pointerEvents: 'none',
    userSelect: 'none',
  };

  return (
    <div className="mb-4 pb-4 border-b border-zinc-200">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
          {label}
        </label>
        {currentImage && (
          <button
            type="button"
            onClick={() => onImageChange(null)}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>{t('remove_photo')}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Thumbnail Preview / Upload Trigger */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer border-2 transition-colors flex items-center justify-center shrink-0 overflow-hidden ${
            shape === 'circle'
              ? 'w-16 h-16 rounded-full'
              : isLogoMode
              ? 'w-24 h-16 rounded-xl p-1'
              : 'w-16 h-16 rounded-xl'
          } ${
            currentImage
              ? isLogoMode
                ? 'border-blue-600'
                : 'border-blue-600 bg-white'
              : 'border-dashed border-zinc-300 bg-zinc-50 hover:border-blue-600 hover:bg-blue-50/40'
          }`}
          style={
            currentImage
              ? isLogoMode
                ? CHECKERBOARD_STYLE
                : {
                    backgroundImage: `url(${currentImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
              : {}
          }
          title={t('upload_adjust_hint')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {currentImage ? (
            <>
              {isLogoMode && (
                <img
                  src={currentImage}
                  alt={label}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              )}
              <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Crop className="w-4 h-4" />
              </div>
            </>
          ) : (
            <div className="text-center p-1 text-zinc-400 group-hover:text-blue-600 transition-colors">
              <Upload className="w-5 h-5 mx-auto mb-0.5" />
              <span className="text-[9px] font-semibold uppercase block">{t('upload_photo')}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-500 leading-snug">
          <p className="font-medium text-zinc-700">
            {currentImage ? t('change_photo') : shape === 'circle' ? t('profile_photo') : t('company_logo')}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {t('image_compression_hint')}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={
            isLogoMode
              ? 'image/jpeg,image/png,image/webp,image/svg+xml,.svg'
              : 'image/jpeg,image/png,image/webp'
          }
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {/* Interactive Crop Modal */}
      {isModalOpen && rawSrc && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-sm w-full border border-zinc-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  {shape === 'circle' ? t('profile_photo') : t('company_logo')}
                </h4>
                <p className="text-[11px] text-zinc-500">{t('crop_instruction')}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                aria-label={t('close_modal')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stage */}
            <div
              className={`relative overflow-hidden cursor-grab active:cursor-grabbing mx-auto select-none touch-none ${
                isLogoMode ? '' : 'bg-zinc-950'
              }`}
              style={{
                width: `${STAGE_W}px`,
                height: `${STAGE_H}px`,
                ...(isLogoMode ? CHECKERBOARD_STYLE : {}),
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => {
                setIsDragging(false);
                setActiveHandle(null);
              }}
            >
              <img src={rawSrc} style={imgStyle} draggable={false} alt={t('image_to_crop_alt')} />

              {/* Mask Overlay */}
              <svg className="absolute inset-0 pointer-events-none" width={STAGE_W} height={STAGE_H}>
                <defs>
                  <mask id={maskId}>
                    <rect width="100%" height="100%" fill="white" />
                    {shape === 'circle' && !isLogoMode ? (
                      <circle cx={STAGE_W / 2} cy={STAGE_H / 2} r={PHOTO_MASK_SIZE / 2} fill="black" />
                    ) : (
                      <rect
                        x={activeMask.x}
                        y={activeMask.y}
                        width={activeMask.w}
                        height={activeMask.h}
                        rx={isLogoMode ? 2 : 12}
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill={isLogoMode ? 'rgba(24, 24, 27, 0.45)' : 'rgba(9, 9, 11, 0.72)'}
                  mask={`url(#${maskId})`}
                />
                {shape === 'circle' && !isLogoMode ? (
                  <circle
                    cx={STAGE_W / 2}
                    cy={STAGE_H / 2}
                    r={PHOTO_MASK_SIZE / 2}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                  />
                ) : (
                  <rect
                    x={activeMask.x}
                    y={activeMask.y}
                    width={activeMask.w}
                    height={activeMask.h}
                    rx={isLogoMode ? 2 : 12}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                )}
              </svg>

              {/* Corner Crop Handles (Logo Mode) */}
              {isLogoMode && natW > 0 && (
                <>
                  <button
                    type="button"
                    aria-label={t('resize_crop_nw')}
                    onMouseDown={onHandleMouseDown('nw')}
                    onTouchStart={onHandleTouchStart('nw')}
                    style={{ left: `${activeMask.x - 6}px`, top: `${activeMask.y - 6}px` }}
                    className="absolute w-3 h-3 rounded-full bg-white border-2 border-blue-600 shadow cursor-nwse-resize z-10"
                  />
                  <button
                    type="button"
                    aria-label={t('resize_crop_ne')}
                    onMouseDown={onHandleMouseDown('ne')}
                    onTouchStart={onHandleTouchStart('ne')}
                    style={{ left: `${activeMask.x + activeMask.w - 6}px`, top: `${activeMask.y - 6}px` }}
                    className="absolute w-3 h-3 rounded-full bg-white border-2 border-blue-600 shadow cursor-nesw-resize z-10"
                  />
                  <button
                    type="button"
                    aria-label={t('resize_crop_sw')}
                    onMouseDown={onHandleMouseDown('sw')}
                    onTouchStart={onHandleTouchStart('sw')}
                    style={{ left: `${activeMask.x - 6}px`, top: `${activeMask.y + activeMask.h - 6}px` }}
                    className="absolute w-3 h-3 rounded-full bg-white border-2 border-blue-600 shadow cursor-nesw-resize z-10"
                  />
                  <button
                    type="button"
                    aria-label={t('resize_crop_se')}
                    onMouseDown={onHandleMouseDown('se')}
                    onTouchStart={onHandleTouchStart('se')}
                    style={{
                      left: `${activeMask.x + activeMask.w - 6}px`,
                      top: `${activeMask.y + activeMask.h - 6}px`,
                    }}
                    className="absolute w-3 h-3 rounded-full bg-white border-2 border-blue-600 shadow cursor-nwse-resize z-10"
                  />
                </>
              )}
            </div>

            {/* Zoom Slider Controls */}
            <div className="px-5 py-3 bg-zinc-50/70 border-t border-zinc-200 flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.02"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                onKeyDown={(e) => {
                  if (
                    e.key === 'ArrowLeft' ||
                    e.key === 'ArrowRight' ||
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowDown'
                  ) {
                    e.preventDefault();
                  }
                }}
                className="w-full accent-blue-600 h-1.5 bg-zinc-200 rounded-lg cursor-pointer"
                aria-label={t('zoom_level')}
              />
              <ZoomIn className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="text-xs font-mono-tabular tabular-nums text-zinc-600 w-10 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3.5 border-t border-zinc-200 flex items-center justify-between gap-2 bg-white">
              <div>
                {isLogoMode && isLogoModified && (
                  <button
                    type="button"
                    onClick={handleResetLogoFit}
                    className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{t('fit_whole_logo')}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('apply_crop')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

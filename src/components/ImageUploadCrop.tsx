import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ZoomIn, ZoomOut, Check, Crop } from 'lucide-react';
import { LanguageCode } from '../types/document';
import { getTranslation } from '../utils/i18n';

interface ImageUploadCropProps {
  label: string;
  shape: 'circle' | 'square';
  currentImage?: string | null;
  onImageChange: (base64: string | null) => void;
  lang?: LanguageCode;
}

const STAGE_W = 340;
const STAGE_H = 280;
const MASK_SIZE = 200;
const MASK_X = (STAGE_W - MASK_SIZE) / 2;
const MASK_Y = (STAGE_H - MASK_SIZE) / 2;

export const ImageUploadCrop: React.FC<ImageUploadCropProps> = ({
  label,
  shape,
  currentImage,
  onImageChange,
  lang = 'en',
}) => {
  const t = (k: string) => getTranslation(lang, k);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Crop Controls
  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastOffset = useRef({ x: 0, y: 0 });

  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);

  useEffect(() => {
    if (!rawSrc) return;
    const img = new Image();
    img.onload = () => {
      setNatW(img.naturalWidth);
      setNatH(img.naturalHeight);
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = rawSrc;
  }, [rawSrc]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
      if (e.key === 'Enter') handleApply();
      // Arrow keys navigation to nudge position
      const step = 5;
      if (e.key === 'ArrowLeft') setOffset((prev) => clamp(prev.x - step, prev.y, zoom));
      if (e.key === 'ArrowRight') setOffset((prev) => clamp(prev.x + step, prev.y, zoom));
      if (e.key === 'ArrowUp') setOffset((prev) => clamp(prev.x, prev.y - step, zoom));
      if (e.key === 'ArrowDown') setOffset((prev) => clamp(prev.x, prev.y + step, zoom));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, zoom, offset, natW, natH, rawSrc]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUri = evt.target?.result as string;
      // Pre-scale large camera images (>1200px) down to prevent state/storage bloat
      const tempImg = new Image();
      tempImg.onload = () => {
        const maxDim = 1200;
        if (tempImg.width > maxDim || tempImg.height > maxDim) {
          const ratio = Math.min(maxDim / tempImg.width, maxDim / tempImg.height);
          const offCanvas = document.createElement('canvas');
          offCanvas.width = Math.round(tempImg.width * ratio);
          offCanvas.height = Math.round(tempImg.height * ratio);
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(tempImg, 0, 0, offCanvas.width, offCanvas.height);
            setRawSrc(offCanvas.toDataURL('image/jpeg', 0.9));
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
    e.target.value = '';
  };

  const getRenderedSize = (z: number) => {
    if (!natW || !natH) return { w: 0, h: 0 };
    const fitScale = Math.max(MASK_SIZE / natW, MASK_SIZE / natH);
    return { w: natW * fitScale * z, h: natH * fitScale * z };
  };

  const clamp = (ox: number, oy: number, z: number) => {
    const { w, h } = getRenderedSize(z);
    const maxX = Math.max(0, (w - MASK_SIZE) / 2);
    const maxY = Math.max(0, (h - MASK_SIZE) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastOffset.current = { ...offset };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const raw = { x: lastOffset.current.x + dx, y: lastOffset.current.y + dy };
    setOffset(clamp(raw.x, raw.y, zoom));
  };

  const onMouseUp = () => setIsDragging(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    lastOffset.current = { ...offset };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    const raw = { x: lastOffset.current.x + dx, y: lastOffset.current.y + dy };
    setOffset(clamp(raw.x, raw.y, zoom));
  };

  const handleZoomChange = (newZ: number) => {
    setZoom(newZ);
    setOffset((prev) => clamp(prev.x, prev.y, newZ));
  };

  const handleApply = () => {
    const { w: rW, h: rH } = getRenderedSize(zoom);
    if (!rW || !rH || !rawSrc) return;

    const imgLeft = (STAGE_W - rW) / 2 + offset.x;
    const imgTop = (STAGE_H - rH) / 2 + offset.y;

    const srcRenderedX = MASK_X - imgLeft;
    const srcRenderedY = MASK_Y - imgTop;

    const scaleX = natW / rW;
    const scaleY = natH / rH;
    const srcNatX = Math.max(0, srcRenderedX * scaleX);
    const srcNatY = Math.max(0, srcRenderedY * scaleY);
    const srcNatW = Math.min(natW, MASK_SIZE * scaleX);
    const srcNatH = Math.min(natH, MASK_SIZE * scaleY);

    // Optimized 240x240 px canvas output to keep base64 lightweight (<25 KB)
    const OUT = 240;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, srcNatX, srcNatY, srcNatW, srcNatH, 0, 0, OUT, OUT);
      const baked = canvas.toDataURL('image/jpeg', 0.85);
      onImageChange(baked);
      setIsModalOpen(false);
      setRawSrc(null);
    };
    img.src = rawSrc;
  };

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
            shape === 'circle' ? 'w-16 h-16 rounded-full' : 'w-16 h-16 rounded-xl'
          } ${
            currentImage
              ? 'border-blue-600 bg-white'
              : 'border-dashed border-zinc-300 bg-zinc-50 hover:border-blue-600 hover:bg-blue-50/40'
          }`}
          style={
            currentImage
              ? {
                  backgroundImage: `url(${currentImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}
          }
          title="Click to upload and crop photo"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
        >
          {currentImage ? (
            <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Crop className="w-4 h-4" />
            </div>
          ) : (
            <div className="text-center p-1 text-zinc-400 group-hover:text-blue-600 transition-colors">
              <Upload className="w-5 h-5 mx-auto mb-0.5" />
              <span className="text-[9px] font-semibold uppercase block">{t('upload_photo')}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-500 leading-snug">
          <p className="font-medium text-zinc-700">
            {currentImage ? t('change_photo') : (shape === 'circle' ? t('profile_photo') : t('company_logo'))}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Lightweight, auto-compressed for fast PDF export and auto-saving.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
                <p className="text-[11px] text-zinc-500">
                  {t('crop_instruction')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stage */}
            <div
              className="relative bg-zinc-950 overflow-hidden cursor-grab active:cursor-grabbing mx-auto select-none touch-none"
              style={{ width: `${STAGE_W}px`, height: `${STAGE_H}px` }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => setIsDragging(false)}
            >
              <img src={rawSrc} style={imgStyle} draggable={false} alt="To crop" />

              {/* Mask Overlay */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={STAGE_W}
                height={STAGE_H}
              >
                <defs>
                  <mask id="cropHole">
                    <rect width="100%" height="100%" fill="white" />
                    {shape === 'circle' ? (
                      <circle
                        cx={STAGE_W / 2}
                        cy={STAGE_H / 2}
                        r={MASK_SIZE / 2}
                        fill="black"
                      />
                    ) : (
                      <rect
                        x={MASK_X}
                        y={MASK_Y}
                        width={MASK_SIZE}
                        height={MASK_SIZE}
                        rx="12"
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(9, 9, 11, 0.72)"
                  mask="url(#cropHole)"
                />
                {shape === 'circle' ? (
                  <circle
                    cx={STAGE_W / 2}
                    cy={STAGE_H / 2}
                    r={MASK_SIZE / 2}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                  />
                ) : (
                  <rect
                    x={MASK_X}
                    y={MASK_Y}
                    width={MASK_SIZE}
                    height={MASK_SIZE}
                    rx="12"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                  />
                )}
              </svg>
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
                className="w-full accent-blue-600 h-1.5 bg-zinc-200 rounded-lg cursor-pointer"
                aria-label="Zoom level"
              />
              <ZoomIn className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="text-xs font-mono-tabular tabular-nums text-zinc-600 w-10 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3.5 border-t border-zinc-200 flex items-center justify-end gap-2 bg-white">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
};

import React, { ReactNode } from 'react';
import { DocumentAssetBundle } from '../../types/document';

interface DocumentSheetProps {
  assets: DocumentAssetBundle;
  children: ReactNode;
  className?: string;
  paddingPxOverride?: number;
  showHeaderAccent?: boolean;
  fullBleedSplit?: boolean;
}

/**
 * Common mountable sheet surface for all document templates.
 * Mounts paper dimensions, density-scaled padding, Google Font CSS variables,
 * and design-specific structural framing.
 */
export const DocumentSheet: React.FC<DocumentSheetProps> = ({
  assets,
  children,
  className = '',
  paddingPxOverride,
  showHeaderAccent = true,
  fullBleedSplit = false,
}) => {
  const { theme, font, typography, layout, design } = assets;

  const fontVars = {
    '--doc-font-heading': typography.heading.cssFamily,
    '--doc-font-body': typography.body.cssFamily,
    '--doc-font-mono': typography.mono.cssFamily,
  } as React.CSSProperties;

  const paddingValue = fullBleedSplit ? 0 : paddingPxOverride ?? layout.paddingPx;
  const isCustomPaper = layout.paper.id === 'custom';
  const effectivePadding =
    isCustomPaper && Math.min(layout.paper.widthPx, layout.paper.heightPx) < 40
      ? 0
      : isCustomPaper && Math.min(layout.paper.widthPx, layout.paper.heightPx) < paddingValue * 3
      ? Math.max(0, Math.round(Math.min(layout.paper.widthPx, layout.paper.heightPx) * 0.06))
      : paddingValue;

  return (
    <div
      className={`bg-white text-slate-900 w-full transition-all relative ${font.cssClass} ${className}`}
      style={{
        ...fontVars,
        boxSizing: 'border-box',
        ...(isCustomPaper
          ? {
              width: `${layout.paper.widthPx}px`,
              height: `${layout.paper.heightPx}px`,
              maxHeight: `${layout.paper.heightPx}px`,
              overflow: 'hidden',
            }
          : {
              minHeight: `${layout.paper.heightPx}px`,
              overflowX: 'hidden',
            }),
        padding: `${effectivePadding}px`,
        fontFamily: typography.body.cssFamily,
        overflowWrap: 'anywhere',
      }}
    >
      {showHeaderAccent && design.id === 'executive-spine' && (
        <div
          data-pdf-vertical-accent="true"
          className={`absolute left-0 top-0 bottom-0 ${layout.accentBarWidthClass} pointer-events-none`}
          style={{ backgroundColor: theme.primary }}
        />
      )}

      {showHeaderAccent && design.id === 'modern-banner' && (
        <div
          className={`absolute left-0 top-0 right-0 ${layout.accentBannerHeightClass} pointer-events-none`}
          style={{ backgroundColor: theme.primary }}
        />
      )}

      {showHeaderAccent && design.id === 'editorial-serif' && (
        <>
          <div
            className="absolute left-0 top-0 right-0 h-1 pointer-events-none"
            style={{ backgroundColor: theme.primary }}
          />
          <div
            className="absolute left-0 bottom-0 right-0 h-1 pointer-events-none"
            style={{ backgroundColor: theme.primary }}
          />
        </>
      )}

      {showHeaderAccent && design.id === 'swiss-grid' && (
        <div
          className="absolute left-0 top-0 right-0 h-[3px] pointer-events-none"
          style={{ backgroundColor: theme.textHeader }}
        />
      )}

      {children}
    </div>
  );
};

interface DocumentOrnateFrameProps {
  assets: DocumentAssetBundle;
}

/**
 * Decorative frame mounted inside framed templates (e.g. Certificate) adapted per design.
 */
export const DocumentOrnateFrame: React.FC<DocumentOrnateFrameProps> = ({ assets }) => {
  const { theme, layout, design } = assets;

  if (design.id === 'swiss-grid') {
    return (
      <div
        className={`absolute ${
          layout.isCompact ? 'inset-3' : layout.isLarge ? 'inset-8' : 'inset-5'
        } pointer-events-none border`}
        style={{ borderColor: theme.textHeader }}
      />
    );
  }

  if (design.id === 'modern-banner') {
    return (
      <>
        <div
          className={`absolute top-0 left-0 right-0 ${layout.isCompact ? 'h-3' : 'h-5'} pointer-events-none`}
          style={{ backgroundColor: theme.primary }}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 ${layout.isCompact ? 'h-2' : 'h-3'} pointer-events-none`}
          style={{ backgroundColor: theme.secondary }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`absolute ${
          layout.isCompact ? 'inset-3' : layout.isLarge ? 'inset-8' : 'inset-5'
        } pointer-events-none border-2`}
        style={{ borderColor: theme.primary }}
      />
      <div
        className={`absolute ${
          layout.isCompact ? 'inset-4' : layout.isLarge ? 'inset-10' : 'inset-6'
        } pointer-events-none border`}
        style={{ borderColor: theme.border }}
      />
    </>
  );
};

interface DocumentLogoProps {
  src: string;
  alt: string;
  assets: DocumentAssetBundle;
  variant?: 'square' | 'circle';
}

export const DocumentLogo: React.FC<DocumentLogoProps> = ({
  src,
  alt,
  assets,
  variant = 'square',
}) => {
  const { layout, theme } = assets;
  if (variant === 'circle') {
    const sizeClass = layout.isUltraNarrow
      ? 'w-14 h-14'
      : layout.isCompact
      ? 'w-16 h-16'
      : layout.isLarge
      ? 'w-28 h-28'
      : 'w-24 h-24';
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover border-2 shadow-sm shrink-0`}
        style={{ borderColor: theme.primary }}
      />
    );
  }

  const maxSizeClass = layout.isUltraNarrow
    ? 'max-h-9 max-w-[96px]'
    : layout.isCompact
    ? 'max-h-11 max-w-[120px]'
    : layout.isLarge
    ? 'max-h-20 max-w-[200px]'
    : 'max-h-14 max-w-[150px]';
  return (
    <img
      src={src}
      alt={alt}
      className={`${maxSizeClass} w-auto h-auto object-contain shrink-0 block`}
      style={{ objectFit: 'contain' }}
    />
  );
};

interface DocumentHeaderBandProps {
  assets: DocumentAssetBundle;
  left: ReactNode;
  right?: ReactNode;
  align?: 'start' | 'end';
  divided?: boolean;
}

export const DocumentHeaderBand: React.FC<DocumentHeaderBandProps> = ({
  assets,
  left,
  right,
  align = 'start',
  divided = true,
}) => {
  const { layout, design, theme } = assets;
  const isBanner = design.id === 'modern-banner';
  const isEditorial = design.id === 'editorial-serif';

  const dividerClass = divided
    ? `border-b border-slate-200 ${
        layout.isCompact ? 'pb-4 mb-4' : layout.isLarge ? 'pb-8 mb-8' : 'pb-6 mb-6'
      }`
    : layout.headerMbClass;

  if (isBanner) {
    return (
      <header
        data-pdf-block="true"
        className={`${layout.headerMbClass} ${
          layout.isUltraNarrow ? 'p-3' : layout.isCompact ? 'p-4' : layout.isLarge ? 'p-7' : 'p-5'
        } rounded-lg border`}
        style={{
          backgroundColor: theme.primaryLight,
          borderColor: `${theme.primary}30`,
        }}
      >
        <div
          className={`flex ${
            layout.isCompact
              ? 'flex-col items-start gap-3'
              : `flex-row ${align === 'end' ? 'items-end' : 'items-start'} justify-between gap-4`
          }`}
        >
          <div className="min-w-0 flex-1">{left}</div>
          {right && (
            <div className={`${layout.isCompact ? 'text-left' : 'text-right'} shrink-0`}>
              {right}
            </div>
          )}
        </div>
      </header>
    );
  }

  if (isEditorial) {
    return (
      <header
        data-pdf-block="true"
        className={`text-center border-b-2 ${
          layout.isCompact ? 'pb-4 mb-4' : layout.isLarge ? 'pb-7 mb-7' : 'pb-5 mb-5'
        }`}
        style={{ borderColor: theme.border }}
      >
        <div className="flex flex-col items-center gap-3">
          {right && <div className="flex justify-center">{right}</div>}
          <div className="w-full min-w-0">{left}</div>
        </div>
      </header>
    );
  }

  return (
    <header data-pdf-block="true" className={dividerClass}>
      <div
        className={`flex ${
          layout.isCompact
            ? 'flex-col items-start gap-3'
            : `flex-row ${align === 'end' ? 'items-end' : 'items-start'} justify-between gap-4`
        }`}
      >
        <div className="min-w-0 flex-1">{left}</div>
        {right && (
          <div className={`${layout.isCompact ? 'text-left' : 'text-right'} shrink-0`}>
            {right}
          </div>
        )}
      </div>
    </header>
  );
};

interface DocumentStatusBadgeProps {
  assets: DocumentAssetBundle;
  icon: ReactNode;
  label: string;
  className?: string;
}

/**
 * Block-level flex w-fit badge so html2canvas renders background & icon/text cleanly.
 */
export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  assets,
  icon,
  label,
  className = '',
}) => {
  const { theme, layout, design } = assets;
  const centerClass = design.id === 'editorial-serif' ? 'mx-auto' : layout.isCompact ? '' : 'ml-auto';
  return (
    <div
      className={`flex w-fit ${centerClass} items-center gap-1.5 px-2.5 py-1 rounded ${layout.smallSizeClass} font-bold uppercase tracking-wider ${className}`}
      style={{
        backgroundColor: theme.badgeBg,
        color: theme.badgeText,
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};

interface DocumentSectionHeadingProps {
  assets: DocumentAssetBundle;
  title: string;
  className?: string;
}

export const DocumentSectionHeading: React.FC<DocumentSectionHeadingProps> = ({
  assets,
  title,
  className,
}) => {
  const { theme, layout, design } = assets;
  const mbClass = className ?? (layout.isCompact ? 'mb-2' : layout.isLarge ? 'mb-4' : 'mb-3');

  if (design.id === 'swiss-grid') {
    return (
      <h2
        data-pdf-block="true"
        data-pdf-keep-with-next="true"
        className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-widest pt-1.5 ${mbClass} border-t`}
        style={{ borderColor: theme.textHeader, color: theme.textHeader }}
      >
        {title}
      </h2>
    );
  }

  if (design.id === 'editorial-serif') {
    return (
      <h2
        data-pdf-block="true"
        data-pdf-keep-with-next="true"
        className={`font-sans-title ${layout.metaSizeClass} font-semibold uppercase tracking-[0.14em] pb-1.5 ${mbClass} border-b flex items-center justify-between`}
        style={{ borderColor: theme.border, color: theme.primaryDark }}
      >
        <span>{title}</span>
      </h2>
    );
  }

  if (design.id === 'modern-banner') {
    return (
      <h2
        data-pdf-block="true"
        data-pdf-keep-with-next="true"
        className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-wider pb-1.5 ${mbClass} border-b flex items-center gap-2`}
        style={{ borderColor: theme.border, color: theme.primaryDark }}
      >
        <span
          className="inline-block w-2 h-2 rounded-xs shrink-0"
          style={{ backgroundColor: theme.primary }}
        />
        <span>{title}</span>
      </h2>
    );
  }

  return (
    <h2
      data-pdf-block="true"
      data-pdf-keep-with-next="true"
      className={`font-sans-title ${layout.metaSizeClass} font-bold uppercase tracking-wider pb-1.5 ${mbClass} border-b`}
      style={{ borderColor: theme.border, color: theme.primaryDark }}
    >
      {title}
    </h2>
  );
};

interface DocumentInfoCardProps {
  assets: DocumentAssetBundle;
  title?: string;
  children: ReactNode;
}

export const DocumentInfoCard: React.FC<DocumentInfoCardProps> = ({
  assets,
  title,
  children,
}) => {
  const { layout, design, theme } = assets;
  return (
    <section
      data-pdf-block="true"
      className={`${layout.sectionMbClass} ${
        layout.isUltraNarrow ? 'p-2.5' : layout.isCompact ? 'p-3' : layout.isLarge ? 'p-5' : 'p-4'
      } rounded-md border font-sans-title ${layout.metaSizeClass} print-avoid-break`}
      style={{
        backgroundColor: design.id === 'modern-banner' ? theme.primaryLight : '#f8fafc',
        borderColor: design.id === 'swiss-grid' ? theme.textHeader : '#e2e8f0',
      }}
    >
      {title && (
        <h2
          className={`${layout.smallSizeClass} font-bold uppercase tracking-wider mb-2`}
          style={{ color: design.id === 'swiss-grid' ? theme.textHeader : '#64748b' }}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
};

export function hasText(val: string | number | null | undefined): boolean {
  if (val === null || val === undefined) return false;
  return String(val).trim().length > 0;
}

interface PlaceholderTextProps {
  value?: string | number | null;
  placeholder: string;
  className?: string;
}

export const PlaceholderText: React.FC<PlaceholderTextProps> = ({
  value,
  placeholder,
  className = '',
}) => {
  if (hasText(value)) {
    return <span className={className}>{value}</span>;
  }
  return <span className={`text-slate-400 italic font-normal ${className}`}>{placeholder}</span>;
};

interface DocumentNotesBoxProps {
  assets: DocumentAssetBundle;
  label: string;
  text: string;
  placeholder?: string;
}

export const DocumentNotesBox: React.FC<DocumentNotesBoxProps> = ({
  assets,
  label,
  text,
  placeholder,
}) => {
  const { layout, theme } = assets;
  const filled = hasText(text);
  return (
    <section
      data-pdf-block="true"
      className={`${layout.sectionMbClass} ${
        layout.isCompact ? 'p-2.5' : 'p-3.5'
      } rounded bg-slate-50 border border-slate-200 font-sans-title ${layout.metaSizeClass} text-slate-600 print-avoid-break`}
      style={{ borderTopWidth: '2px', borderTopColor: theme.primary }}
    >
      <span className="font-bold text-slate-700 block mb-0.5">{label}:</span>
      <p className={`leading-relaxed ${filled ? '' : 'text-slate-400 italic'}`}>
        {filled ? text : placeholder}
      </p>
    </section>
  );
};

interface DocumentTagListProps {
  assets: DocumentAssetBundle;
  items: string[];
  isPlaceholder?: boolean;
}

export const DocumentTagList: React.FC<DocumentTagListProps> = ({
  assets,
  items,
  isPlaceholder = false,
}) => {
  const { layout, theme, design } = assets;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {items.map((item, index) => (
        <span
          key={index}
          className={`${
            layout.isUltraNarrow
              ? 'px-1.5 py-0.5 text-[9.5px]'
              : layout.isCompact
              ? 'px-2 py-0.5 text-[10px]'
              : layout.isLarge
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } ${design.id === 'swiss-grid' ? 'rounded-none' : 'rounded'} font-medium border font-sans-title ${
            isPlaceholder ? 'opacity-60 italic' : ''
          }`}
          style={{
            backgroundColor: design.id === 'swiss-grid' ? '#ffffff' : theme.primaryLight,
            color: theme.primaryDark,
            borderColor: design.id === 'swiss-grid' ? theme.border : `${theme.primary}25`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

interface DocumentFooterBandProps {
  assets: DocumentAssetBundle;
  left: ReactNode;
  right?: ReactNode;
  align?: 'center' | 'end';
}

export const DocumentFooterBand: React.FC<DocumentFooterBandProps> = ({
  assets,
  left,
  right,
  align = 'center',
}) => {
  const { layout } = assets;
  return (
    <footer
      data-pdf-block="true"
      className={`pt-5 border-t border-slate-200 flex ${
        layout.isCompact
          ? 'flex-col items-start gap-3'
          : `flex-row ${align === 'end' ? 'items-end' : 'items-center'} justify-between gap-4`
      } font-sans-title ${layout.metaSizeClass} text-slate-500 print-avoid-break`}
    >
      <div>{left}</div>
      {right && (
        <div className={layout.isCompact ? 'text-left' : 'text-right'}>{right}</div>
      )}
    </footer>
  );
};

import React, { ReactNode } from 'react';
import { DocumentAssetBundle } from '../../types/document';

interface DocumentSheetProps {
  assets: DocumentAssetBundle;
  children: ReactNode;
  className?: string;
  paddingPxOverride?: number;
  showHeaderAccent?: boolean;
}

/**
 * Common mountable sheet surface for all document templates.
 * Automatically mounts paper dimensions, density-scaled padding,
 * reading typography font asset, and header accent motif.
 */
export const DocumentSheet: React.FC<DocumentSheetProps> = ({
  assets,
  children,
  className = '',
  paddingPxOverride,
  showHeaderAccent = true,
}) => {
  const { theme, font, layout, style } = assets;

  return (
    <div
      className={`bg-white text-slate-900 w-full transition-all relative ${font.cssClass} ${className}`}
      style={{
        boxSizing: 'border-box',
        minHeight: `${layout.paper.heightPx}px`,
        padding: `${paddingPxOverride ?? layout.paddingPx}px`,
        overflowWrap: 'anywhere',
      }}
    >
      {showHeaderAccent && style.headerStyle === 'left-bar' && (
        <div
          className={`absolute left-0 top-0 bottom-0 ${layout.accentBarWidthClass}`}
          style={{ backgroundColor: theme.primary }}
        />
      )}
      {showHeaderAccent && style.headerStyle === 'banner' && (
        <div
          className={`absolute left-0 top-0 right-0 ${layout.accentBannerHeightClass}`}
          style={{ backgroundColor: theme.primary }}
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
 * Double decorative border mounted inside framed templates (e.g. Certificate).
 */
export const DocumentOrnateFrame: React.FC<DocumentOrnateFrameProps> = ({ assets }) => {
  const { theme, layout } = assets;
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
    const sizeClass = layout.isCompact
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

  const sizeClass = layout.isCompact
    ? 'w-11 h-11'
    : layout.isLarge
    ? 'w-20 h-20'
    : 'w-14 h-14';
  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClass} object-contain rounded-md border border-slate-200 shrink-0 bg-white`}
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
  const { layout } = assets;
  const dividerClass = divided
    ? `border-b border-slate-200 ${
        layout.isCompact ? 'pb-4 mb-4' : layout.isLarge ? 'pb-8 mb-8' : 'pb-6 mb-6'
      }`
    : layout.headerMbClass;

  return (
    <header className={dividerClass}>
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
 * Block-level flex w-fit pill badge so html2canvas renders background & icon/text cleanly.
 */
export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  assets,
  icon,
  label,
  className = '',
}) => {
  const { theme, layout } = assets;
  return (
    <div
      className={`flex w-fit ${layout.isCompact ? '' : 'ml-auto'} items-center gap-1.5 px-2.5 py-1 rounded ${layout.smallSizeClass} font-bold uppercase tracking-wider ${className}`}
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
  const { theme, layout } = assets;
  const mbClass = className ?? (layout.isCompact ? 'mb-2' : layout.isLarge ? 'mb-4' : 'mb-3');
  return (
    <h2
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
  const { layout } = assets;
  return (
    <section
      className={`${layout.sectionMbClass} ${
        layout.isCompact ? 'p-3' : layout.isLarge ? 'p-5' : 'p-4'
      } rounded-md border border-slate-200 bg-slate-50/70 font-sans-title ${layout.metaSizeClass} print-avoid-break`}
    >
      {title && (
        <h2 className={`${layout.smallSizeClass} font-bold uppercase tracking-wider text-slate-500 mb-2`}>
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
  const { layout } = assets;
  const filled = hasText(text);
  return (
    <section
      className={`${layout.sectionMbClass} ${
        layout.isCompact ? 'p-2.5' : 'p-3.5'
      } rounded bg-slate-50 border-l-3 border-slate-400 font-sans-title ${layout.metaSizeClass} text-slate-600 print-avoid-break`}
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
  const { layout, theme } = assets;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {items.map((item, index) => (
        <span
          key={index}
          className={`${
            layout.isCompact
              ? 'px-2 py-0.5 text-[10px]'
              : layout.isLarge
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } rounded font-medium border font-sans-title ${isPlaceholder ? 'opacity-60 italic' : ''}`}
          style={{
            backgroundColor: theme.primaryLight,
            color: theme.primaryDark,
            borderColor: `${theme.primary}20`,
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

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { LanguageCode } from '../types/document';
import { getTranslation } from '../utils/i18n';

export type CalendarOutputFormat = 'iso' | 'long';

interface CalendarDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  lang?: LanguageCode;
  outputFormat?: CalendarOutputFormat;
  placeholder?: string;
  id?: string;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
}

const LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  pt: 'pt-PT',
  es: 'es-ES',
  fr: 'fr-FR',
};

const ALL_LOCALES = ['en-US', 'pt-PT', 'es-ES', 'fr-FR'];

function buildMonthLookup(): Map<string, number> {
  const map = new Map<string, number>();
  for (const loc of ALL_LOCALES) {
    const fmt = new Intl.DateTimeFormat(loc, { month: 'long' });
    const fmtShort = new Intl.DateTimeFormat(loc, { month: 'short' });
    for (let m = 0; m < 12; m++) {
      const refDate = new Date(2026, m, 15);
      map.set(fmt.format(refDate).toLowerCase(), m);
      map.set(fmtShort.format(refDate).replace('.', '').toLowerCase(), m);
    }
  }
  return map;
}

const MONTH_LOOKUP = buildMonthLookup();

function parseDateString(raw: string): { year: number; month: number; day: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Exact ISO YYYY-MM-DD (avoid UTC shift)
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  // 2. Match year + month name across supported locales + day
  const yearMatch = /\b(\d{4})\b/.exec(trimmed);
  const dayMatch = /\b(\d{1,2})\b/.exec(trimmed);
  if (yearMatch && dayMatch) {
    const y = Number(yearMatch[1]);
    const d = Number(dayMatch[1]);
    const lower = trimmed.toLowerCase();
    for (const [name, monthIdx] of MONTH_LOOKUP.entries()) {
      if (lower.includes(name) && d >= 1 && d <= 31) {
        return { year: y, month: monthIdx, day: d };
      }
    }
  }

  // 3. Fallback standard JS parse
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth(),
      day: parsed.getDate(),
    };
  }

  return null;
}

function formatDateOutput(
  year: number,
  month: number,
  day: number,
  format: CalendarOutputFormat,
  lang: LanguageCode
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (format === 'iso') {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }
  const dateObj = new Date(year, month, day);
  return new Intl.DateTimeFormat(LOCALE_MAP[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  value,
  onChange,
  lang = 'en',
  outputFormat = 'iso',
  placeholder,
  id,
  className = '',
  compact = false,
  disabled = false,
}) => {
  const t = (key: string) => getTranslation(lang, key);
  const locale = LOCALE_MAP[lang];

  const parsedSelected = useMemo(() => parseDateString(value), [value]);
  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parsedSelected?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(() => parsedSelected?.month ?? today.month);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePopoverPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverHeight = 324;
    const margin = 8;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - popoverWidth - margin);
    }

    let top = rect.bottom + 6;
    if (top + popoverHeight > window.innerHeight - margin && rect.top - popoverHeight - 6 > margin) {
      top = rect.top - popoverHeight - 6;
    }

    setPopoverCoords({ top, left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (parsedSelected) {
      setViewYear(parsedSelected.year);
      setViewMonth(parsedSelected.month);
    } else {
      setViewYear(today.year);
      setViewMonth(today.month);
    }
    updatePopoverPosition();
  }, [isOpen, parsedSelected, today.year, today.month, updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleReposition = () => updatePopoverPosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  const monthNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, m) => {
      const name = fmt.format(new Date(2026, m, 15));
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  }, [locale]);

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // Jan 4, 2026 is a Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const label = fmt.format(new Date(2026, 0, 4 + i)).replace('.', '');
      return label.slice(0, 2).toUpperCase();
    });
  }, [locale]);

  const yearOptions = useMemo(() => {
    const minYear = Math.min(1940, viewYear - 5);
    const maxYear = Math.max(today.year + 15, viewYear + 5);
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [today.year, viewYear]);

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null }> = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = formatDateOutput(viewYear, viewMonth, day, outputFormat, lang);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const formatted = formatDateOutput(
      today.year,
      today.month,
      today.day,
      outputFormat,
      lang
    );
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const displayLabel = value.trim() || placeholder || t('select_date');
  const hasValue = value.trim().length > 0;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full ${
          compact ? 'px-2.5 py-1.5 bg-white' : 'px-3 py-2 bg-zinc-50/60'
        } border rounded-lg text-xs flex items-center justify-between gap-1.5 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-600 ${
          disabled
            ? 'border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed'
            : isOpen
            ? 'border-blue-600 bg-white'
            : 'border-zinc-200 hover:bg-white focus:bg-white'
        }`}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span
            className={`truncate ${
              hasValue ? 'text-zinc-900 font-medium' : 'text-zinc-400'
            }`}
          >
            {displayLabel}
          </span>
        </span>

        {hasValue && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label={t('clear_date')}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClear();
              }
            }}
            className="p-0.5 text-zinc-400 hover:text-zinc-700 rounded transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={t('select_date')}
            style={{
              position: 'fixed',
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              width: '280px',
            }}
            className="z-50 bg-white border border-zinc-200 rounded-xl shadow-xl p-3 font-sans-title select-none"
          >
            {/* Header: Prev / Month & Year Selectors / Next */}
            <div className="flex items-center justify-between gap-1 mb-2.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shrink-0"
                aria-label={t('previous_month')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 min-w-0">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  aria-label={t('month_label')}
                  className="text-xs font-semibold text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md px-1.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-[116px] truncate"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  aria-label={t('year_label')}
                  className="text-xs font-semibold font-mono-tabular tabular-nums text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md px-1.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shrink-0"
                aria-label={t('next_month')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {weekdayLabels.map((lbl, idx) => (
                <div
                  key={idx}
                  className="h-7 flex items-center justify-center text-[10px] font-semibold text-zinc-400 tracking-wider"
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarCells.map((cell, idx) => {
                if (cell.day === null) {
                  return <div key={idx} className="h-8" />;
                }

                const dayNum = cell.day;
                const isSelected =
                  parsedSelected !== null &&
                  parsedSelected.year === viewYear &&
                  parsedSelected.month === viewMonth &&
                  parsedSelected.day === dayNum;

                const isToday =
                  today.year === viewYear &&
                  today.month === viewMonth &&
                  today.day === dayNum;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-8 w-full rounded-lg text-xs font-mono-tabular tabular-nums flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700'
                        : isToday
                        ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-inset ring-blue-300 hover:bg-blue-100'
                        : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer: Today / Clear */}
            <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                {t('today')}
              </button>

              <button
                type="button"
                onClick={() => handleClear()}
                className="px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors"
              >
                {t('clear_date')}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

interface CalendarPeriodPickerProps {
  value: string;
  onChange: (value: string) => void;
  lang?: LanguageCode;
  allowPresent?: boolean;
}

const PRESENT_TOKENS = new Set(['present', 'atual', 'actual', 'actuel']);

function splitPeriodValue(raw: string): {
  start: string;
  end: string;
  isPresent: boolean;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { start: '', end: '', isPresent: false };

  const parts = trimmed.split(/\s*[–—]\s*|\s+-\s+/);
  if (parts.length >= 2) {
    const start = parts[0].trim();
    const endRaw = parts.slice(1).join(' – ').trim();
    const isPresent = PRESENT_TOKENS.has(endRaw.toLowerCase());
    return {
      start,
      end: isPresent ? '' : endRaw,
      isPresent,
    };
  }

  if (PRESENT_TOKENS.has(trimmed.toLowerCase())) {
    return { start: '', end: '', isPresent: true };
  }

  return { start: trimmed, end: '', isPresent: false };
}

export const CalendarPeriodPicker: React.FC<CalendarPeriodPickerProps> = ({
  value,
  onChange,
  lang = 'en',
  allowPresent = false,
}) => {
  const t = (key: string) => getTranslation(lang, key);
  const { start, end, isPresent } = useMemo(() => splitPeriodValue(value), [value]);

  const emit = (nextStart: string, nextEnd: string, nextPresent: boolean) => {
    const s = nextStart.trim();
    const e = nextPresent ? t('present') : nextEnd.trim();
    if (s && e) {
      onChange(`${s} – ${e}`);
    } else if (s) {
      onChange(s);
    } else if (e) {
      onChange(e);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <CalendarDatePicker
          compact
          value={start}
          onChange={(val) => emit(val, end, isPresent)}
          lang={lang}
          outputFormat="iso"
          placeholder={t('start_date')}
        />
        <CalendarDatePicker
          compact
          value={isPresent ? t('present') : end}
          onChange={(val) => emit(start, val, false)}
          lang={lang}
          outputFormat="iso"
          placeholder={t('end_date')}
          disabled={isPresent}
        />
      </div>

      {allowPresent && (
        <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPresent}
            onChange={(e) => emit(start, end, e.target.checked)}
            className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
          />
          <span>{t('present')}</span>
        </label>
      )}
    </div>
  );
};


import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Copy,
  GitCompareArrows,
  Highlighter,
  Plus,
  Search,
} from 'lucide-react';
import type { EditorFont, EssayVersion } from '../types/essay';
import { computeWordDiff } from '../utils/diffEngine';
import {
  formatDateLabel,
  getTextMetrics,
  sanitizeEditorHtml,
} from '../utils/textUtils';
import { RichEditor } from './RichEditor';

interface SplitRevisionViewProps {
  versions: EssayVersion[];
  activeVersion: EssayVersion;
  referenceVersion: EssayVersion;
  author: string;
  font: EditorFont;
  onSelectReferenceVersion: (versionId: string) => void;
  onChangeAuthor: (author: string) => void;
  onChangeTitle: (title: string) => void;
  onChangeSubtitle: (subtitle: string) => void;
  onChangeContent: (html: string, plainText: string) => void;
  onOpenNewVersionModal: () => void;
  onGoToTrackChanges: () => void;
}

export const SplitRevisionView: React.FC<SplitRevisionViewProps> = ({
  versions,
  activeVersion,
  referenceVersion,
  author,
  font,
  onSelectReferenceVersion,
  onChangeAuthor,
  onChangeTitle,
  onChangeSubtitle,
  onChangeContent,
  onOpenNewVersionModal,
  onGoToTrackChanges,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLiveDiff, setShowLiveDiff] = useState(false);

  const refMetrics = useMemo(
    () => getTextMetrics(referenceVersion.contentText),
    [referenceVersion.contentText]
  );

  const liveDiff = useMemo(() => {
    if (!showLiveDiff) return null;
    return computeWordDiff(
      referenceVersion.contentText,
      activeVersion.contentText
    );
  }, [showLiveDiff, referenceVersion.contentText, activeVersion.contentText]);

  const handleCopyReferenceToActive = () => {
    if (
      activeVersion.contentText.trim().length > 0 &&
      activeVersion.id === referenceVersion.id
    ) {
      return;
    }
    const mergedHtml = activeVersion.contentHtml.trim()
      ? `${activeVersion.contentHtml}${referenceVersion.contentHtml}`
      : referenceVersion.contentHtml;
    const mergedText = activeVersion.contentText.trim()
      ? `${activeVersion.contentText}\n\n${referenceVersion.contentText}`
      : referenceVersion.contentText;
    onChangeContent(mergedHtml, mergedText);
  };

  const sanitizedRefHtml = useMemo(
    () => sanitizeEditorHtml(referenceVersion.contentHtml),
    [referenceVersion.contentHtml]
  );

  const creationModeLabel =
    activeVersion.creationMode === 'scratch_alongside'
      ? 'Writing from scratch alongside reference'
      : activeVersion.creationMode === 'copy_and_edit'
      ? 'Copied from earlier iteration for editing'
      : 'Editing active draft';

  const highlightedRefHtml = useMemo(() => {
    if (!searchQuery.trim() || !sanitizedRefHtml) return sanitizedRefHtml;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    // Highlight text nodes safely by splitting tags
    return sanitizedRefHtml
      .split(/(<[^>]+>)/g)
      .map((part) => {
        if (part.startsWith('<')) return part;
        return part.replace(
          regex,
          '<mark class="bg-amber-200 dark:bg-amber-700/60 text-zinc-900 dark:text-zinc-50 rounded px-0.5">$1</mark>'
        );
      })
      .join('');
  }, [sanitizedRefHtml, searchQuery]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Contextual Two-Screen Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Two-Screen Revision
          </span>
          <span aria-hidden="true">·</span>
          <span>{creationModeLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewVersionModal}
            className="h-8 inline-flex items-center gap-1.5 px-3 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Start New Revision</span>
          </button>

          <button
            type="button"
            onClick={onGoToTrackChanges}
            className="h-8 inline-flex items-center gap-1.5 px-3 text-xs font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <GitCompareArrows className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Compare Changes</span>
          </button>
        </div>
      </div>

      {/* Two-Screen Side-by-Side Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* LEFT SCREEN: Reference Version (Read-Only) */}
        <section
          aria-label="Reference essay version"
          className="flex flex-col h-full min-h-[420px] bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden"
        >
          {/* Left Screen Header */}
          <div className="px-3.5 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                Reference
              </span>
              <label htmlFor="split-ref-select" className="sr-only">
                Reference Version
              </label>
              <select
                id="split-ref-select"
                value={referenceVersion.id}
                onChange={(e) => onSelectReferenceVersion(e.target.value)}
                className="h-8 pl-2 pr-6 text-xs font-medium bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-[190px] truncate"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} · {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find in old..."
                  aria-label="Search reference draft"
                  className="h-8 w-28 sm:w-36 pl-7 pr-2 text-xs bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowLiveDiff((prev) => !prev)}
                aria-pressed={showLiveDiff}
                title="Toggle live change overlay against active draft"
                className={`h-8 inline-flex items-center gap-1 px-2.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  showLiveDiff
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Live Diff</span>
              </button>

              {activeVersion.id !== referenceVersion.id && (
                <button
                  type="button"
                  onClick={handleCopyReferenceToActive}
                  title="Append reference text into active draft"
                  className="h-8 inline-flex items-center gap-1 px-2.5 text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden xl:inline">Insert</span>
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Left Screen Body */}
          <div className="flex-1 overflow-y-auto px-6 py-7 sm:px-9 sm:py-8">
            <div className="max-w-[66ch] mx-auto">
              <div className="mb-6 pb-5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 tabular-nums">
                  Read-only reference · {formatDateLabel(referenceVersion.updatedAt)}
                </div>
                <h2
                  className={`text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 ${
                    font === 'serif' ? 'font-serif-prose' : 'font-sans-ui'
                  }`}
                >
                  {referenceVersion.title || 'Untitled Essay'}
                </h2>
                {referenceVersion.subtitle && (
                  <p
                    className={`mt-2 text-base text-zinc-500 dark:text-zinc-400 ${
                      font === 'serif' ? 'font-serif-prose italic' : 'font-sans-ui'
                    }`}
                  >
                    {referenceVersion.subtitle}
                  </p>
                )}
                {referenceVersion.notes && (
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                    Note: {referenceVersion.notes}
                  </p>
                )}
              </div>

              {showLiveDiff && liveDiff ? (
                <div
                  className={`essay-prose whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 ${
                    font === 'serif' ? 'font-serif-prose' : 'font-sans-ui'
                  }`}
                >
                  {liveDiff.parts.map((part, idx) => {
                    if (part.added) {
                      return (
                        <ins
                          key={idx}
                          className="bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 underline decoration-emerald-500 underline-offset-2 px-0.5 rounded-xs"
                        >
                          {part.value}
                        </ins>
                      );
                    }
                    if (part.removed) {
                      return (
                        <del
                          key={idx}
                          className="bg-rose-100/80 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 line-through decoration-rose-500 px-0.5 rounded-xs"
                        >
                          {part.value}
                        </del>
                      );
                    }
                    return <span key={idx}>{part.value}</span>;
                  })}
                </div>
              ) : referenceVersion.contentText.trim() ? (
                <div
                  className={`essay-prose text-zinc-700 dark:text-zinc-300 ${
                    font === 'serif' ? 'font-serif-prose' : 'font-sans-ui'
                  }`}
                  dangerouslySetInnerHTML={{ __html: highlightedRefHtml }}
                />
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-600 italic">
                  This reference version has no body text yet.
                </p>
              )}
            </div>
          </div>

          {/* Left Screen Footer */}
          <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/90 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
            <span>
              {refMetrics.words.toLocaleString()} words · {refMetrics.paragraphs} paragraphs
            </span>
            {liveDiff ? (
              <span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  +{liveDiff.addedWords}
                </span>{' '}
                /{' '}
                <span className="text-rose-700 dark:text-rose-400">
                  −{liveDiff.removedWords}
                </span>{' '}
                words vs active
              </span>
            ) : (
              <span>v{referenceVersion.versionNumber} Reference</span>
            )}
          </div>
        </section>

        {/* RIGHT SCREEN: Active Editable Revision */}
        <section
          aria-label="Active revision editor"
          className="flex flex-col h-full min-h-[420px]"
        >
          <RichEditor
            version={activeVersion}
            author={author}
            font={font}
            compact
            onChangeAuthor={onChangeAuthor}
            onChangeTitle={onChangeTitle}
            onChangeSubtitle={onChangeSubtitle}
            onChangeContent={onChangeContent}
          />
        </section>
      </div>
    </div>
  );
};

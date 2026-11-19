import React, { useEffect, useRef } from 'react';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from 'lucide-react';
import type { EditorFont, EssayVersion } from '../types/essay';
import {
  getTextMetrics,
  htmlToPlainText,
  sanitizeEditorHtml,
} from '../utils/textUtils';

interface RichEditorProps {
  version: EssayVersion;
  author: string;
  font: EditorFont;
  compact?: boolean;
  onChangeAuthor: (author: string) => void;
  onChangeTitle: (title: string) => void;
  onChangeSubtitle: (subtitle: string) => void;
  onChangeContent: (html: string, plainText: string) => void;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  version,
  author,
  font,
  compact = false,
  onChangeAuthor,
  onChangeTitle,
  onChangeSubtitle,
  onChangeContent,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedHtmlRef = useRef<string>(version.contentHtml);
  const lastVersionIdRef = useRef<string>(version.id);

  // Sync innerHTML only on version switch or external replacement (import, revert hunk, copy-to-right)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const versionChanged = lastVersionIdRef.current !== version.id;
    const externallyUpdated = version.contentHtml !== lastEmittedHtmlRef.current;

    if (versionChanged || externallyUpdated) {
      el.innerHTML = version.contentHtml || '';
      lastVersionIdRef.current = version.id;
      lastEmittedHtmlRef.current = version.contentHtml;
    }
  }, [version.id, version.contentHtml]);

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    const rawHtml = el.innerHTML;
    // Treat single empty <br> or empty <p><br></p> as empty string cleanly
    const normalizedHtml =
      rawHtml === '<br>' || rawHtml === '<p><br></p>' ? '' : rawHtml;
    lastEmittedHtmlRef.current = normalizedHtml;
    const plain = htmlToPlainText(normalizedHtml);
    onChangeContent(normalizedHtml, plain);
  };

  const execFormat = (command: string, value?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, value);
    emitChange();
  };

  const toggleBlock = (tagName: 'H2' | 'H3' | 'BLOCKQUOTE' | 'P') => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const currentBlock = document.queryCommandValue('formatBlock');
    if (
      currentBlock &&
      currentBlock.toUpperCase() === tagName &&
      tagName !== 'P'
    ) {
      document.execCommand('formatBlock', false, 'P');
    } else {
      document.execCommand('formatBlock', false, tagName);
    }
    emitChange();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    if (htmlData) {
      e.preventDefault();
      const cleaned = sanitizeEditorHtml(htmlData);
      document.execCommand('insertHTML', false, cleaned);
      emitChange();
    } else if (textData) {
      e.preventDefault();
      document.execCommand('insertText', false, textData);
      emitChange();
    }
  };

  const metrics = getTextMetrics(version.contentText);

  const toolButtons = [
    {
      label: 'Undo',
      icon: Undo2,
      action: () => execFormat('undo'),
    },
    {
      label: 'Redo',
      icon: Redo2,
      action: () => execFormat('redo'),
    },
    {
      label: 'Section Heading',
      icon: Heading2,
      action: () => toggleBlock('H2'),
    },
    {
      label: 'Subheading',
      icon: Heading3,
      action: () => toggleBlock('H3'),
    },
    {
      label: 'Bold',
      icon: Bold,
      action: () => execFormat('bold'),
    },
    {
      label: 'Italic',
      icon: Italic,
      action: () => execFormat('italic'),
    },
    {
      label: 'Underline',
      icon: Underline,
      action: () => execFormat('underline'),
    },
    {
      label: 'Blockquote',
      icon: Quote,
      action: () => toggleBlock('BLOCKQUOTE'),
    },
    {
      label: 'Bulleted List',
      icon: List,
      action: () => execFormat('insertUnorderedList'),
    },
    {
      label: 'Numbered List',
      icon: ListOrdered,
      action: () => execFormat('insertOrderedList'),
    },
    {
      label: 'Clear Formatting',
      icon: RemoveFormatting,
      action: () => {
        execFormat('removeFormat');
        toggleBlock('P');
      },
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      {/* Formatting Toolbar */}
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
        <div className="flex items-center gap-0.5">
          {toolButtons.map((btn, idx) => {
            const Icon = btn.icon;
            const showDivider = idx === 2 || idx === 4 || idx === 7 || idx === 10;
            return (
              <React.Fragment key={btn.label}>
                {showDivider && (
                  <span
                    aria-hidden="true"
                    className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1.5 shrink-0"
                  />
                )}
                <button
                  type="button"
                  title={btn.label}
                  aria-label={btn.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    btn.action();
                  }}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap shrink-0 pr-1">
          v{version.versionNumber} · {version.label}
        </div>
      </div>

      {/* Scrollable Manuscript Sheet */}
      <div className="flex-1 overflow-y-auto">
        <div
          className={`mx-auto w-full ${
            compact
              ? 'max-w-[68ch] px-6 py-7 sm:px-9 sm:py-9'
              : 'max-w-[74ch] px-6 py-9 sm:px-12 sm:py-12'
          }`}
        >
          {/* Author & Title Block */}
          <div className="mb-7 pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <label htmlFor={`author-${version.id}`} className="sr-only">
                Author name
              </label>
              <input
                id={`author-${version.id}`}
                type="text"
                value={author}
                onChange={(e) => onChangeAuthor(e.target.value)}
                placeholder="Author name (optional)"
                className="bg-transparent text-xs font-medium text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:text-zinc-900 dark:focus:text-zinc-100 w-56"
              />
            </div>

            <label htmlFor={`title-${version.id}`} className="sr-only">
              Essay title
            </label>
            <input
              id={`title-${version.id}`}
              type="text"
              value={version.title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="Untitled Essay"
              className={`w-full bg-transparent font-bold tracking-tight text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none ${
                compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'
              } ${font === 'serif' ? 'font-serif-prose' : 'font-sans-ui'}`}
            />

            <label htmlFor={`subtitle-${version.id}`} className="sr-only">
              Subtitle or central premise
            </label>
            <input
              id={`subtitle-${version.id}`}
              type="text"
              value={version.subtitle}
              onChange={(e) => onChangeSubtitle(e.target.value)}
              placeholder="Add a subtitle or guiding premise..."
              className={`mt-2.5 w-full bg-transparent text-base text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none ${
                font === 'serif' ? 'font-serif-prose italic' : 'font-sans-ui'
              }`}
            />
          </div>

          {/* Rich Prose Body */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Essay body editor"
            data-placeholder="Begin writing your essay here..."
            onInput={emitChange}
            onPaste={handlePaste}
            className={`essay-prose min-h-[420px] text-zinc-800 dark:text-zinc-200 ${
              font === 'serif' ? 'font-serif-prose' : 'font-sans-ui'
            }`}
          />
        </div>
      </div>

      {/* Quiet Bottom Metrics Strip (Unboxed tabular figures) */}
      <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span>{metrics.words.toLocaleString()} words</span>
          <span aria-hidden="true">·</span>
          <span>{metrics.characters.toLocaleString()} characters</span>
          <span aria-hidden="true">·</span>
          <span>{metrics.sentences} sentences</span>
          <span aria-hidden="true">·</span>
          <span>{metrics.paragraphs} paragraphs</span>
        </div>
        <div>
          {metrics.words > 0 ? `~${metrics.readingMinutes} min read` : 'Ready to draft'}
        </div>
      </div>
    </div>
  );
};

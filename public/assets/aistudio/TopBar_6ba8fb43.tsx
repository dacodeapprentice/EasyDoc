import React from 'react';
import { Check, Download, FolderOpen, FilePlus2, Upload } from 'lucide-react';

interface TopBarProps {
  onOpenLibrary: () => void;
  onNewEssay: () => void;
  onTriggerFileImport: () => void;
  onOpenExport: () => void;
  onSaveNow: () => void;
  justSaved: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenLibrary,
  onNewEssay,
  onTriggerFileImport,
  onOpenExport,
  onSaveNow,
  justSaved,
}) => {
  return (
    <header className="h-14 px-4 sm:px-6 flex items-center justify-between gap-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
      {/* Zone 1: Single-element Brand wordmark */}
      <a
        href="#top"
        onClick={(e) => e.preventDefault()}
        className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
      >
        Folio
      </a>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav
        aria-label="Document actions"
        className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400 overflow-x-auto"
      >
        <button
          type="button"
          onClick={onOpenLibrary}
          className="inline-flex items-center gap-1.5 py-1 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <FolderOpen className="w-4 h-4 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
          <span>Essays</span>
        </button>

        <button
          type="button"
          onClick={onNewEssay}
          className="inline-flex items-center gap-1.5 py-1 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <FilePlus2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
          <span>New Essay</span>
        </button>

        <button
          type="button"
          onClick={onTriggerFileImport}
          className="inline-flex items-center gap-1.5 py-1 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <Upload className="w-4 h-4 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
          <span>Open File</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 py-1 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <Download className="w-4 h-4 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
          <span>Export</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onSaveNow}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
        >
          {justSaved && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
          <span>{justSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </header>
  );
};

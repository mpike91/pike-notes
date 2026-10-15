'use client';

interface AppHeaderProps {
  title: string;
  actions?: React.ReactNode;
  /** Mobile-only up arrow; desktop navigates from the sidebar. */
  onBack?: () => void;
}

export function AppHeader({ title, actions, onBack }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b border-border bg-toolbar-bg">
      <div className="flex min-w-0 items-center gap-1">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden -ml-2 rounded-md p-2 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
            aria-label="Back"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        <h1 className="truncate text-lg font-semibold text-text-primary">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

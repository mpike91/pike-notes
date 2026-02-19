'use client';

interface AppHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, actions }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b border-border bg-sidebar-bg">
      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

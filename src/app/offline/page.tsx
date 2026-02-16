export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Pike Notes</h1>
        <p className="mt-2 text-sm text-text-muted">
          You&apos;re offline. The app will sync when you reconnect.
        </p>
      </div>
    </div>
  );
}

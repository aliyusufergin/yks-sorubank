export default function SettingsLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-8">
                <div className="h-8 w-32 rounded-lg bg-[var(--color-bg-elevated)] mb-2" />
                <div className="h-4 w-56 rounded bg-[var(--color-bg-elevated)]" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 space-y-4">
                    <div className="h-6 w-40 rounded bg-[var(--color-bg-elevated)]" />
                    <div className="h-10 rounded-lg bg-[var(--color-bg-elevated)]" />
                    <div className="h-10 rounded-lg bg-[var(--color-bg-elevated)]" />
                </div>
            ))}
        </div>
    );
}

export default function AILoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-8">
                <div className="h-8 w-40 rounded-lg bg-[var(--color-bg-elevated)] mb-2" />
                <div className="h-4 w-72 rounded bg-[var(--color-bg-elevated)]" />
            </div>
            <div className="flex gap-1 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-1">
                <div className="h-10 flex-1 rounded-lg bg-[var(--color-bg-elevated)]" />
                <div className="h-10 flex-1 rounded-lg bg-[var(--color-bg-elevated)]" />
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 h-64" />
        </div>
    );
}

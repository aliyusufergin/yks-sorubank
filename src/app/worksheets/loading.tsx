export default function WorksheetsLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-8">
                <div className="h-8 w-48 rounded-lg bg-[var(--color-bg-elevated)] mb-2" />
                <div className="h-4 w-72 rounded bg-[var(--color-bg-elevated)]" />
            </div>
            <div className="h-10 rounded-lg bg-[var(--color-bg-elevated)]" />
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-5 w-48 rounded bg-[var(--color-bg-elevated)]" />
                                <div className="h-4 w-32 rounded bg-[var(--color-bg-elevated)]" />
                            </div>
                            <div className="h-8 w-20 rounded bg-[var(--color-bg-elevated)]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

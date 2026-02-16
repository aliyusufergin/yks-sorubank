export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Hero skeleton */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-8">
                <div className="h-8 w-48 rounded-lg bg-[var(--color-bg-elevated)] mb-2" />
                <div className="h-4 w-80 rounded bg-[var(--color-bg-elevated)]" />
            </div>

            {/* Toolbar skeleton */}
            <div className="flex gap-3">
                <div className="h-10 w-28 rounded-lg bg-[var(--color-bg-elevated)]" />
                <div className="h-10 w-24 rounded-lg bg-[var(--color-bg-elevated)]" />
                <div className="ml-auto h-5 w-16 rounded bg-[var(--color-bg-elevated)]" />
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
                        <div className="aspect-[4/3] bg-[var(--color-bg-elevated)]" />
                        <div className="p-3 space-y-2">
                            <div className="h-5 w-16 rounded bg-[var(--color-bg-elevated)]" />
                            <div className="h-4 w-24 rounded bg-[var(--color-bg-elevated)]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

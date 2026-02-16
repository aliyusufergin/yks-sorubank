"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Check, Sparkles, FileText, Trash2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
    id: string;
    fileUrl: string;
    lesson: string;
    subject?: string | null;
    source?: string | null;
    status: string;
    pageNumber?: number | null;
    questionNumber?: number | null;
    hasAnalysis?: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: string) => void;
    onAISolve: (id: string) => void;
}

function QuestionCardInner({
    id,
    fileUrl,
    lesson,
    subject,
    source,
    status,
    pageNumber,
    questionNumber,
    hasAnalysis,
    isSelected,
    onSelect,
    onDelete,
    onStatusChange,
    onAISolve,
}: QuestionCardProps) {
    const [aspectRatio, setAspectRatio] = useState<string>("");

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const d = gcd(w, h);
        setAspectRatio(`${w / d}:${h / d}`);
    };

    return (
        <div
            className={cn(
                "glass-card group relative cursor-pointer overflow-hidden transition-all duration-200",
                isSelected && "ring-2 ring-[var(--color-brand)] border-[var(--color-brand)]"
            )}
            onClick={() => onSelect(id)}
        >
            {/* Selection indicator */}
            <div
                className={cn(
                    "absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                    isSelected
                        ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                        : "border-[var(--color-border)] bg-[var(--color-bg)]/50 backdrop-blur"
                )}
            >
                {isSelected && <Check size={14} />}
            </div>

            {/* Analysis cached indicator */}
            {hasAnalysis && (
                <div
                    className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] backdrop-blur"
                    title="AI analiz önbellekte"
                >
                    <Brain size={12} />
                </div>
            )}

            {/* Image */}
            <div className="aspect-[4/3] overflow-hidden bg-[var(--color-bg-elevated)] relative">
                <Image
                    src={fileUrl}
                    alt={`${lesson} sorusu`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    loading="lazy"
                    unoptimized
                    onLoad={handleImageLoad}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {aspectRatio && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-white/80 backdrop-blur-sm">
                        {aspectRatio}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-md bg-[var(--color-brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-brand-light)]">
                        {lesson}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAISolve(id); }}
                        className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                            hasAnalysis
                                ? "bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20"
                                : "bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20"
                        )}
                        title={hasAnalysis ? "Önbellekten göster" : "AI ile çöz"}
                    >
                        <Sparkles size={10} />
                        {hasAnalysis ? "Çözümü Gör" : "AI Çözüm"}
                    </button>
                </div>

                {subject && (
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">{subject}</p>
                )}

                {/* Page & Question Number */}
                {(pageNumber || questionNumber) && (
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <FileText size={10} />
                        {pageNumber && <span>S.{pageNumber}</span>}
                        {questionNumber && <span>#{questionNumber}</span>}
                    </div>
                )}

                {source && (
                    <p className="text-xs text-[var(--color-text-muted)] truncate">📖 {source}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onStatusChange(id, status === "ACTIVE" ? "MASTERED" : "ACTIVE")}
                        className={cn(
                            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
                            status === "MASTERED"
                                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                                : "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand)]/10 hover:text-[var(--color-brand-light)]"
                        )}
                    >
                        {status === "MASTERED" ? "✓ Öğrenildi" : "Arşive Taşı"}
                    </button>
                    <button
                        onClick={() => onDelete(id)}
                        className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export const QuestionCard = memo(QuestionCardInner);

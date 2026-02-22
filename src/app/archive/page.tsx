"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Archive, RotateCcw, Loader2, Sparkles, X, CheckSquare, Trash, Filter } from "lucide-react";
import { QuestionCard } from "@/components/QuestionCard";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import dynamic from "next/dynamic";

const EditQuestionModal = dynamic(() => import("@/components/EditQuestionModal"), { ssr: false });
const FilterModal = dynamic(() => import("@/components/FilterModal"), { ssr: false });

interface Question {
    id: string;
    fileUrl: string;
    lesson: string;
    subject: string | null;
    source: string | null;
    status: string;
    pageNumber: number | null;
    questionNumber: number | null;
    analysis: { id: string } | null;
}

interface AIAnalysis {
    id: string;
    solution: string;
    difficulty: string;
    summary: string;
    topics: string;
}

export default function ArchivePage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<{ lesson?: string; subject?: string; source?: string; hasAnalysis?: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // AI solve modal
    const [showAISolve, setShowAISolve] = useState(false);
    const [aiQuestion, setAiQuestion] = useState<Question | null>(null);
    const [aiResult, setAiResult] = useState<AIAnalysis | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    // Edit question modal
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    // Select all loading
    const [isSelectingAll, setIsSelectingAll] = useState(false);

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.set("status", "MASTERED");
        if (filters.lesson) params.set("lesson", filters.lesson);
        if (filters.subject) params.set("subject", filters.subject);
        if (filters.source) params.set("source", filters.source);
        if (filters.hasAnalysis) params.set("hasAnalysis", filters.hasAnalysis);

        const res = await fetch(`/api/questions?${params}`);
        const data = await res.json();
        setQuestions(data.questions);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setIsLoading(false);
    }, [filters]);

    const loadMore = useCallback(async () => {
        if (!nextCursor || isLoadingMore) return;
        setIsLoadingMore(true);
        const params = new URLSearchParams();
        params.set("status", "MASTERED");
        params.set("cursor", nextCursor);
        if (filters.lesson) params.set("lesson", filters.lesson);
        if (filters.subject) params.set("subject", filters.subject);
        if (filters.source) params.set("source", filters.source);
        if (filters.hasAnalysis) params.set("hasAnalysis", filters.hasAnalysis);

        const res = await fetch(`/api/questions?${params}`);
        const data = await res.json();
        setQuestions((prev) => [...prev, ...data.questions]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setIsLoadingMore(false);
    }, [nextCursor, isLoadingMore, filters]);

    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && hasMore) loadMore(); },
            { rootMargin: "200px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const handleSelectAll = useCallback(async () => {
        if (selectedIds.size > 0) {
            setSelectedIds(new Set());
            return;
        }
        setIsSelectingAll(true);
        try {
            const params = new URLSearchParams();
            params.set("status", "MASTERED");
            if (filters.lesson) params.set("lesson", filters.lesson);
            if (filters.subject) params.set("subject", filters.subject);
            if (filters.source) params.set("source", filters.source);
            if (filters.hasAnalysis) params.set("hasAnalysis", filters.hasAnalysis);
            const res = await fetch(`/api/questions/ids?${params}`);
            const data = await res.json();
            setSelectedIds(new Set(data.ids));
        } catch (error) {
            console.error("Select all error:", error);
        } finally {
            setIsSelectingAll(false);
        }
    }, [selectedIds.size, filters]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("Bu soruyu silmek istediğinize emin misiniz?")) return;
        await fetch(`/api/questions/${id}`, { method: "DELETE" });
        fetchQuestions();
    }, [fetchQuestions]);

    const handleStatusChange = useCallback(async (id: string, status: string) => {
        await fetch(`/api/questions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        fetchQuestions();
    }, [fetchQuestions]);

    const handleBulkRestore = async () => {
        await fetch("/api/questions/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selectedIds), status: "ACTIVE" }),
        });
        setSelectedIds(new Set());
        fetchQuestions();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`${selectedIds.size} soruyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
        await fetch("/api/questions/bulk", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        setSelectedIds(new Set());
        fetchQuestions();
    };

    const handleAISolve = useCallback(async (id: string) => {
        const question = questions.find((q) => q.id === id);
        if (!question) return;

        setAiQuestion(question);
        setAiResult(null);
        setAiError("");
        setShowAISolve(true);
        setAiLoading(true);

        const encrypted = localStorage.getItem("yks-sorubank-api-key");
        if (!encrypted) {
            setAiError("API anahtarı bulunamadı. Ayarlar sayfasından API anahtarınızı girin.");
            setAiLoading(false);
            return;
        }

        try {
            const { decryptApiKey } = await import("@/lib/crypto");
            const apiKey = await decryptApiKey(encrypted);
            const model = localStorage.getItem("yks-sorubank-model") || "gemini-2.0-flash";
            const res = await fetch("/api/ai/solve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: id, apiKey, model }),
            });
            const data = await res.json();
            if (data.error) {
                setAiError(data.error);
            } else {
                setAiResult(data.analysis);
            }
        } catch {
            setAiError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setAiLoading(false);
        }
    }, [questions]);

    const handleEdit = useCallback((questionProps: { id: string }) => {
        const q = questions.find((q) => q.id === questionProps.id);
        if (q) setEditingQuestion(q);
    }, [questions]);

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-success)]/10 via-transparent to-transparent border border-[var(--color-border)] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                    <Archive size={28} className="text-[var(--color-success)]" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Arşiv</h1>
                </div>
                <p className="text-[var(--color-text-secondary)]">
                    Öğrendiğin ve tamamladığın sorular burada.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setIsFilterOpen(true)} className="btn-secondary flex items-center gap-2">
                    <Filter size={16} />
                    Filtrele
                    {Object.values(filters).filter(Boolean).length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)] text-white text-xs">
                            {Object.values(filters).filter(Boolean).length}
                        </span>
                    )}
                </button>
                <button
                    onClick={handleSelectAll}
                    disabled={isSelectingAll}
                    className="btn-secondary flex items-center gap-2"
                >
                    {isSelectingAll ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                    {selectedIds.size > 0 ? "Seçimi Kaldır" : "Tümünü Seç"}
                </button>
                <span className="text-sm text-[var(--color-text-muted)] ml-auto">
                    {questions.length} soru arşivde
                </span>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-[var(--color-brand)]" />
                </div>
            ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Archive size={48} className="text-[var(--color-text-muted)] mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-secondary)]">Arşiv boş</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Öğrendiğiniz soruları arşive taşıyın</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {questions.map((q) => (
                        <QuestionCard
                            key={q.id}
                            {...q}
                            hasAnalysis={!!q.analysis}
                            isSelected={selectedIds.has(q.id)}
                            onSelect={handleSelect}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                            onAISolve={handleAISolve}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="flex justify-center py-6">
                {isLoadingMore && (
                    <Loader2 size={24} className="animate-spin text-[var(--color-brand)]" />
                )}
                {!isLoading && !isLoadingMore && !hasMore && questions.length > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">Tüm arşiv yüklendi</p>
                )}
            </div>

            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] px-6 py-3 shadow-2xl backdrop-blur-xl">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {selectedIds.size} soru seçildi
                    </span>
                    <div className="h-4 w-px bg-[var(--color-border)]" />
                    <button onClick={handleBulkRestore} className="btn-primary flex items-center gap-2 text-sm py-2">
                        <RotateCcw size={14} />
                        Havuza Geri Taşı
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        className="btn-secondary flex items-center gap-2 text-sm py-2 whitespace-nowrap text-[var(--color-danger)]"
                        title="Seçili soruları kalıcı olarak sil"
                    >
                        <Trash size={14} />
                        Sil
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                        Vazgeç
                    </button>
                </div>
            )}

            {/* AI Solve Modal */}
            {showAISolve && aiQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <Sparkles size={18} className="text-[var(--color-accent)]" />
                                AI Soru Çözümü
                            </h2>
                            <button onClick={() => setShowAISolve(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid md:grid-cols-[300px_1fr] gap-6">
                            <div className="space-y-2">
                                <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                                    <img src={aiQuestion.fileUrl} alt="Soru" className="w-full object-contain" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-md bg-[var(--color-brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-brand-light)]">
                                        {aiQuestion.lesson}
                                    </span>
                                    {aiResult && (
                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${aiResult.difficulty === "Kolay" ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                                            : aiResult.difficulty === "Zor" ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                                                : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                                            }`}>
                                            {aiResult.difficulty}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="min-w-0">
                                {aiLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <Loader2 size={32} className="animate-spin text-[var(--color-accent)] mb-3" />
                                        <p className="text-sm text-[var(--color-text-muted)]">AI soruyu analiz ediyor...</p>
                                    </div>
                                ) : aiError ? (
                                    <div className="rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 p-4 text-sm text-[var(--color-danger)]">
                                        ❌ {aiError}
                                    </div>
                                ) : aiResult ? (
                                    <MarkdownRenderer content={aiResult.solution} />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Question Modal */}
            {editingQuestion && (
                <EditQuestionModal
                    isOpen={!!editingQuestion}
                    onClose={() => setEditingQuestion(null)}
                    onSuccess={fetchQuestions}
                    question={editingQuestion}
                />
            )}

            <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={setFilters} currentFilters={filters} />
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Sparkles, BookOpen, Calendar, Loader2, Send, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useSettings } from "@/lib/useSettings";
import { useApiKey } from "@/components/ApiKeyProvider";

interface QuestionInfo {
    id: string;
    lesson: string;
    subject: string | null;
    fileUrl: string;
    analysis?: {
        topics: string;
        difficulty: string;
        summary: string;
    } | null;
}

function AIPageContent() {
    const searchParams = useSearchParams();
    const { settings: serverSettings } = useSettings();
    const { hasEncryptedKey, requireApiKey } = useApiKey();
    const [activeTab, setActiveTab] = useState<"recommendations" | "plan">("recommendations");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState("");
    const [selectedQuestions, setSelectedQuestions] = useState<QuestionInfo[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    // Study Plan State
    const [hoursPerDay, setHoursPerDay] = useState("6");
    const [days, setDays] = useState("7");
    const [customPrompt, setCustomPrompt] = useState("");

    useEffect(() => {
        const ids = searchParams.get("questionIds");
        if (ids) {
            const questionIds = ids.split(",").filter(Boolean);
            if (questionIds.length > 0) {
                setLoadingQuestions(true);
                Promise.all(
                    questionIds.map(async (id) => {
                        const res = await fetch(`/api/questions/${id}`);
                        if (!res.ok) return null;
                        const q = await res.json();
                        return {
                            id: q.id,
                            lesson: q.lesson,
                            subject: q.subject,
                            fileUrl: q.fileUrl,
                            analysis: q.analysis || null,
                        } as QuestionInfo;
                    })
                ).then((results) => {
                    setSelectedQuestions(results.filter(Boolean) as QuestionInfo[]);
                    setLoadingQuestions(false);
                });
            }
        }
    }, [searchParams]);

    const callAI = async (action: string) => {
        if (selectedQuestions.length === 0) {
            setResult("⚠️ Soru seçilmedi. Ana sayfadan soruları seçip AI Tavsiye butonuna basın.");
            return;
        }

        let apiKey: string;
        try {
            apiKey = await requireApiKey();
        } catch {
            return;
        }

        setIsLoading(true);
        setResult("");

        try {
            const questionIds = selectedQuestions.map((q) => q.id);
            const data: Record<string, unknown> = { questionIds };

            if (action === "study-plan") {
                data.hoursPerDay = parseInt(hoursPerDay);
                data.days = parseInt(days);
            }

            const effectivePrompt = customPrompt.trim()
                || serverSettings[action === "study-recommendations"
                    ? "prompt-recommendations"
                    : "prompt-plan"
                ] || "";

            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apiKey,
                    action,
                    data,
                    model: serverSettings["ai-model"],
                    ...(effectivePrompt ? { customPrompt: effectivePrompt } : {}),
                }),
            });

            const response = await res.json();
            if (response.error) {
                setResult(`❌ Hata: ${response.error}`);
            } else {
                setResult(response.result);
            }
        } catch {
            setResult("❌ Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: "recommendations" as const, label: "Çalışma Tavsiyeleri", icon: BookOpen },
        { id: "plan" as const, label: "Program Hazırla", icon: Calendar },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand)]/10 via-[var(--color-accent)]/5 to-transparent border border-[var(--color-border)] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles size={28} className="text-[var(--color-accent)]" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Asistan</h1>
                </div>
                <p className="text-[var(--color-text-secondary)]">
                    Seçtiğin sorulara göre yapay zeka destekli çalışma tavsiyeleri ve program hazırlama.
                </p>
                {!hasEncryptedKey && (
                    <div className="mt-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-4 py-2 text-sm text-[var(--color-warning)]">
                        ⚠️ AI özelliklerini kullanmak için Ayarlar sayfasından API anahtarınızı kaydedin.
                    </div>
                )}
                <div className="mt-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 px-4 py-2 text-sm text-[var(--color-accent)]">
                    🚧 Bu sayfa henüz geliştirme aşamasındadır. Özellikler değişebilir veya beklenmedik hatalar oluşabilir.
                </div>
            </div>

            {/* Selected Questions */}
            {loadingQuestions ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-[var(--color-brand)]" />
                </div>
            ) : selectedQuestions.length > 0 ? (
                <div className="glass-card p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Seçilen Sorular ({selectedQuestions.length})
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedQuestions.map((q) => (
                            <div key={q.id} className="flex-shrink-0 w-20">
                                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                                    <img src={q.fileUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="mt-1 flex items-center gap-1">
                                    <span className="text-[10px] text-[var(--color-brand-light)] truncate">{q.lesson}</span>
                                    {q.analysis && (
                                        <span className="text-[10px] text-[var(--color-success)]">✓</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass-card p-5 text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Ana sayfadan soruları seçip alt çubuktaki &quot;AI Tavsiye&quot; butonuna basarak buraya gelebilirsiniz.
                    </p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => { setActiveTab(id); setResult(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === id
                            ? "bg-[var(--color-brand)]/10 text-[var(--color-brand-light)]"
                            : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                            }`}
                    >
                        <Icon size={16} />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="glass-card p-5 space-y-4">
                {activeTab === "recommendations" && (
                    <>
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                            Çalışma Tavsiyeleri
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Seçilen {selectedQuestions.length} sorunun analizine göre kişiselleştirilmiş çalışma tavsiyeleri alın.
                        </p>
                        <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1">
                                <MessageSquare size={12} />
                                Özel Prompt (opsiyonel)
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Bu alana bir prompt yazarsanız varsayılan yerine bu kullanılır. Boş bırakırsanız ayarlardaki veya varsayılan prompt geçerlidir."
                                className="input-field min-h-[60px] resize-y text-xs"
                                rows={2}
                            />
                        </div>
                        <button
                            onClick={() => callAI("study-recommendations")}
                            disabled={isLoading || selectedQuestions.length === 0}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Tavsiye Al
                        </button>
                    </>
                )}

                {activeTab === "plan" && (
                    <>
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                            Çalışma Programı Hazırla
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Seçilen sorulardan elde edilen konulara göre özel çalışma programı oluşturun.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                                    Günlük Saat
                                </label>
                                <input
                                    type="number"
                                    value={hoursPerDay}
                                    onChange={(e) => setHoursPerDay(e.target.value)}
                                    className="input-field"
                                    min="1"
                                    max="16"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                                    Gün Sayısı
                                </label>
                                <input
                                    type="number"
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                    className="input-field"
                                    min="1"
                                    max="90"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1">
                                <MessageSquare size={12} />
                                Özel Prompt (opsiyonel)
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Bu alana bir prompt yazarsanız varsayılan yerine bu kullanılır. Boş bırakırsanız ayarlardaki veya varsayılan prompt geçerlidir."
                                className="input-field min-h-[60px] resize-y text-xs"
                                rows={2}
                            />
                        </div>
                        <button
                            onClick={() => callAI("study-plan")}
                            disabled={isLoading || selectedQuestions.length === 0}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                            Program Oluştur
                        </button>
                    </>
                )}
            </div>

            {/* Result */}
            {result && (
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-[var(--color-brand-light)] mb-3 flex items-center gap-2">
                        <Sparkles size={14} />
                        AI Yanıtı
                    </h3>
                    <MarkdownRenderer content={result} />
                </div>
            )}
        </div>
    );
}

export default function AIPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[var(--color-brand)]" />
            </div>
        }>
            <AIPageContent />
        </Suspense>
    );
}

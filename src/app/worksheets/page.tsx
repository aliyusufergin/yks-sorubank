"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, Trash2, Calendar, BookOpen, Loader2, Edit3, CheckSquare, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface WorksheetData {
    id: string;
    title: string;
    name: string | null;
    createdAt: string;
    questions: { question: { lesson: string } }[];
}

export default function WorksheetsPage() {
    const [worksheets, setWorksheets] = useState<WorksheetData[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchWorksheets = async () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        const res = await fetch(`/api/worksheets?${params}`);
        const data = await res.json();
        setWorksheets(data);
        setIsLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(fetchWorksheets, search ? 300 : 0);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm("Bu çalışma kağıdını silmek istediğinize emin misiniz?")) return;
        await fetch(`/api/worksheets/${id}`, { method: "DELETE" });
        fetchWorksheets();
    };

    const handleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(worksheets.map((ws) => ws.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`${selectedIds.size} çalışma kağıdını silmek istediğinize emin misiniz?`)) return;
        await fetch("/api/worksheets", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        setSelectedIds(new Set());
        fetchWorksheets();
    };
    const handleRename = async (id: string, currentTitle: string) => {
        const newTitle = prompt("Yeni başlık:", currentTitle);
        if (!newTitle || newTitle === currentTitle) return;
        await fetch(`/api/worksheets/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
        });
        fetchWorksheets();
    };

    const uniqueLessons = (ws: WorksheetData) => {
        const lessons = new Set(ws.questions.map((q) => q.question.lesson));
        return Array.from(lessons);
    };

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/10 via-transparent to-transparent border border-[var(--color-border)] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                    <FileText size={28} className="text-[var(--color-accent)]" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Çalışma Kağıtları</h1>
                </div>
                <p className="text-[var(--color-text-secondary)]">
                    Oluşturduğun çalışma kağıtlarını görüntüle, yazdır ve düzenle.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="relative flex-1 min-w-0">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ara..."
                        className="input-field"
                        style={{ paddingLeft: "2.5rem" }}
                    />
                </div>
                <button
                    onClick={handleSelectAll}
                    className="btn-secondary flex items-center gap-2"
                >
                    <CheckSquare size={16} />
                    <span className="hidden sm:inline">{selectedIds.size > 0 ? "Seçimi Kaldır" : "Tümünü Seç"}</span>
                </button>
            </div>

            {/* Worksheet List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-[var(--color-brand)]" />
                </div>
            ) : worksheets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText size={48} className="text-[var(--color-text-muted)] mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-secondary)]">Henüz çalışma kağıdı yok</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Soru havuzundan soruları seçip çalışma kağıdı oluşturun</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {worksheets.map((ws) => (
                        <div
                            key={ws.id}
                            className={`glass-card flex items-center gap-4 p-4 cursor-pointer transition-all ${selectedIds.has(ws.id)
                                ? "ring-2 ring-[var(--color-brand)] bg-[var(--color-brand)]/5"
                                : ""
                                }`}
                            onClick={() => handleSelect(ws.id)}
                        >
                            <div className="flex-shrink-0">
                                <div
                                    className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${selectedIds.has(ws.id)
                                        ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                                        : "border-[var(--color-border)]"
                                        }`}
                                >
                                    {selectedIds.has(ws.id) && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex-shrink-0">
                                <FileText size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link href={`/worksheets/${ws.id}`} className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-light)] transition-colors truncate block">
                                    {ws.title}
                                </Link>
                                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={10} /> {formatDate(ws.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen size={10} /> {ws.questions.length} soru
                                    </span>
                                </div>
                                {uniqueLessons(ws).length > 0 && (
                                    <div className="flex gap-1 mt-1.5 flex-wrap">
                                        {uniqueLessons(ws).map((l) => (
                                            <span key={l} className="inline-flex rounded-md bg-[var(--color-brand)]/10 px-1.5 py-0.5 text-xs text-[var(--color-brand-light)]">
                                                {l}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRename(ws.id, ws.title); }}
                                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-all"
                                    title="Yeniden adlandır"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(ws.id); }}
                                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all"
                                    title="Sil"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] px-3 sm:px-6 py-2.5 sm:py-3 shadow-2xl backdrop-blur-xl max-w-[calc(100vw-2rem)] overflow-x-auto">
                    <span className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
                        {selectedIds.size} seçildi
                    </span>
                    <div className="h-4 w-px bg-[var(--color-border)] flex-shrink-0" />
                    <button
                        onClick={handleBulkDelete}
                        className="btn-secondary flex items-center gap-1.5 text-xs sm:text-sm py-1.5 sm:py-2 whitespace-nowrap text-[var(--color-danger)]"
                    >
                        <Trash size={14} />
                        <span className="hidden sm:inline">Seçilenleri Sil</span>
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] whitespace-nowrap flex-shrink-0">
                        Vazgeç
                    </button>
                </div>
            )}
        </div>
    );
}

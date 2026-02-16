"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, Trash2, Calendar, BookOpen, Loader2, Edit3 } from "lucide-react";
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

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Çalışma kağıtlarında ara..."
                    className="input-field"
                    style={{ paddingLeft: "2.5rem" }}
                />
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
                        <div key={ws.id} className="glass-card flex items-center gap-4 p-4">
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
                                    onClick={() => handleRename(ws.id, ws.title)}
                                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-all"
                                    title="Yeniden adlandır"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(ws.id)}
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
        </div>
    );
}

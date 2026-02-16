"use client";

import { useState, useEffect } from "react";
import { X, Filter, Sparkles } from "lucide-react";

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: { lesson?: string; subject?: string; source?: string; hasAnalysis?: string }) => void;
    currentFilters: { lesson?: string; subject?: string; source?: string; hasAnalysis?: string };
}

export default function FilterModal({ isOpen, onClose, onApply, currentFilters }: FilterModalProps) {
    const [lesson, setLesson] = useState(currentFilters.lesson || "");
    const [subject, setSubject] = useState(currentFilters.subject || "");
    const [source, setSource] = useState(currentFilters.source || "");
    const [hasAnalysis, setHasAnalysis] = useState(currentFilters.hasAnalysis || "");
    const [options, setOptions] = useState<{
        lessons: string[];
        subjects: { subject: string; lesson: string }[];
        sources: string[];
    }>({ lessons: [], subjects: [], sources: [] });

    useEffect(() => {
        if (isOpen) {
            fetch("/api/filters").then((r) => r.json()).then(setOptions);
        }
    }, [isOpen]);

    const filteredSubjects = lesson
        ? options.subjects.filter((s) => s.lesson === lesson)
        : options.subjects;

    const handleApply = () => {
        onApply({
            lesson: lesson || undefined,
            subject: subject || undefined,
            source: source || undefined,
            hasAnalysis: hasAnalysis || undefined,
        });
        onClose();
    };

    const handleClear = () => {
        setLesson("");
        setSubject("");
        setSource("");
        setHasAnalysis("");
        onApply({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-md p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-[var(--color-brand)]" />
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Filtrele</h2>
                    </div>
                    <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Ders</label>
                        <select value={lesson} onChange={(e) => { setLesson(e.target.value); setSubject(""); }} className="input-field">
                            <option value="">Tümü</option>
                            {options.lessons.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Konu</label>
                        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field">
                            <option value="">Tümü</option>
                            {filteredSubjects.map((s) => (
                                <option key={s.subject} value={s.subject}>{s.subject}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Kaynak</label>
                        <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field">
                            <option value="">Tümü</option>
                            {options.sources.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 flex items-center gap-1.5">
                            <Sparkles size={13} />
                            AI Analiz Durumu
                        </label>
                        <select value={hasAnalysis} onChange={(e) => setHasAnalysis(e.target.value)} className="input-field">
                            <option value="">Tümü</option>
                            <option value="true">Analiz Var</option>
                            <option value="false">Analiz Yok</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={handleClear} className="btn-secondary flex-1">Temizle</button>
                    <button onClick={handleApply} className="btn-primary flex-1">Uygula</button>
                </div>
            </div>
        </div>
    );
}

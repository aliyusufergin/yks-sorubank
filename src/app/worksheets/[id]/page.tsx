"use client";

import { useState, useEffect, use } from "react";
import { Printer, ArrowLeft, Loader2, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

interface WorksheetDetail {
    id: string;
    title: string;
    createdAt: string;
    questions: {
        order: number;
        question: {
            id: string;
            fileUrl: string;
            lesson: string;
            subject: string | null;
            source: string | null;
            pageNumber: number | null;
            questionNumber: number | null;
            answer: string | null;
        };
    }[];
}

type SpacingSettings = Record<string, number>;
const STORAGE_KEY = "yks-sorubank-worksheet-spacing";
const DEFAULT_SPACING = 40;

function loadSpacingSettings(): SpacingSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function saveSpacingSettings(settings: SpacingSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function WorksheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [worksheet, setWorksheet] = useState<WorksheetDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const [spacingSettings, setSpacingSettings] = useState<SpacingSettings>({});
    const [showSpacingPanel, setShowSpacingPanel] = useState(false);

    useEffect(() => {
        fetch(`/api/worksheets/${id}`)
            .then((r) => r.json())
            .then((data) => {
                setWorksheet(data);
                setIsLoading(false);
            });
        setSpacingSettings(loadSpacingSettings());
    }, [id]);

    const getSpacing = (lesson: string): number => {
        return spacingSettings[lesson] ?? spacingSettings._default ?? DEFAULT_SPACING;
    };

    const updateSpacing = (key: string, value: number) => {
        const updated = { ...spacingSettings, [key]: value };
        setSpacingSettings(updated);
        saveSpacingSettings(updated);
    };

    const uniqueLessons = worksheet
        ? [...new Set(worksheet.questions.map((wq) => wq.question.lesson))]
        : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[var(--color-brand)]" />
            </div>
        );
    }

    if (!worksheet) {
        return (
            <div className="text-center py-20">
                <p className="text-[var(--color-text-secondary)]">Çalışma kağıdı bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header (no-print) */}
            <div className="no-print flex items-center justify-between">
                <Link href="/worksheets" className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                    <ArrowLeft size={16} />
                    Geri Dön
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSpacingPanel(!showSpacingPanel)}
                        className={`btn-secondary flex items-center gap-2 text-sm ${showSpacingPanel ? "border-[var(--color-brand)] text-[var(--color-brand-light)]" : ""}`}
                    >
                        <SlidersHorizontal size={16} />
                        <span className="hidden sm:inline">Boşluk Ayarı</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Yazdır
                    </button>
                </div>
            </div>

            {/* Spacing Settings Panel (no-print) */}
            {showSpacingPanel && (
                <div className="no-print mx-auto max-w-[210mm] glass-card p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                            <SlidersHorizontal size={16} />
                            Soru Altı Çalışma Boşluğu
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Her ders için soruların altındaki çalışma/not alanı boyutunu ayarlayın.
                        </p>
                    </div>

                    {/* Default spacing */}
                    <div className="rounded-lg border border-[var(--color-border)] p-3 space-y-2">
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Varsayılan Boşluk</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={0}
                                max={150}
                                step={5}
                                value={spacingSettings._default ?? DEFAULT_SPACING}
                                onChange={(e) => updateSpacing("_default", Number(e.target.value))}
                                className="flex-1 accent-[var(--color-brand)]"
                            />
                            <span className="text-xs font-mono text-[var(--color-text-muted)] w-14 text-right">
                                {spacingSettings._default ?? DEFAULT_SPACING} mm
                            </span>
                        </div>
                    </div>

                    {/* Per-lesson spacing */}
                    {uniqueLessons.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Ders Bazlı</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {uniqueLessons.map((lesson) => (
                                    <div key={lesson} className="rounded-lg border border-[var(--color-border)] p-3 space-y-2">
                                        <label className="text-xs font-medium text-[var(--color-text-primary)]">{lesson}</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={0}
                                                max={150}
                                                step={5}
                                                value={getSpacing(lesson)}
                                                onChange={(e) => updateSpacing(lesson, Number(e.target.value))}
                                                className="flex-1 accent-[var(--color-brand)]"
                                            />
                                            <span className="text-xs font-mono text-[var(--color-text-muted)] w-14 text-right">
                                                {getSpacing(lesson)} mm
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* A4 Print Layout */}
            <div className="mx-auto max-w-[210mm] bg-white text-black rounded-xl overflow-hidden shadow-lg print:shadow-none print:rounded-none">
                {/* Print Header */}
                <div className="border-b-2 border-gray-300 p-6">
                    <h1 className="text-xl font-bold text-center mb-4">{worksheet.title}</h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Ad Soyad:</span>
                            <div className="flex-1 border-b border-gray-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Puan:</span>
                            <div className="flex-1 border-b border-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Questions - Dynamic height columns */}
                <div className="p-4 sm:p-6 worksheet-columns">
                    {worksheet.questions.map((wq, index) => {
                        const spacing = getSpacing(wq.question.lesson);
                        return (
                            <div key={wq.question.id} className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                                <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                                    <span className="text-xs font-bold text-gray-700">
                                        Soru {index + 1}
                                    </span>
                                </div>
                                <div className="p-2">
                                    <img
                                        src={wq.question.fileUrl}
                                        alt={`Soru ${index + 1}`}
                                        className="w-full object-contain"
                                    />
                                </div>
                                {spacing > 0 && (
                                    <div
                                        className="border-t border-dashed border-gray-300 worksheet-answer-space"
                                        style={{ height: `${spacing}mm` }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Answer Key (no-print) */}
            <div className="no-print mx-auto max-w-[210mm]">
                <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className="w-full flex items-center justify-between rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]/80 transition-colors"
                >
                    <span>🔑 Cevap Anahtarı</span>
                    {showAnswerKey ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showAnswerKey && (
                    <div className="mt-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="text-left py-2 px-3 text-[var(--color-text-secondary)] font-medium">Soru</th>
                                    <th className="text-left py-2 px-3 text-[var(--color-text-secondary)] font-medium">Ders</th>
                                    <th className="text-left py-2 px-3 text-[var(--color-text-secondary)] font-medium">Konu</th>
                                    <th className="text-left py-2 px-3 text-[var(--color-text-secondary)] font-medium">Kaynak</th>
                                    <th className="text-left py-2 px-3 text-[var(--color-text-secondary)] font-medium">Cevap</th>
                                </tr>
                            </thead>
                            <tbody>
                                {worksheet.questions.map((wq, index) => (
                                    <tr key={wq.question.id} className="border-b border-[var(--color-border)]/50 last:border-0">
                                        <td className="py-2 px-3 text-[var(--color-text-primary)] font-medium">Soru {index + 1}</td>
                                        <td className="py-2 px-3 text-[var(--color-text-secondary)]">{wq.question.lesson}</td>
                                        <td className="py-2 px-3 text-[var(--color-text-secondary)]">{wq.question.subject || "—"}</td>
                                        <td className="py-2 px-3 text-[var(--color-text-muted)]">
                                            {wq.question.source || ""}
                                            {(wq.question.pageNumber || wq.question.questionNumber) && (
                                                <span className="ml-1 text-xs">
                                                    {wq.question.pageNumber && `${wq.question.pageNumber}`}
                                                    {wq.question.pageNumber && wq.question.questionNumber && " / "}
                                                    {wq.question.questionNumber && `#${wq.question.questionNumber}`}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-[var(--color-brand-light)]">
                                            {wq.question.answer || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

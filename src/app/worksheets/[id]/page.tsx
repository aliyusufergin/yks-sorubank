"use client";

import { useState, useEffect, use } from "react";
import { Printer, ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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

export default function WorksheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [worksheet, setWorksheet] = useState<WorksheetDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAnswerKey, setShowAnswerKey] = useState(false);

    useEffect(() => {
        fetch(`/api/worksheets/${id}`)
            .then((r) => r.json())
            .then((data) => {
                setWorksheet(data);
                setIsLoading(false);
            });
    }, [id]);

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
                <button
                    onClick={() => window.print()}
                    className="btn-primary flex items-center gap-2"
                >
                    <Printer size={16} />
                    Yazdır
                </button>
            </div>

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

                {/* Questions Grid - 2 columns */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    {worksheet.questions.map((wq, index) => (
                        <div key={wq.question.id} className="border border-gray-200 rounded-lg overflow-hidden">
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
                        </div>
                    ))}
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
                                                    {wq.question.pageNumber && `S.${wq.question.pageNumber}`}
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

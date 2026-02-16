"use client";

import { useState, useEffect, use } from "react";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
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
            pageNumber: number | null;
            questionNumber: number | null;
        };
    }[];
}

export default function WorksheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [worksheet, setWorksheet] = useState<WorksheetDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                            <div className="bg-gray-50 px-3 py-1.5 flex items-center justify-between border-b border-gray-200">
                                <span className="text-xs font-bold text-gray-700">
                                    Soru {index + 1}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {wq.question.lesson}
                                    {wq.question.subject ? ` – ${wq.question.subject}` : ""}
                                </span>
                            </div>
                            <div className="p-2">
                                <img
                                    src={wq.question.fileUrl}
                                    alt={`Soru ${index + 1}`}
                                    className="w-full object-contain"
                                />
                            </div>
                            {(wq.question.pageNumber || wq.question.questionNumber) && (
                                <div className="px-3 py-1 text-xs text-gray-400 border-t border-gray-100">
                                    {wq.question.pageNumber && `S.${wq.question.pageNumber}`}
                                    {wq.question.pageNumber && wq.question.questionNumber && " / "}
                                    {wq.question.questionNumber && `#${wq.question.questionNumber}`}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

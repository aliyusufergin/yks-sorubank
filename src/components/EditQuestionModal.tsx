"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";

interface EditQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    question: {
        id: string;
        lesson: string;
        subject?: string | null;
        source?: string | null;
        pageNumber?: number | null;
        questionNumber?: number | null;
        answer?: string | null;
    };
}

interface LessonData {
    id: string;
    name: string;
    subjects: { id: string; name: string }[];
}

export default function EditQuestionModal({ isOpen, onClose, onSuccess, question }: EditQuestionModalProps) {
    const [lesson, setLesson] = useState(question.lesson);
    const [subject, setSubject] = useState(question.subject || "");
    const [source, setSource] = useState(question.source || "");
    const [pageNumber, setPageNumber] = useState(question.pageNumber?.toString() || "");
    const [questionNumber, setQuestionNumber] = useState(question.questionNumber?.toString() || "");
    const [answer, setAnswer] = useState(question.answer || "");
    const [isSaving, setIsSaving] = useState(false);
    const [lessons, setLessons] = useState<LessonData[]>([]);
    const [books, setBooks] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetch("/api/lessons").then((r) => r.json()).then(setLessons);
            fetch("/api/books").then((r) => r.json()).then(setBooks);
        }
    }, [isOpen]);

    // Sync state when question prop changes
    useEffect(() => {
        setLesson(question.lesson);
        setSubject(question.subject || "");
        setSource(question.source || "");
        setPageNumber(question.pageNumber?.toString() || "");
        setQuestionNumber(question.questionNumber?.toString() || "");
        setAnswer(question.answer || "");
    }, [question]);

    const selectedLessonData = lessons.find((l) => l.name === lesson);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lesson) return;

        setIsSaving(true);

        try {
            const res = await fetch(`/api/questions/${question.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lesson,
                    subject: subject || null,
                    source: source || null,
                    pageNumber: pageNumber ? parseInt(pageNumber) : null,
                    questionNumber: questionNumber ? parseInt(questionNumber) : null,
                    answer: answer || null,
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error("Düzenleme hatası:", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Soruyu Düzenle</h2>
                    <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Lesson Select */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                            Ders *
                        </label>
                        <select
                            value={lesson}
                            onChange={(e) => { setLesson(e.target.value); setSubject(""); }}
                            required
                            className="input-field"
                        >
                            <option value="">Ders seçin</option>
                            {lessons.map((l) => (
                                <option key={l.id} value={l.name}>{l.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Select */}
                    {selectedLessonData && selectedLessonData.subjects.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Konu
                            </label>
                            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field">
                                <option value="">Konu seçin (opsiyonel)</option>
                                {selectedLessonData.subjects.map((s) => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Source Select */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                            Kaynak (Kitap)
                        </label>
                        <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field">
                            <option value="">Kaynak seçin (opsiyonel)</option>
                            {books.map((b) => (
                                <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Page & Question Number */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Sayfa No
                            </label>
                            <input
                                type="number"
                                value={pageNumber}
                                onChange={(e) => setPageNumber(e.target.value)}
                                placeholder="Ör: 42"
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Soru No
                            </label>
                            <input
                                type="number"
                                value={questionNumber}
                                onChange={(e) => setQuestionNumber(e.target.value)}
                                placeholder="Ör: 7"
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Answer */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                            Cevap
                        </label>
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Ör: A, B, C, D, E"
                            className="input-field"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving || !lesson}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Kaydet
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { X, Upload, Plus, Loader2 } from "lucide-react";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface LessonData {
    id: string;
    name: string;
    subjects: { id: string; name: string }[];
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [lesson, setLesson] = useState("");
    const [subject, setSubject] = useState("");
    const [source, setSource] = useState("");
    const [pageNumber, setPageNumber] = useState("");
    const [questionNumber, setQuestionNumber] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [lessons, setLessons] = useState<LessonData[]>([]);
    const [books, setBooks] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetch("/api/lessons").then((r) => r.json()).then(setLessons);
            fetch("/api/books").then((r) => r.json()).then(setBooks);
        }
    }, [isOpen]);

    const selectedLessonData = lessons.find((l) => l.name === lesson);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!files.length || !lesson) return;

        setIsUploading(true);

        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        formData.append("lesson", lesson);
        if (subject) formData.append("subject", subject);
        if (source) formData.append("source", source);
        if (pageNumber) formData.append("pageNumber", pageNumber);
        if (questionNumber) formData.append("questionNumber", questionNumber);

        try {
            const res = await fetch("/api/questions", { method: "POST", body: formData });
            if (res.ok) {
                setFiles([]);
                setLesson("");
                setSubject("");
                setSource("");
                setPageNumber("");
                setQuestionNumber("");
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error("Yükleme hatası:", err);
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Soru Ekle</h2>
                    <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* File Drop Zone */}
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-brand)] transition-colors">
                        <Upload size={24} className="text-[var(--color-text-muted)] mb-2" />
                        <span className="text-sm text-[var(--color-text-secondary)]">
                            {files.length > 0 ? `${files.length} dosya seçildi` : "Fotoğraf seç veya sürükle"}
                        </span>
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                    </label>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        💡 Çalışma kağıtlarında tutarlı görünüm için <strong>4:3</strong> veya <strong>3:4</strong> oranlı görseller önerilir.
                    </p>

                    {/* Preview */}
                    {files.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {files.map((f, i) => (
                                <div key={i} className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--color-bg-elevated)]">
                                    <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-white text-xs"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

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

                    <button
                        type="submit"
                        disabled={isUploading || !files.length || !lesson}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Yükleniyor...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Soru Ekle ({files.length})
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Settings, Sun, Moon, Plus, Trash2, Key, BookOpen, Tag, Library, Sparkles, Save, ChevronDown, ChevronUp, Cpu, Loader2, RefreshCw } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto";

interface LessonData {
    id: string;
    name: string;
    subjects: { id: string; name: string }[];
}

interface BookData {
    id: string;
    name: string;
}

interface AIPromptData {
    id: string;
    lesson: string;
    subject: string;
    prompt: string;
}

interface ModelData {
    id: string;
    name: string;
    description: string;
}

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();

    const [apiKey, setApiKey] = useState("");
    const [lessons, setLessons] = useState<LessonData[]>([]);
    const [books, setBooks] = useState<BookData[]>([]);
    const [newLesson, setNewLesson] = useState("");
    const [newBook, setNewBook] = useState("");
    const [newSubject, setNewSubject] = useState("");
    const [selectedLessonId, setSelectedLessonId] = useState("");

    // AI Prompts state
    const [aiPrompts, setAiPrompts] = useState<AIPromptData[]>([]);
    const [promptLesson, setPromptLesson] = useState("");
    const [promptSubject, setPromptSubject] = useState("__default__");
    const [promptText, setPromptText] = useState("");
    const [promptSaving, setPromptSaving] = useState(false);
    const [showPromptSection, setShowPromptSection] = useState(false);

    // AI Assistant prompts (recommendations & plan)
    const [recommendationsPrompt, setRecommendationsPrompt] = useState("");
    const [studyPlanPrompt, setStudyPlanPrompt] = useState("");

    // Model selection state
    const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
    const [availableModels, setAvailableModels] = useState<ModelData[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [modelsError, setModelsError] = useState("");

    useEffect(() => {
        const savedModel = localStorage.getItem("yks-sorubank-model");
        if (savedModel) setSelectedModel(savedModel);

        const savedRecPrompt = localStorage.getItem("yks-sorubank-prompt-recommendations");
        const savedPlanPrompt = localStorage.getItem("yks-sorubank-prompt-plan");
        if (savedRecPrompt) setRecommendationsPrompt(savedRecPrompt);
        if (savedPlanPrompt) setStudyPlanPrompt(savedPlanPrompt);

        // Decrypt API key
        const encryptedKey = localStorage.getItem("yks-sorubank-api-key");
        if (encryptedKey) {
            decryptApiKey(encryptedKey).then((key) => setApiKey(key));
        }

        // Fetch all data in parallel
        Promise.all([
            fetch("/api/lessons").then((r) => r.json()),
            fetch("/api/books").then((r) => r.json()),
            fetch("/api/ai/prompts").then((r) => r.json()),
        ]).then(([lessonsData, booksData, promptsData]) => {
            setLessons(lessonsData);
            setBooks(booksData);
            setAiPrompts(promptsData);
        });
    }, []);

    const fetchLessons = async () => {
        const res = await fetch("/api/lessons");
        const data = await res.json();
        setLessons(data);
    };

    const fetchBooks = async () => {
        const res = await fetch("/api/books");
        const data = await res.json();
        setBooks(data);
    };

    const fetchPrompts = async () => {
        const res = await fetch("/api/ai/prompts");
        const data = await res.json();
        setAiPrompts(data);
    };



    const handleApiKeyChange = async (val: string) => {
        setApiKey(val);
        if (val) {
            const encrypted = await encryptApiKey(val);
            localStorage.setItem("yks-sorubank-api-key", encrypted);
        } else {
            localStorage.removeItem("yks-sorubank-api-key");
        }
    };

    const handleModelChange = (model: string) => {
        setSelectedModel(model);
        localStorage.setItem("yks-sorubank-model", model);
    };

    const fetchModels = async () => {
        if (!apiKey) {
            setModelsError("Önce API anahtarınızı girin.");
            return;
        }
        setModelsLoading(true);
        setModelsError("");
        try {
            const res = await fetch("/api/ai/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey }),
            });
            const data = await res.json();
            if (data.error) {
                setModelsError(data.error);
            } else {
                setAvailableModels(data);
            }
        } catch {
            setModelsError("Model listesi alınamadı.");
        } finally {
            setModelsLoading(false);
        }
    };

    const addLesson = async () => {
        if (!newLesson.trim()) return;
        await fetch("/api/lessons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newLesson.trim() }),
        });
        setNewLesson("");
        fetchLessons();
    };

    const deleteLesson = async (id: string) => {
        if (!confirm("Bu ders ve altındaki tüm konular silinecek. Emin misiniz?")) return;
        await fetch(`/api/lessons?id=${id}`, { method: "DELETE" });
        fetchLessons();
    };

    const addSubject = async () => {
        if (!newSubject.trim() || !selectedLessonId) return;
        await fetch("/api/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newSubject.trim(), lessonId: selectedLessonId }),
        });
        setNewSubject("");
        fetchLessons();
    };

    const deleteSubject = async (id: string) => {
        await fetch(`/api/subjects?id=${id}`, { method: "DELETE" });
        fetchLessons();
    };

    const addBook = async () => {
        if (!newBook.trim()) return;
        await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newBook.trim() }),
        });
        setNewBook("");
        fetchBooks();
    };

    const deleteBook = async (id: string) => {
        await fetch(`/api/books?id=${id}`, { method: "DELETE" });
        fetchBooks();
    };

    const savePrompt = async () => {
        if (!promptLesson || !promptText.trim()) return;
        setPromptSaving(true);
        await fetch("/api/ai/prompts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lesson: promptLesson, subject: promptSubject, prompt: promptText.trim() }),
        });
        setPromptSaving(false);
        setPromptText("");
        fetchPrompts();
    };

    const deletePrompt = async (id: string) => {
        await fetch(`/api/ai/prompts?id=${id}`, { method: "DELETE" });
        fetchPrompts();
    };

    const loadPromptForEdit = (p: AIPromptData) => {
        setPromptLesson(p.lesson);
        setPromptSubject(p.subject);
        setPromptText(p.prompt);
        setShowPromptSection(true);
    };

    const selectedLessonForPrompt = lessons.find((l) => l.name === promptLesson);

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-text-muted)]/10 via-transparent to-transparent border border-[var(--color-border)] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                    <Settings size={28} className="text-[var(--color-text-secondary)]" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ayarlar</h1>
                </div>
            </div>

            {/* Theme */}
            <section className="glass-card p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                    Tema
                </h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => setTheme("light")}
                        className={`flex-1 rounded-xl p-3 border transition-all text-sm font-medium ${theme === "light"
                            ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-light)]"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                            }`}
                    >
                        <Sun size={20} className="mx-auto mb-1" />
                        Açık
                    </button>
                    <button
                        onClick={() => setTheme("dark")}
                        className={`flex-1 rounded-xl p-3 border transition-all text-sm font-medium ${theme === "dark"
                            ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-light)]"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                            }`}
                    >
                        <Moon size={20} className="mx-auto mb-1" />
                        Koyu
                    </button>
                </div>
            </section>



            {/* API Key */}
            <section className="glass-card p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Key size={16} />
                    AI API Anahtarı
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Google Gemini API anahtarınızı girin. Anahtar AES-256 ile şifrelenerek tarayıcınızda saklanır.
                </p>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="API anahtarınızı yapıştırın..."
                    className="input-field"
                />
            </section>

            {/* Model Selection */}
            <section className="glass-card p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Cpu size={16} />
                    AI Model Seçimi
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Soru çözümü ve tavsiyeler için kullanılacak Gemini modelini seçin.
                </p>
                <div className="flex gap-2">
                    <select
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="input-field flex-1 text-sm"
                    >
                        {availableModels.length === 0 ? (
                            <option value={selectedModel}>{selectedModel}</option>
                        ) : (
                            availableModels.map((m) => (
                                <option key={m.id} value={m.id}>{m.name || m.id}</option>
                            ))
                        )}
                    </select>
                    <button
                        onClick={fetchModels}
                        disabled={modelsLoading || !apiKey}
                        className="btn-secondary px-3 disabled:opacity-50"
                        title="Modelleri yenile"
                    >
                        {modelsLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    </button>
                </div>
                {modelsError && (
                    <p className="text-xs text-[var(--color-danger)]">{modelsError}</p>
                )}
                {availableModels.length > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {availableModels.length} model mevcut
                    </p>
                )}
            </section>

            {/* AI Prompts */}
            <section className="glass-card p-5 space-y-4">
                <button
                    onClick={() => setShowPromptSection(!showPromptSection)}
                    className="w-full flex items-center justify-between"
                >
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                        <Sparkles size={16} />
                        AI Promptları
                    </h2>
                    {showPromptSection ? <ChevronUp size={16} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
                </button>

                <p className="text-xs text-[var(--color-text-muted)]">
                    Ders ve konu bazlı özel AI promptları tanımlayın. Soru çözümünde bu promptlar kullanılır.
                </p>

                {showPromptSection && (
                    <>
                        {/* Prompt Editor */}
                        <div className="space-y-3 rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-bg)]/50">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">Ders</label>
                                    <select
                                        value={promptLesson}
                                        onChange={(e) => { setPromptLesson(e.target.value); setPromptSubject("__default__"); }}
                                        className="input-field text-sm"
                                    >
                                        <option value="">Ders seçin...</option>
                                        {lessons.map((l) => (
                                            <option key={l.id} value={l.name}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">Konu (opsiyonel)</label>
                                    <select
                                        value={promptSubject}
                                        onChange={(e) => setPromptSubject(e.target.value)}
                                        className="input-field text-sm"
                                        disabled={!promptLesson}
                                    >
                                        <option value="__default__">Tüm konular (varsayılan)</option>
                                        {selectedLessonForPrompt?.subjects.map((s) => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Prompt</label>
                                <textarea
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    placeholder={`Varsayılan: Sen bir YKS soru çözücüsün. Bu soru görselini analiz et ve aşağıdaki formatta yanıt ver. Cevabı markdown formatında ver, matematik ifadelerini LaTeX ($..$ ve $$..$$) ile yaz.\n\n**KONU:** [Sorunun ait olduğu konu]\n**ZORLUK:** [Kolay/Orta/Zor]\n**ÖZET:** [Sorunun kısa açıklaması, 1-2 cümle]\n\n**ÇÖZÜM:**\n[Adım adım detaylı çözüm]\n\n**DOĞRU CEVAP:** [Şık varsa belirt]\n\nTürkçe olarak, öğrencinin anlayacağı şekilde açıkla.`}
                                    className="input-field min-h-[100px] resize-y"
                                    rows={4}
                                />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1.5 italic">
                                    💡 Markdown ve LaTeX formatında çıktı vermesi için otomatik talimat eklenir, ayrıca yazmanıza gerek yok.
                                </p>
                            </div>
                            <button
                                onClick={savePrompt}
                                disabled={!promptLesson || !promptText.trim() || promptSaving}
                                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                <Save size={14} />
                                {promptSaving ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                        </div>

                        {/* Existing Prompts */}
                        {aiPrompts.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Kayıtlı Promptlar</h3>
                                {aiPrompts.map((p) => (
                                    <div key={p.id} className="rounded-lg border border-[var(--color-border)] p-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center rounded-md bg-[var(--color-brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-brand-light)]">
                                                    {p.lesson}
                                                </span>
                                                {p.subject !== "__default__" && (
                                                    <span className="text-xs text-[var(--color-text-secondary)]">{p.subject}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => loadPromptForEdit(p)}
                                                    className="text-xs text-[var(--color-brand-light)] hover:underline"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => deletePrompt(p.id)}
                                                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{p.prompt}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* AI Assistant Prompts */}
            <section className="glass-card p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Sparkles size={16} />
                    AI Asistan Promptları
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Çalışma tavsiyeleri ve program hazırlama için özel promptlar tanımlayın. Boş bırakırsanız varsayılan prompt kullanılır.
                </p>

                {/* Recommendations Prompt */}
                <div className="space-y-2 rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-bg)]/50">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                        📚 Çalışma Tavsiyeleri Promptu
                    </label>
                    <textarea
                        value={recommendationsPrompt}
                        onChange={(e) => {
                            setRecommendationsPrompt(e.target.value);
                            if (e.target.value.trim()) {
                                localStorage.setItem("yks-sorubank-prompt-recommendations", e.target.value.trim());
                            } else {
                                localStorage.removeItem("yks-sorubank-prompt-recommendations");
                            }
                        }}
                        placeholder={`Varsayılan: Sen bir YKS sınav koçusun. Öğrenci aşağıdaki soruları çalışmak istiyor:\n\nBu bilgilere göre:\n1. Hangi konulara öncelik vermesi gerektiğini\n2. Her konu için somut çalışma tavsiyeleri\n3. Zayıf yönlerini nasıl güçlendirebileceğini\n4. Motivasyon artırıcı öneriler\n\nTürkçe olarak, madde madde açıkla.`}
                        className="input-field min-h-[80px] resize-y text-sm"
                        rows={3}
                    />
                </div>

                {/* Study Plan Prompt */}
                <div className="space-y-2 rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-bg)]/50">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                        📅 Çalışma Programı Promptu
                    </label>
                    <textarea
                        value={studyPlanPrompt}
                        onChange={(e) => {
                            setStudyPlanPrompt(e.target.value);
                            if (e.target.value.trim()) {
                                localStorage.setItem("yks-sorubank-prompt-plan", e.target.value.trim());
                            } else {
                                localStorage.removeItem("yks-sorubank-prompt-plan");
                            }
                        }}
                        placeholder={`Varsayılan: Sen bir YKS sınav koçusun. Aşağıdaki sorulardan elde edilen konulara göre bir çalışma programı hazırla:\n\nLütfen:\n1. Günlük program tablosu oluştur\n2. Konuları önem ve zorluk derecesine göre dağıt\n3. Tekrar zamanlarını planla\n4. Mola zamanlarını ekle\n\nTürkçe olarak, detaylı bir şekilde açıkla.`}
                        className="input-field min-h-[80px] resize-y text-sm"
                        rows={3}
                    />
                </div>
            </section>

            {/* Lessons */}
            <section className="glass-card p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <BookOpen size={16} />
                    Dersler ve Konular
                </h2>

                {/* Add Lesson */}
                <div className="flex gap-2">
                    <input
                        value={newLesson}
                        onChange={(e) => setNewLesson(e.target.value)}
                        placeholder="Yeni ders ekle (ör: Matematik)"
                        className="input-field flex-1"
                        onKeyDown={(e) => e.key === "Enter" && addLesson()}
                    />
                    <button onClick={addLesson} className="btn-primary px-3">
                        <Plus size={16} />
                    </button>
                </div>

                {/* Lesson List */}
                <div className="space-y-3">
                    {lessons.map((lesson) => (
                        <div key={lesson.id} className="rounded-xl border border-[var(--color-border)] p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{lesson.name}</span>
                                <button
                                    onClick={() => deleteLesson(lesson.id)}
                                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Subjects */}
                            {lesson.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pl-2">
                                    {lesson.subjects.map((subj) => (
                                        <span key={subj.id} className="inline-flex items-center gap-1 rounded-md bg-[var(--color-bg-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
                                            {subj.name}
                                            <button onClick={() => deleteSubject(subj.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Add Subject */}
                            {selectedLessonId === lesson.id ? (
                                <div className="flex gap-2 pl-2">
                                    <input
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        placeholder="Konu adı"
                                        className="input-field flex-1 text-xs py-1.5"
                                        onKeyDown={(e) => e.key === "Enter" && addSubject()}
                                        autoFocus
                                    />
                                    <button onClick={addSubject} className="btn-primary px-2 py-1.5 text-xs">Ekle</button>
                                    <button onClick={() => setSelectedLessonId("")} className="text-xs text-[var(--color-text-muted)]">İptal</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSelectedLessonId(lesson.id)}
                                    className="flex items-center gap-1 text-xs text-[var(--color-brand-light)] hover:underline pl-2"
                                >
                                    <Tag size={10} />
                                    Konu Ekle
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Books */}
            <section className="glass-card p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Library size={16} />
                    Kitaplar
                </h2>

                <div className="flex gap-2">
                    <input
                        value={newBook}
                        onChange={(e) => setNewBook(e.target.value)}
                        placeholder="Yeni kitap ekle (ör: 3D TYT Matematik)"
                        className="input-field flex-1"
                        onKeyDown={(e) => e.key === "Enter" && addBook()}
                    />
                    <button onClick={addBook} className="btn-primary px-3">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {books.map((book) => (
                        <span key={book.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
                            {book.name}
                            <button onClick={() => deleteBook(book.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
                                <Trash2 size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            </section>
        </div>
    );
}

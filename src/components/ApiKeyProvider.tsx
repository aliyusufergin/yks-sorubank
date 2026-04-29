"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Lock, Eye, EyeOff, Loader2, X } from "lucide-react";
import { decryptWithPassword } from "@/lib/crypto";

const SESSION_KEY = "yks-sorubank-session-apikey";

interface ApiKeyContextType {
    apiKey: string | null;
    isUnlocked: boolean;
    hasEncryptedKey: boolean;
    requireApiKey: () => Promise<string>;
    lockApiKey: () => void;
    refreshEncryptedStatus: () => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [hasEncryptedKey, setHasEncryptedKey] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState("");
    const [rememberSession, setRememberSession] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Promise resolver for requireApiKey flow
    const resolverRef = useRef<((key: string) => void) | null>(null);
    const rejecterRef = useRef<((err: Error) => void) | null>(null);

    // Check if encrypted key exists on server + restore session
    useEffect(() => {
        // Restore from sessionStorage
        const sessionKey = sessionStorage.getItem(SESSION_KEY);
        if (sessionKey) {
            setApiKey(sessionKey);
        }

        // Check server for encrypted key
        checkEncryptedKey();
    }, []);

    const checkEncryptedKey = async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            setHasEncryptedKey(!!data["encrypted-api-key"]);
        } catch { /* ignore */ }
    };

    const refreshEncryptedStatus = useCallback(async () => {
        await checkEncryptedKey();
    }, []);

    const lockApiKey = useCallback(() => {
        setApiKey(null);
        sessionStorage.removeItem(SESSION_KEY);
    }, []);

    const unlock = async () => {
        if (!password.trim()) {
            setError("Parola boş olamaz.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/settings");
            const data = await res.json();

            const encrypted = data["encrypted-api-key"];
            const salt = data["api-key-salt"];
            const iv = data["api-key-iv"];

            if (!encrypted || !salt || !iv) {
                setError("Sunucuda kayıtlı API anahtarı bulunamadı. Ayarlar sayfasından kaydedin.");
                setLoading(false);
                return;
            }

            const decrypted = await decryptWithPassword(encrypted, salt, iv, password);

            setApiKey(decrypted);
            if (rememberSession) {
                sessionStorage.setItem(SESSION_KEY, decrypted);
            }

            setShowModal(false);
            setPassword("");
            setError("");

            if (resolverRef.current) {
                resolverRef.current(decrypted);
                resolverRef.current = null;
                rejecterRef.current = null;
            }
        } catch {
            setError("Yanlış parola. Tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const cancelModal = () => {
        setShowModal(false);
        setPassword("");
        setError("");
        if (rejecterRef.current) {
            rejecterRef.current(new Error("cancelled"));
            resolverRef.current = null;
            rejecterRef.current = null;
        }
    };

    const requireApiKey = useCallback((): Promise<string> => {
        // Already unlocked
        if (apiKey) return Promise.resolve(apiKey);

        // Check sessionStorage
        const sessionKey = sessionStorage.getItem(SESSION_KEY);
        if (sessionKey) {
            setApiKey(sessionKey);
            return Promise.resolve(sessionKey);
        }

        // Need to show modal
        return new Promise<string>((resolve, reject) => {
            resolverRef.current = resolve;
            rejecterRef.current = reject;
            setShowModal(true);
        });
    }, [apiKey]);

    return (
        <ApiKeyContext.Provider value={{ apiKey, isUnlocked: !!apiKey, hasEncryptedKey, requireApiKey, lockApiKey, refreshEncryptedStatus }}>
            {children}

            {/* Unlock Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-brand)]/10">
                                    <Lock size={20} className="text-[var(--color-brand-light)]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[var(--color-text-primary)]">Kilit Aç</h2>
                                    <p className="text-xs text-[var(--color-text-muted)]">AI özelliklerini kullanmak için</p>
                                </div>
                            </div>
                            <button
                                onClick={cancelModal}
                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                                Master Parola
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    onKeyDown={(e) => e.key === "Enter" && unlock()}
                                    placeholder="Parolanızı girin..."
                                    className="input-field pr-10"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/10 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberSession}
                                onChange={(e) => setRememberSession(e.target.checked)}
                                className="accent-[var(--color-brand)] w-4 h-4"
                            />
                            <span className="text-xs text-[var(--color-text-secondary)]">
                                Bu oturumda hatırla
                            </span>
                        </label>

                        <button
                            onClick={unlock}
                            disabled={loading || !password.trim()}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                            {loading ? "Çözülüyor..." : "Kilidi Aç"}
                        </button>
                    </div>
                </div>
            )}
        </ApiKeyContext.Provider>
    );
}

export function useApiKey() {
    const ctx = useContext(ApiKeyContext);
    if (!ctx) {
        throw new Error("useApiKey must be used within ApiKeyProvider");
    }
    return ctx;
}

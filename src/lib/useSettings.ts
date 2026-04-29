"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface AppSettings {
    theme: string;
    "ai-model": string;
    "worksheet-spacing": string;
    "prompt-recommendations": string;
    "prompt-plan": string;
}

const DEFAULTS: AppSettings = {
    theme: "dark",
    "ai-model": "gemini-2.0-flash",
    "worksheet-spacing": "{}",
    "prompt-recommendations": "",
    "prompt-plan": "",
};

type SettingsListener = (settings: AppSettings) => void;
const listeners = new Set<SettingsListener>();
let cachedSettings: AppSettings | null = null;
let fetchPromise: Promise<AppSettings> | null = null;

function notifyListeners(settings: AppSettings) {
    for (const listener of listeners) {
        listener(settings);
    }
}

async function fetchSettings(): Promise<AppSettings> {
    const res = await fetch("/api/settings");
    const data = await res.json();
    const merged = { ...DEFAULTS, ...data };
    cachedSettings = merged;
    return merged;
}

function getSettings(): Promise<AppSettings> {
    if (cachedSettings) return Promise.resolve(cachedSettings);
    if (!fetchPromise) {
        fetchPromise = fetchSettings().finally(() => { fetchPromise = null; });
    }
    return fetchPromise;
}

export async function updateSetting(key: keyof AppSettings, value: string): Promise<void> {
    // Optimistic update
    if (cachedSettings) {
        cachedSettings = { ...cachedSettings, [key]: value };
        notifyListeners(cachedSettings);
    }

    await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
    });
}

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(cachedSettings || DEFAULTS);
    const [isLoading, setIsLoading] = useState(!cachedSettings);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const listener: SettingsListener = (s) => {
            if (mountedRef.current) setSettings({ ...s });
        };
        listeners.add(listener);

        getSettings().then((s) => {
            if (mountedRef.current) {
                setSettings(s);
                setIsLoading(false);
            }
        });

        return () => {
            mountedRef.current = false;
            listeners.delete(listener);
        };
    }, []);

    const update = useCallback(async (key: keyof AppSettings, value: string) => {
        await updateSetting(key, value);
    }, []);

    return { settings, isLoading, updateSetting: update };
}

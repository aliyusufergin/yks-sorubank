"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSettings, updateSetting } from "@/lib/useSettings";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);
    const { settings, isLoading } = useSettings();

    // Sync theme from server settings
    useEffect(() => {
        if (!isLoading && settings.theme) {
            const serverTheme = settings.theme as Theme;
            setThemeState(serverTheme);
        }
        setMounted(true);
    }, [isLoading, settings.theme]);

    useEffect(() => {
        if (!mounted) return;
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setThemeState(next);
        updateSetting("theme", next);
    };

    const setTheme = (t: Theme) => {
        setThemeState(t);
        updateSetting("theme", t);
    };

    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        return {
            theme: "dark" as Theme,
            toggleTheme: () => { },
            setTheme: () => { },
        };
    }
    return ctx;
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, Archive, FileText, Settings, Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { href: "/", label: "Soru Havuzu", icon: BookOpen },
    { href: "/archive", label: "Arşiv", icon: Archive },
    { href: "/worksheets", label: "Çalışma Kağıtları", icon: FileText },
    { href: "/ai", label: "AI Asistan", icon: Sparkles },
    { href: "/settings", label: "Ayarlar", icon: Settings },
];

export default function Navbar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    return (
        <>
            {/* Top Navigation */}
            <nav className="no-print fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Image
                            src="/sorubank.svg"
                            alt="YKS Sorubank"
                            width={36}
                            height={36}
                            className="rounded-xl transition-transform group-hover:scale-105"
                            priority
                        />
                        <span className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                            YKS Sorubank
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-[var(--color-brand)]/10 text-[var(--color-brand-light)]"
                                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]"
                                    )}
                                >
                                    <Icon size={16} />
                                    {label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-all"
                        aria-label="Tema değiştir"
                    >
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Bottom Navigation - separate from top nav */}
            <div className="no-print fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-xl">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-1 py-2.5 px-2 text-xs font-medium transition-colors min-w-[4.5rem]",
                                isActive
                                    ? "text-[var(--color-brand-light)]"
                                    : "text-[var(--color-text-muted)]"
                            )}
                        >
                            <Icon size={18} />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </>
    );
}

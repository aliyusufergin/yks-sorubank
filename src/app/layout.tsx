import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "YKS Sorubank",
    description: "YKS sınav hazırlığı için dijital soru havuzu ve çalışma kağıdı oluşturma uygulaması",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr" data-theme="dark" suppressHydrationWarning className={inter.variable}>
            <body>
                <ThemeProvider>
                    <Navbar />
                    <main className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-24 sm:px-6 md:pb-10">
                        {children}
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}


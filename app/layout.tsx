import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "./language-context";
import "./globals.css";
import ThemeToggle from "@/components/theme-toggle";
import LanguageSwitcher from "@/components/language-switcher";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = { title: "ChatDB Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${jetmono.variable}`}>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html:
              "(()=>{try{const s=localStorage.getItem('theme');const d=window.matchMedia('(prefers-color-scheme: dark)').matches;const t=s|| (d?'dark':'light');const r=document.documentElement;r.classList[t==='dark'?'add':'remove']('dark');}catch(e){}})()",
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <Providers>
            <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <h1 className="text-sm font-semibold tracking-tight"><span className="bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent dark:from-violet-400 dark:to-cyan-300">ChatDB Admin</span></h1>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <div aria-hidden className="fixed inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(99,102,241,0.10),transparent)] dark:bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(99,102,241,0.18),transparent)]" />
            {children}
            <Toaster richColors position="top-right" />
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  // Next.js 15.0.3 has no fallback metrics for Geist.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Forjex — Automate GitHub Repositories & Vercel Deployments",
  description:
    "The modern cloud platform and CLI for instant project scaffolding, smart commit messages, GitHub Actions CI/CD pipelines, and Vercel deployments.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col bg-white text-neutral-900 dark:bg-black dark:text-neutral-100 antialiased selection:bg-neutral-800 selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/60 py-8 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">FORJEX</span>
                <span>— Scaffold, Automate, and Deploy. Built for developers.</span>
              </div>
              <div className="flex items-center gap-6">
                <a
                  href="/docs"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Docs
                </a>
                <a
                  href="/forge"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Cloud Forge
                </a>
                <a
                  href="/templates"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Templates
                </a>
                <a
                  href="https://github.com/daviddozie/forjex"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

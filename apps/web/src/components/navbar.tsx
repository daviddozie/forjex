"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Flame,
  Sun,
  Moon,
  Terminal,
  LogOut,
  LayoutDashboard,
  Layers,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Key,
  User,
  ChevronDown,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CredentialsModal } from "@/components/credentials-modal";
import { AuthModal } from "@/components/auth/auth-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  githubConnected: boolean;
  vercelConnected: boolean;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = (resolvedTheme || theme) === "dark";
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [credentialsOpen, setCredentialsOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/forge", label: "Forge Wizard", badge: "Live" },
    { href: "/templates", label: "Templates" },
    { href: "/docs", label: "Documentation" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-800/80 bg-white/70 dark:bg-black/80 backdrop-blur-xl transition-colors">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold transition-transform group-hover:scale-105 shadow-sm">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-neutral-900 dark:text-white text-base">
                FORJEX
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase tracking-widest font-mono">
                Cloud
              </Badge>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                    isActive
                      ? "text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-900"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                  )}
                >
                  {link.label}
                  {link.badge && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right actions */}
        <TooltipProvider delayDuration={150}>
          <div className="flex items-center gap-2.5">
            {/* GitHub link with Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/daviddozie/forjex"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  aria-label="GitHub Repository"
                >
                  <GithubIcon className="w-4 h-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom">GitHub Repository</TooltipContent>
            </Tooltip>

            {/* Theme toggle with Tooltip */}
            {mounted && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="p-2 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                    aria-label="Toggle theme"
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4 text-neutral-300 hover:text-amber-400 transition-colors" />
                    ) : (
                      <Moon className="w-4 h-4 text-neutral-700 hover:text-indigo-600 transition-colors" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </TooltipContent>
              </Tooltip>
            )}

          {/* User Account / Sign In */}
          {!loadingUser && (
            <>
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer text-xs font-medium focus:outline-none">
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.username}
                          className="w-5 h-5 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] text-white font-bold">
                          {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="hidden sm:inline font-mono">@{currentUser.username}</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-xl p-1.5">
                    <DropdownMenuLabel className="font-normal px-2 py-1.5">
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white">{currentUser.name || currentUser.username}</div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">@{currentUser.username}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer text-xs py-2 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white">
                        <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                        <span>Cloud Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/forge" className="flex items-center gap-2 cursor-pointer text-xs py-2 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white">
                        <Sparkles className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                        <span>Forge Project</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setCredentialsOpen(true)}
                      className="flex items-center gap-2 cursor-pointer text-xs py-2 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                    >
                      <Key className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      <span>API Credentials</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-xs py-2 px-2 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuthModalOpen(true)}
                    className="h-8 px-3 text-xs font-medium border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  >
                    Sign In
                  </Button>
                  <Link href="/forge">
                    <Button size="sm" className="hidden sm:inline-flex gap-1.5 text-xs font-medium h-8">
                      <span>Start Forging</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </TooltipProvider>
    </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black px-4 py-4 space-y-2">
          {currentUser && (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 mb-3">
              {currentUser.avatarUrl && (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-7 h-7 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{currentUser.name || currentUser.username}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">@{currentUser.username}</div>
              </div>
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
            {currentUser ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full text-xs"
              >
                Sign In to Forjex
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Credentials Modal (Settings) */}
      <CredentialsModal
        isOpen={credentialsOpen}
        onClose={() => setCredentialsOpen(false)}
        onUpdated={fetchCurrentUser}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={fetchCurrentUser}
      />
    </header>
  );
}

"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    href: "/recommendations",
    label: "Insights",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-transparent"
            style={{ borderTopColor: "var(--accent-cyan)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Redirecting…</p>
      </div>
    );
  }

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : (user?.username?.[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 glass border-b"
        style={{ borderColor: "var(--glass-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Brand */}
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                  boxShadow: "0 0 16px rgba(34,211,238,0.3)",
                }}>
                N
              </div>
              <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
                NutritionAI
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
                      background: active ? "rgba(34,211,238,0.08)" : "transparent",
                    }}>
                    {item.icon}
                    {item.label}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {user?.first_name || user?.username}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-default select-none"
                style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", color: "white" }}>
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-secondary)",
                }}>
                Sign out
              </button>
            </div>

            {/* Mobile burger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileOpen((v) => !v)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t"
              style={{ borderColor: "var(--glass-border)" }}>
              <div className="px-4 py-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
                        background: active ? "rgba(34,211,238,0.08)" : "transparent",
                      }}>
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
                <div className="pt-2 mt-2 border-t" style={{ borderColor: "var(--glass-border)" }}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", color: "white" }}>
                        {initials}
                      </div>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {user?.first_name || user?.username}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "var(--text-secondary)",
                      }}>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>{children}</main>
    </div>
  );
}

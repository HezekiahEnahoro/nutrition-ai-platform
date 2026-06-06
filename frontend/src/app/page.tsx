"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function FloatingMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-16, 16]), { stiffness: 100, damping: 20 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <div style={{ perspective: "1400px" }} className="w-full max-w-lg mx-auto lg:mx-0">
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        animate={{ y: [0, -12, 0] }}
        transition={{ y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        className="rounded-2xl overflow-hidden relative"
        initial={{ opacity: 0, y: 40, rotateX: 15 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true }}>

        {/* Outer glow ring */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(139,92,246,0.3), rgba(34,211,238,0.1))",
            filter: "blur(1px)",
          }}
        />

        {/* Card body */}
        <div
          className="relative rounded-2xl p-5 space-y-4"
          style={{
            background: "rgba(13,17,23,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 80px rgba(34,211,238,0.1)",
            backdropFilter: "blur(20px)",
          }}>

          {/* Nav bar mock */}
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md" style={{ background: "linear-gradient(135deg,#06b6d4,#8b5cf6)" }} />
              <span className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>NutritionAI</span>
            </div>
            <div className="flex gap-3">
              {["Dashboard", "Progress", "Insights"].map((l) => (
                <span key={l} className="text-xs" style={{ color: "rgba(148,163,184,0.6)" }}>{l}</span>
              ))}
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: "1,840", l: "Calories", c: "#22d3ee", bg: "rgba(34,211,238,0.08)" },
              { v: "128g",  l: "Protein",  c: "#34d399", bg: "rgba(52,211,153,0.08)" },
              { v: "210g",  l: "Carbs",    c: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
              { v: "62g",   l: "Fat",      c: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl p-2.5 text-center" style={{ background: s.bg }}>
                <div className="text-sm font-bold" style={{ color: s.c }}>{s.v}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.6)" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Log section */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.5)" }}>Today's Meals</div>
            {[
              { meal: "Grilled salmon + quinoa", cal: "520 kcal", tag: "Lunch", tc: "#22d3ee", tb: "rgba(34,211,238,0.1)" },
              { meal: "Greek yogurt + berries", cal: "180 kcal", tag: "Snack", tc: "#34d399", tb: "rgba(52,211,153,0.1)" },
              { meal: "Avocado toast + eggs",   cal: "340 kcal", tag: "Breakfast", tc: "#fbbf24", tb: "rgba(251,191,36,0.1)" },
            ].map((item) => (
              <div key={item.meal} className="flex items-center gap-2 py-1.5 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: item.tb, color: item.tc }}>
                  {item.tag}
                </span>
                <span className="text-xs flex-1 truncate" style={{ color: "#94a3b8" }}>{item.meal}</span>
                <span className="text-xs font-semibold shrink-0" style={{ color: item.tc }}>{item.cal}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "rgba(148,163,184,0.6)" }}>Daily Goal</span>
              <span style={{ color: "#22d3ee" }}>1,840 / 2,200 kcal</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #22d3ee, #8b5cf6)" }}
                initial={{ width: 0 }}
                animate={{ width: "84%" }}
                transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "⚡",
    title: "Instant Analysis",
    body: "Describe any meal in plain English. No barcode scanning, no manual searching.",
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.12)",
  },
  {
    icon: "📊",
    title: "Visual Progress",
    body: "Weekly and monthly charts that make your nutrition trends obvious at a glance.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.12)",
  },
  {
    icon: "🎯",
    title: "Adaptive Goals",
    body: "Calorie and macro targets calibrated to your body, activity level, and objectives.",
    color: "#34d399",
    glow: "rgba(52,211,153,0.12)",
  },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "var(--accent-cyan)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "rgba(34,211,238,0.04)", filter: "blur(80px)" }} />
      <div className="fixed top-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "rgba(139,92,246,0.05)", filter: "blur(80px)" }} />

      {/* Nav */}
      <header
        className="fixed top-0 w-full z-50 glass border-b"
        style={{ borderColor: "var(--glass-border)" }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", boxShadow: "0 0 16px rgba(34,211,238,0.3)" }}>
              N
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>NutritionAI</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}>
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg btn-primary">
              Get started
            </Link>
          </motion.div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}>
                <span
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
                  style={{
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.2)",
                    color: "var(--accent-cyan)",
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-emerald)" }} />
                  Powered by Groq AI
                </span>

                <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6" style={{ color: "var(--text-primary)" }}>
                  Nutrition tracking
                  <br />
                  <span className="gradient-text">that actually works.</span>
                </h1>

                <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: "var(--text-secondary)" }}>
                  Describe your meal in plain English and get an instant breakdown — calories, macros, and smart recommendations. No apps, no barcodes.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold btn-primary">
                    Start for free
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    href="#features"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color: "var(--text-secondary)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                    See how it works
                  </Link>
                </div>

                <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  No credit card · Always free
                </p>
              </motion.div>
            </div>

            {/* 3D Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <FloatingMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Everything in one place
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Built for people who care about their nutrition but don't want to spend 10 minutes logging a meal.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-6 transition-all cursor-default"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  boxShadow: `0 1px 0 rgba(255,255,255,0.04) inset`,
                }}>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: feat.glow, border: `1px solid ${feat.color}30` }}>
                  {feat.icon}
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {feat.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t" style={{ borderColor: "var(--glass-border)" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Three steps. Thirty seconds.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-6 left-1/6 right-1/6 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)" }}
            />

            {[
              { n: "01", title: "Describe", body: "Type what you ate — \"2 eggs, whole wheat toast, avocado\"" },
              { n: "02", title: "Analyze",  body: "Groq AI instantly returns full nutrition data and tips" },
              { n: "03", title: "Track",    body: "See cumulative totals, trends, and progress toward goals" },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4"
                  style={{
                    background: "linear-gradient(135deg,rgba(34,211,238,0.15),rgba(139,92,246,0.15))",
                    border: "1px solid rgba(34,211,238,0.25)",
                    color: "var(--accent-cyan)",
                  }}>
                  {step.n}
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-12 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(139,92,246,0.06))",
              border: "1px solid rgba(34,211,238,0.15)",
              boxShadow: "0 0 80px rgba(34,211,238,0.06), 0 0 120px rgba(139,92,246,0.04)",
            }}>
            <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Ready to start?
            </h2>
            <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>
              It takes 30 seconds to sign up and log your first meal.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold btn-primary">
              Create your account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8" style={{ borderColor: "var(--glass-border)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md" style={{ background: "linear-gradient(135deg,#06b6d4,#8b5cf6)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>NutritionAI</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs transition-colors" style={{ color: "var(--text-muted)" }}>Sign in</Link>
            <Link href="/register" className="text-xs transition-colors" style={{ color: "var(--text-muted)" }}>Register</Link>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © 2026 NutritionAI · Built with Django & Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}

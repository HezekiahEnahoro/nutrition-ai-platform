"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ProgressRecord {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goal_calories: number;
  adherence_score: number;
  meals_count: number;
}

interface ProgressSummary {
  period_days: number;
  avg_calories: number;
  avg_protein: number;
  avg_adherence: number;
  days_tracked: number;
}

interface ProgressData {
  progress: ProgressRecord[];
  summary: ProgressSummary;
}

const GRID = "rgba(255,255,255,0.05)";
const TICK = "#475569";

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "rgba(13,17,23,0.96)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  borderRadius: "12px",
  padding: "12px",
  fontSize: "12px",
};

function AdherenceTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="font-semibold pb-1.5 mb-1.5 border-b" style={{ color: "var(--text-secondary)", borderColor: "rgba(255,255,255,0.06)" }}>
        {label ? new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}
      </p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} />
        <span style={{ color: "var(--text-muted)" }}>Adherence</span>
        <span className="font-bold ml-2" style={{ color: "#a78bfa" }}>
          {Number(payload[0].value).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="font-semibold mb-2 pb-1.5 border-b" style={{ color: "var(--text-secondary)", borderColor: "rgba(255,255,255,0.06)" }}>
        {label ? new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
              <span style={{ color: "var(--text-muted)" }}>{entry.name}</span>
            </div>
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
              {Math.round(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAT_CONFIG = [
  { key: "avg_calories" as const, label: "Avg Calories", suffix: "", unit: "kcal", color: "#22d3ee", glow: "rgba(34,211,238,0.2)", bg: "rgba(34,211,238,0.06)", border: "rgba(34,211,238,0.15)" },
  { key: "avg_protein"  as const, label: "Avg Protein",  suffix: "g", unit: "grams", color: "#34d399", glow: "rgba(52,211,153,0.2)", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.15)" },
  { key: "avg_adherence" as const, label: "Adherence",   suffix: "%", unit: "score", color: "#a78bfa", glow: "rgba(167,139,250,0.2)", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.15)" },
  { key: "days_tracked" as const, label: "Days Tracked", suffix: "", unit: "days", color: "#fbbf24", glow: "rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.15)" },
];

function AnimatedNum({ value, suffix }: { value: number; suffix: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}>
      {Math.round(value)}{suffix}
    </motion.span>
  );
}

function SectionCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 48px rgba(0,0,0,0.4)",
      }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

export default function ProgressPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [period]);

  const loadProgress = async () => {
    setLoading(true);
    const result = period === "weekly" ? await api.getWeeklyProgress() : await api.getMonthlyProgress();
    if (result.data) {
      setProgressData(result.data as ProgressData);
    } else {
      toast.error("Failed to load progress data");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            className="w-8 h-8 rounded-full border-2 border-transparent"
            style={{ borderTopColor: "var(--accent-cyan)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!progressData || !progressData.progress || progressData.progress.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Progress Tracking</h1>
            <PeriodToggle period={period} setPeriod={setPeriod} />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-16 text-center"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
              style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.15)" }}>
              📊
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No data yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Log some meals to see your progress charts
            </p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const { progress, summary } = progressData;
  const hasGoals = progress.some((p) => p.goal_calories > 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent-cyan)" }}>
              {period === "weekly" ? "Last 7 days" : "Last 30 days"}
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Progress Tracking</h1>
          </div>
          <PeriodToggle period={period} setPeriod={setPeriod} />
        </motion.div>

        {/* No-goal banner */}
        <AnimatePresence>
          {!hasGoals && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.2)",
                color: "#fbbf24",
              }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>
                Complete your{" "}
                <a href="/profile" className="underline font-semibold">profile</a>{" "}
                to enable calorie goal tracking on the chart.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stat cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CONFIG.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="rounded-2xl p-5"
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  boxShadow: `0 8px 32px ${s.glow}, 0 1px 0 rgba(255,255,255,0.05) inset`,
                }}>
                <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: s.color, opacity: 0.7 }}>
                  {s.unit}
                </div>
                <div className="text-3xl font-bold tabular-nums mb-1" style={{ color: s.color }}>
                  <AnimatedNum value={summary[s.key]} suffix={s.suffix} />
                </div>
                <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Calorie area chart */}
        <SectionCard title="Calorie Intake vs Goal" delay={0.25}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={progress} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
                {hasGoals && (
                  <linearGradient id="gradGoal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.01} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: TICK }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <Tooltip
                content={<ChartTooltip />}
                wrapperStyle={{ outline: "none" }}
                cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 16, fontSize: 12, color: "var(--text-muted)" }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="#22d3ee"
                strokeWidth={2.5}
                fill="url(#gradCal)"
                name="Calories"
                dot={false}
                activeDot={{ r: 5, fill: "#22d3ee", strokeWidth: 0 }}
              />
              {hasGoals && (
                <Area
                  type="monotone"
                  dataKey="goal_calories"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  fill="url(#gradGoal)"
                  name="Goal"
                  dot={false}
                  activeDot={{ r: 4, fill: "#34d399", strokeWidth: 0 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Macro bar chart */}
        <SectionCard title="Macronutrient Breakdown" delay={0.35}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={progress} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={3}>
              <defs>
                <linearGradient id="gProtein" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gCarbs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: TICK }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <Tooltip
                content={<ChartTooltip />}
                wrapperStyle={{ outline: "none" }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12, color: "var(--text-muted)" }} />
              <Bar dataKey="protein" fill="url(#gProtein)" name="Protein (g)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="carbs"   fill="url(#gCarbs)"   name="Carbs (g)"   radius={[6, 6, 0, 0]} />
              <Bar dataKey="fat"     fill="url(#gFat)"     name="Fat (g)"     radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Adherence chart */}
        <SectionCard title="Daily Adherence Score" delay={0.45}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={progress} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gAdherence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: TICK }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <Tooltip
                content={<AdherenceTooltip />}
                wrapperStyle={{ outline: "none" }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="adherence_score" fill="url(#gAdherence)" name="Adherence %" radius={[6, 6, 0, 0]}>
                {progress.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.adherence_score >= 80
                        ? "url(#gAdherence)"
                        : entry.adherence_score >= 50
                        ? "rgba(251,191,36,0.7)"
                        : "rgba(251,113,133,0.7)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
            {[
              { color: "#a78bfa", label: "≥ 80%  On track" },
              { color: "#fbbf24", label: "50–79%  Partial" },
              { color: "#fb7185", label: "< 50%  Needs work" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </DashboardLayout>
  );
}

function PeriodToggle({
  period,
  setPeriod,
}: {
  period: "weekly" | "monthly";
  setPeriod: (p: "weekly" | "monthly") => void;
}) {
  return (
    <div
      className="flex rounded-xl p-1 gap-1"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)" }}>
      {(["weekly", "monthly"] as const).map((p) => (
        <motion.button
          key={p}
          onClick={() => setPeriod(p)}
          className="relative px-5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: period === p ? "#fff" : "var(--text-muted)" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>
          {period === p && (
            <motion.div
              layoutId="period-pill"
              className="absolute inset-0 rounded-lg"
              style={{ background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", boxShadow: "0 0 16px rgba(34,211,238,0.3)" }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{p === "weekly" ? "7 Days" : "30 Days"}</span>
        </motion.button>
      ))}
    </div>
  );
}

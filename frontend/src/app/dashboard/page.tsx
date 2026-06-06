"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MealLogger } from "@/components/forms/MealLogger";
import { useAuth } from "@/lib/auth";
import { Card3D } from "@/components/ui/Card3D";
import { api } from "@/lib/api";
import { Meal } from "@/types";

interface DailySummary {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  streak?: {
    current: number;
    longest: number;
  };
}

const STAT_CONFIG = [
  {
    key: "calories" as const,
    label: "Calories",
    suffix: "",
    unit: "kcal",
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.25)",
    bg: "rgba(34,211,238,0.06)",
    border: "rgba(34,211,238,0.15)",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
  {
    key: "protein" as const,
    label: "Protein",
    suffix: "g",
    unit: "grams",
    color: "#34d399",
    glow: "rgba(52,211,153,0.25)",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: "carbs" as const,
    label: "Carbs",
    suffix: "g",
    unit: "grams",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.25)",
    bg: "rgba(251,191,36,0.06)",
    border: "rgba(251,191,36,0.15)",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    key: "fat" as const,
    label: "Fat",
    suffix: "g",
    unit: "grams",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.25)",
    bg: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.15)",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

const MEAL_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  breakfast: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  lunch:     { bg: "rgba(34,211,238,0.1)",  text: "#22d3ee",  border: "rgba(34,211,238,0.2)" },
  dinner:    { bg: "rgba(167,139,250,0.1)", text: "#a78bfa", border: "rgba(167,139,250,0.2)" },
  snack:     { bg: "rgba(52,211,153,0.1)",  text: "#34d399",  border: "rgba(52,211,153,0.2)" },
};

function AnimatedValue({ value, suffix }: { value: number; suffix: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}>
      {Math.round(value)}{suffix}
    </motion.span>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && !authLoading) loadDashboardData();
  }, [isAuthenticated, authLoading]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const [summaryResult, mealsResult] = await Promise.all([
      api.getDailySummary(),
      api.getMeals(),
    ]);
    if (summaryResult.data) setDailySummary(summaryResult.data as DailySummary);
    if (summaryResult.error) toast.error("Could not load today's summary");
    if (mealsResult.data) setMeals((mealsResult.data as { results: Meal[] }).results || []);
    if (mealsResult.error) toast.error("Could not load meals");
    setIsLoading(false);
  };

  const handleMealLogged = () => {
    loadDashboardData();
    toast.success("Meal logged!", {
      style: { background: "#0d1117", color: "#f1f5f9", border: "1px solid rgba(52,211,153,0.3)" },
      iconTheme: { primary: "#34d399", secondary: "#0d1117" },
    });
  };

  const handleDeleteMeal = async (id: number) => {
    setDeletingId(id);
    const result = await api.deleteMeal(id);
    setDeletingId(null);
    if (result.error) {
      toast.error("Failed to delete meal");
    } else {
      setMeals((prev) => prev.filter((m) => m.id !== id));
      const summaryResult = await api.getDailySummary();
      if (summaryResult.data) setDailySummary(summaryResult.data as DailySummary);
    }
  };

  if (authLoading || (isLoading && !dailySummary)) {
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

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--accent-cyan)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {greeting}, {user?.first_name || user?.username} 👋
            </h1>
            {(dailySummary?.streak?.current ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
                style={{
                  background: "rgba(251,191,36,0.1)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  color: "#fbbf24",
                }}>
                🔥 {dailySummary!.streak!.current} day{dailySummary!.streak!.current !== 1 ? "s" : ""} streak
                {(dailySummary!.streak!.longest ?? 0) > (dailySummary!.streak!.current ?? 0) && (
                  <span className="opacity-60 text-xs">
                    · best {dailySummary!.streak!.longest}
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stat cards */}
        {dailySummary?.totals && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CONFIG.map((stat, i) => {
              const value = dailySummary.totals[stat.key] || 0;
              return (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}>
                  <Card3D
                    className="rounded-2xl p-5 cursor-default"
                    style={{
                      background: stat.bg,
                      border: `1px solid ${stat.border}`,
                      boxShadow: `0 8px 32px ${stat.glow}, 0 1px 0 rgba(255,255,255,0.05) inset`,
                    } as React.CSSProperties}
                    intensity={8}>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `rgba(255,255,255,0.06)`, color: stat.color }}>
                        {stat.icon}
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: stat.color, opacity: 0.7 }}>
                        {stat.unit}
                      </span>
                    </div>
                    <div className="text-3xl font-bold tabular-nums" style={{ color: stat.color }}>
                      <AnimatedValue value={value} suffix={stat.suffix} />
                    </div>
                    <div className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>
                      {stat.label}
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Meal Logger */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}>
          <MealLogger onMealLogged={handleMealLogged} />
        </motion.div>

        {/* Recent Meals */}
        <AnimatePresence mode="wait">
          {meals.length > 0 ? (
            <motion.div
              key="meals"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 48px rgba(0,0,0,0.4)",
              }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
                <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
                  Recent Meals
                </h2>
              </div>
              <div>
                {meals.slice(0, 6).map((meal, i) => {
                  const typeStyle = MEAL_TYPE_COLORS[meal.meal_type] ?? MEAL_TYPE_COLORS.snack;
                  return (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      layout
                      className="group flex items-start gap-4 px-6 py-4 border-b transition-colors"
                      style={{ borderColor: "var(--glass-border)" }}>
                      {/* Type badge */}
                      <span
                        className="mt-0.5 shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{ background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}` }}>
                        {meal.meal_type}
                      </span>

                      {/* Description + macros */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {meal.description}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {meal.total_calories && (
                            <span className="text-xs font-semibold" style={{ color: "var(--accent-cyan)" }}>
                              {Math.round(meal.total_calories)} kcal
                            </span>
                          )}
                          {meal.total_protein && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {Math.round(meal.total_protein)}g protein
                            </span>
                          )}
                          {meal.total_carbs && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {Math.round(meal.total_carbs)}g carbs
                            </span>
                          )}
                          {meal.total_fat && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {Math.round(meal.total_fat)}g fat
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(meal.logged_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          disabled={deletingId === meal.id}
                          className="text-xs px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          style={{
                            color: "#fb7185",
                            background: "rgba(251,113,133,0.08)",
                            border: "1px solid rgba(251,113,133,0.15)",
                          }}>
                          {deletingId === meal.id ? "…" : "Remove"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : !isLoading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-12 text-center"
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
              }}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.12)" }}>
                🍽️
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                No meals logged today
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Log your first meal above to start tracking
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

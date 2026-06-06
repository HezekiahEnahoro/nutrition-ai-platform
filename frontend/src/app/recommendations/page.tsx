"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { Recommendation } from "@/types";

const TYPE_CONFIG: Record<string, { label: string; color: string; glow: string; bg: string; border: string; icon: string }> = {
  nutrient_gap:    { label: "Nutrient Gap",    color: "#fb7185", glow: "rgba(251,113,133,0.2)", bg: "rgba(251,113,133,0.06)", border: "rgba(251,113,133,0.2)", icon: "🔬" },
  food_suggestion: { label: "Food Suggestion", color: "#34d399", glow: "rgba(52,211,153,0.2)",  bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.2)",  icon: "🥦" },
  meal_timing:     { label: "Meal Timing",     color: "#22d3ee", glow: "rgba(34,211,238,0.2)",  bg: "rgba(34,211,238,0.06)",  border: "rgba(34,211,238,0.2)",  icon: "⏱️" },
  portion_size:    { label: "Portion Size",    color: "#fbbf24", glow: "rgba(251,191,36,0.2)",  bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.2)",  icon: "🍽️" },
  goal_progress:   { label: "Goal Progress",   color: "#a78bfa", glow: "rgba(167,139,250,0.2)", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.2)", icon: "🎯" },
};

const DEFAULT_TYPE = { label: "Insight", color: "#94a3b8", glow: "rgba(148,163,184,0.2)", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.2)", icon: "💡" };

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    const result = await api.getRecommendations();
    if (result.data) {
      const recs = (result.data as { results: Recommendation[] }).results || [];
      setRecommendations(recs);
      // Auto-generate for existing meals if none found
      if (recs.length === 0) {
        generateForExistingMeals(false);
      }
    } else {
      toast.error("Failed to load recommendations");
    }
    setLoading(false);
  };

  const generateForExistingMeals = async (showToast = true) => {
    setGenerating(true);
    const result = await api.generateRecommendations();
    if (result.data) {
      const recs = (result.data as { created: number; results: Recommendation[] }).results || [];
      setRecommendations(recs);
      if (showToast && result.data.created > 0) {
        toast.success(`Generated ${result.data.created} new insights!`, {
          style: { background: "#0d1117", color: "#f1f5f9", border: "1px solid rgba(167,139,250,0.3)" },
          iconTheme: { primary: "#a78bfa", secondary: "#0d1117" },
        });
      }
    }
    setGenerating(false);
  };

  const handleMarkRead = async (id: number) => {
    setMarkingId(id);
    const result = await api.markRecommendationRead(id);
    setMarkingId(null);
    if (result.error) {
      toast.error("Failed to mark as read");
    } else {
      setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
    }
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

  const unread = recommendations.filter((r) => !r.is_read);
  const read   = recommendations.filter((r) => r.is_read);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent-cyan)" }}>
              AI-Powered
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Insights</h1>
          </div>
          <div className="flex items-center gap-3">
            {unread.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(34,211,238,0.12)",
                  color: "var(--accent-cyan)",
                  border: "1px solid rgba(34,211,238,0.25)",
                }}>
                {unread.length} new
              </motion.span>
            )}
            <motion.button
              onClick={() => generateForExistingMeals(true)}
              disabled={generating}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              style={{
                background: "rgba(167,139,250,0.1)",
                color: "#a78bfa",
                border: "1px solid rgba(167,139,250,0.25)",
              }}>
              {generating ? (
                <motion.span
                  className="w-3 h-3 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {generating ? "Generating…" : "Refresh"}
            </motion.button>
          </div>
        </motion.div>

        {/* Empty state */}
        {recommendations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" }}
            className="rounded-2xl p-16 text-center"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
            }}>
            {generating ? (
              <>
                <motion.div
                  className="w-12 h-12 rounded-full border-2 border-transparent mx-auto mb-5"
                  style={{ borderTopColor: "#a78bfa" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Generating insights…</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Analyzing your meal history</p>
              </>
            ) : (
              <>
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
                  style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}>
                  💡
                </div>
                <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No insights yet</p>
                <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                  Log a meal on the Dashboard or hit Refresh to generate insights from your meal history.
                </p>
                <motion.button
                  onClick={() => generateForExistingMeals(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    background: "rgba(167,139,250,0.12)",
                    color: "#a78bfa",
                    border: "1px solid rgba(167,139,250,0.3)",
                  }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Insights Now
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {/* Unread */}
        {unread.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: "var(--text-muted)" }}>
              New
            </p>
            <AnimatePresence>
              {unread.map((rec, i) => (
                <RecCard key={rec.id} rec={rec} index={i} isMarking={markingId === rec.id} onMarkRead={handleMarkRead} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Read */}
        {read.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: "var(--text-muted)" }}>
              Read
            </p>
            {read.map((rec, i) => (
              <RecCard key={rec.id} rec={rec} index={i} isMarking={false} onMarkRead={handleMarkRead} dimmed />
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

function RecCard({
  rec, index, isMarking, onMarkRead, dimmed = false,
}: {
  rec: Recommendation;
  index: number;
  isMarking: boolean;
  onMarkRead: (id: number) => void;
  dimmed?: boolean;
}) {
  const type = TYPE_CONFIG[rec.recommendation_type] ?? DEFAULT_TYPE;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: dimmed ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.005, y: -1 }}
      className="rounded-2xl overflow-hidden flex"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        boxShadow: dimmed
          ? "none"
          : `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px ${type.glow}`,
      }}>
      {/* Left accent bar */}
      <div className="w-1 shrink-0" style={{ background: type.color }} />

      {/* Content */}
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: type.bg, color: type.color, border: `1px solid ${type.border}` }}>
                <span>{type.icon}</span>
                {type.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(rec.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              {rec.confidence_score && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {Math.round(rec.confidence_score * 100)}% confidence
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm mb-1.5 leading-snug" style={{ color: "var(--text-primary)" }}>
              {rec.title}
            </h3>

            {/* Body */}
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {rec.content}
            </p>
          </div>

          {/* Mark read */}
          {!rec.is_read && (
            <motion.button
              onClick={() => onMarkRead(rec.id)}
              disabled={isMarking}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-40"
              style={{
                background: "rgba(34,211,238,0.08)",
                color: "var(--accent-cyan)",
                border: "1px solid rgba(34,211,238,0.2)",
              }}>
              {isMarking ? "…" : "Mark read"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

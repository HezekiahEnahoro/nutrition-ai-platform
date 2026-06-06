'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { MealAnalysis } from '@/types';
import { BarcodeScanner } from '@/components/ui/BarcodeScanner';

interface MealLoggerProps {
  onMealLogged?: () => void;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch',     label: 'Lunch',     icon: '☀️' },
  { value: 'dinner',    label: 'Dinner',    icon: '🌙' },
  { value: 'snack',     label: 'Snack',     icon: '⚡' },
];

const MACRO_CONFIG = [
  { key: 'calories' as const, label: 'Calories', suffix: '',  color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.15)' },
  { key: 'protein'  as const, label: 'Protein',  suffix: 'g', color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.15)' },
  { key: 'carbs'    as const, label: 'Carbs',    suffix: 'g', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.15)' },
  { key: 'fat'      as const, label: 'Fat',      suffix: 'g', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
];

export function MealLogger({ onMealLogged }: MealLoggerProps) {
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Describe your meal first');
      return;
    }
    setIsLoading(true);
    setAnalysis(null);

    const result = await api.analyzeMeal(description, mealType);
    if (result.data) {
      setAnalysis(result.data);
      setDescription('');
      onMealLogged?.();
    } else {
      toast.error(result.error || 'Analysis failed');
    }
    setIsLoading(false);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 48px rgba(0,0,0,0.4)',
      }}>

      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
          Log a Meal
        </h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Meal type selector */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
            Meal type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((t) => {
              const active = mealType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setMealType(t.value)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: active ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    boxShadow: active ? '0 0 12px rgba(34,211,238,0.12)' : 'none',
                  }}>
                  <span className="text-lg leading-none">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                What did you eat?
              </label>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.2)',
                  color: 'var(--accent-cyan)',
                }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16a1 1 0 01-1 1h-1M4 4l16 16M4 20l4-4" />
                </svg>
                Scan Barcode
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. grilled salmon with quinoa and roasted vegetables…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl resize-none text-sm input-dark"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold btn-primary relative overflow-hidden"
            whileTap={{ scale: 0.98 }}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2">
                  <motion.span
                    className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                  Analyzing…
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}>
                  Analyze Meal
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>

        {/* Barcode scanner modal */}
        <AnimatePresence>
          {showScanner && (
            <BarcodeScanner
              onAdd={(text) => {
                setDescription((prev) => prev ? `${prev}, ${text}` : text);
                toast.success('Added to meal description', {
                  style: { background: '#0d1117', color: '#f1f5f9', border: '1px solid rgba(34,211,238,0.3)' },
                });
              }}
              onClose={() => setShowScanner(false)}
            />
          )}
        </AnimatePresence>

        {/* Analysis result */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(34,211,238,0.15)',
              }}>

              {/* Top bar */}
              <div
                className="px-4 py-2.5 flex items-center gap-2 border-b"
                style={{
                  background: 'rgba(34,211,238,0.05)',
                  borderColor: 'rgba(34,211,238,0.1)',
                }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-emerald)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-cyan)' }}>
                  Nutrition Breakdown
                </span>
                {analysis.confidence_score && (
                  <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                    {Math.round(analysis.confidence_score * 100)}% confidence
                  </span>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Macro grid */}
                <div className="grid grid-cols-4 gap-2">
                  {MACRO_CONFIG.map((m, i) => {
                    const val = analysis.analysis?.[m.key] ?? 0;
                    return (
                      <motion.div
                        key={m.key}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
                        className="text-center py-3 rounded-lg"
                        style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                        <div className="text-xl font-bold tabular-nums" style={{ color: m.color }}>
                          {val}{m.suffix}
                        </div>
                        <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                          {m.label}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Recommendations
                    </p>
                    <ul className="space-y-1.5">
                      {analysis.recommendations.map((rec, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.07 }}
                          className="flex items-start gap-2 text-xs"
                          style={{ color: 'var(--text-secondary)' }}>
                          <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full" style={{ background: 'var(--accent-emerald)', marginTop: '5px' }} />
                          {rec}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { containerVariants, itemVariants } from "@/lib/animations";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export default function ProgressPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [period]);

  const loadProgress = async () => {
    setLoading(true);
    const endpoint =
      period === "weekly"
        ? `"${API_BASE_URL}/api/meals/progress/weekly/"`
        : `"${API_BASE_URL}/api/meals/progress/monthly/"`;

    try {
      const response = await fetch(endpoint, { credentials: "include" });
      const data = await response.json();
      setProgressData(data);
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}>
            <motion.div
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-gray-600">Loading progress...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (
    !progressData ||
    !progressData.progress ||
    progressData.progress.length === 0
  ) {
    return (
      <DashboardLayout>
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" }}>
          <motion.div
            className="text-6xl mb-4"
            animate={{
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.5 }}>
            📊
          </motion.div>
          <p className="text-gray-600 mb-4">
            No progress data yet. Start logging meals to see your progress!
          </p>
        </motion.div>
      </DashboardLayout>
    );
  }

  const { progress, summary } = progressData;

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6 px-4 sm:px-6 lg:px-8 py-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        {/* Header with Period Toggle */}
        <motion.div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
          variants={itemVariants}>
          <h1 className="text-2xl font-bold">Progress Tracking</h1>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setPeriod("weekly")}
              className={`px-4 py-2 rounded transition-colors ${
                period === "weekly" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              7 Days
            </motion.button>
            <motion.button
              onClick={() => setPeriod("monthly")}
              className={`px-4 py-2 rounded transition-colors ${
                period === "monthly" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              30 Days
            </motion.button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        {summary && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={containerVariants}>
            <AnimatedCard className="bg-white rounded-lg shadow p-6" delay={0}>
              <div className="text-sm text-gray-600 mb-1">Avg Calories</div>
              <motion.div
                className="text-2xl font-bold text-blue-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}>
                <AnimatedNumber value={summary.avg_calories} />
              </motion.div>
            </AnimatedCard>

            <AnimatedCard
              className="bg-white rounded-lg shadow p-6"
              delay={0.1}>
              <div className="text-sm text-gray-600 mb-1">Avg Protein</div>
              <motion.div
                className="text-2xl font-bold text-green-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}>
                <AnimatedNumber value={summary.avg_protein} suffix="g" />
              </motion.div>
            </AnimatedCard>

            <AnimatedCard
              className="bg-white rounded-lg shadow p-6"
              delay={0.2}>
              <div className="text-sm text-gray-600 mb-1">Adherence</div>
              <motion.div
                className="text-2xl font-bold text-purple-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}>
                <AnimatedNumber value={summary.avg_adherence} suffix="%" />
              </motion.div>
            </AnimatedCard>

            <AnimatedCard
              className="bg-white rounded-lg shadow p-6"
              delay={0.3}>
              <div className="text-sm text-gray-600 mb-1">Days Tracked</div>
              <motion.div
                className="text-2xl font-bold text-orange-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}>
                <AnimatedNumber value={summary.days_tracked} />
              </motion.div>
            </AnimatedCard>
          </motion.div>
        )}

        {/* Calorie Trend Chart */}
        <AnimatedCard className="bg-white rounded-lg shadow p-6" delay={0.4}>
          <motion.h2
            className="text-lg font-semibold mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}>
            Calorie Intake vs Goal
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Calories"
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="goal_calories"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Goal"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatedCard>

        {/* Macro Distribution Chart */}
        <AnimatedCard className="bg-white rounded-lg shadow p-6" delay={0.5}>
          <motion.h2
            className="text-lg font-semibold mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}>
            Macronutrient Breakdown
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="protein"
                  fill="#10b981"
                  name="Protein (g)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="carbs"
                  fill="#f59e0b"
                  name="Carbs (g)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="fat"
                  fill="#8b5cf6"
                  name="Fat (g)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatedCard>

        {/* Adherence Score Chart */}
        <AnimatedCard className="bg-white rounded-lg shadow p-6" delay={0.6}>
          <motion.h2
            className="text-lg font-semibold mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}>
            Daily Adherence Score
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Bar
                  dataKey="adherence_score"
                  fill="#8b5cf6"
                  name="Adherence %"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatedCard>
      </motion.div>
    </DashboardLayout>
  );
}

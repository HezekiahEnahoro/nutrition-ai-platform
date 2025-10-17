"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout"; // Add this
import { MealLogger } from "@/components/forms/MealLogger";
import { useAuth } from "@/lib/auth";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { containerVariants, itemVariants } from "@/lib/animations";
import { Meal } from "@/types";

interface DailySummary {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadDashboardData();
    }
  }, [isAuthenticated, authLoading]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [summaryResponse, mealsResponse] = await Promise.all([
        fetch("http://localhost:8000/api/meals/daily_summary/", {
          credentials: "include",
        }),
        fetch("http://localhost:8000/api/meals/", { credentials: "include" }),
      ]);

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setDailySummary(summaryData);
      }

      if (mealsResponse.ok) {
        const mealsData = await mealsResponse.json();
        setMeals(mealsData.results || []);
      }
    } catch (error) {
      console.error("Dashboard data loading error:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealLogged = () => {
    loadDashboardData();
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}>
            <motion.div
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-gray-600">Loading...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading && !dailySummary) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}>
            <motion.div
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-gray-600">Loading your dashboard...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        className="py-6 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <div className="max-w-7xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}>
                {error}
                <button
                  onClick={loadDashboardData}
                  className="ml-4 underline hover:no-underline">
                  Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Daily Summary with Animated Numbers */}
          {dailySummary && dailySummary.totals && (
            <AnimatedCard className="bg-white rounded-lg shadow p-4 sm:p-6">
              <motion.h2
                className="text-lg font-semibold mb-4"
                variants={itemVariants}>
                Today&apos;s Summary
              </motion.h2>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
                variants={containerVariants}>
                <motion.div
                  className="text-center p-3 bg-blue-50 rounded-lg"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    <AnimatedNumber value={dailySummary.totals.calories || 0} />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Calories
                  </div>
                </motion.div>

                <motion.div
                  className="text-center p-3 bg-green-50 rounded-lg"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    <AnimatedNumber
                      value={dailySummary.totals.protein || 0}
                      suffix="g"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Protein
                  </div>
                </motion.div>

                <motion.div
                  className="text-center p-3 bg-yellow-50 rounded-lg"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                    <AnimatedNumber
                      value={dailySummary.totals.carbs || 0}
                      suffix="g"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Carbs</div>
                </motion.div>

                <motion.div
                  className="text-center p-3 bg-purple-50 rounded-lg"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    <AnimatedNumber
                      value={dailySummary.totals.fat || 0}
                      suffix="g"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Fat</div>
                </motion.div>
              </motion.div>
            </AnimatedCard>
          )}

          {/* Meal Logger */}
          <motion.div variants={itemVariants}>
            <MealLogger onMealLogged={handleMealLogged} />
          </motion.div>

          {/* Recent Meals with Stagger Animation */}
          <AnimatePresence mode="wait">
            {meals.length > 0 ? (
              <AnimatedCard className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Recent Meals</h2>
                </div>
                <motion.div
                  className="divide-y divide-gray-200"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible">
                  {meals.slice(0, 5).map((meal) => (
                    <motion.div
                      key={meal.id}
                      className="p-4 sm:p-6"
                      variants={itemVariants}
                      whileHover={{ backgroundColor: "#f9fafb" }}
                      layout>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <motion.span
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize"
                              whileHover={{ scale: 1.1 }}>
                              {meal.meal_type}
                            </motion.span>
                            <span className="text-sm text-gray-500">
                              {new Date(meal.logged_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-2 text-sm sm:text-base">
                            {meal.description}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600">
                            {meal.total_calories && (
                              <span className="font-medium">
                                {Math.round(meal.total_calories)} cal
                              </span>
                            )}
                            {meal.total_protein && (
                              <span>
                                {Math.round(meal.total_protein)}g protein
                              </span>
                            )}
                            {meal.total_carbs && (
                              <span>{Math.round(meal.total_carbs)}g carbs</span>
                            )}
                            {meal.total_fat && (
                              <span>{Math.round(meal.total_fat)}g fat</span>
                            )}
                          </div>
                        </div>
                        {meal.ai_confidence && (
                          <motion.div
                            className="text-xs text-gray-500 sm:text-right"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}>
                            AI: {Math.round(meal.ai_confidence * 100)}%
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatedCard>
            ) : (
              <motion.div
                className="bg-white rounded-lg shadow p-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" }}>
                <motion.div
                  className="text-4xl mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}>
                  🍽️
                </motion.div>
                <p className="text-gray-500 mb-2">No meals logged yet</p>
                <p className="text-sm text-gray-400">
                  Start by logging your first meal above!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

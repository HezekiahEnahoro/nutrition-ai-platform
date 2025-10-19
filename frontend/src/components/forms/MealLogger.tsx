'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { scaleVariants, successVariants } from '@/lib/animations';

interface MealLoggerProps {
  onMealLogged?: () => void;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL?? "").replace(/\/+$/, "") || "";

export function MealLogger({ onMealLogged }: MealLoggerProps) {
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("Please describe your meal");
      return;
    }

    setIsLoading(true);
    setAnalysis(null);
    setShowSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/meals/analyze/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          description,
          meal_type: mealType,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
        setShowSuccess(true);
        setDescription("");
        onMealLogged?.();

        // Hide success message after 2 seconds
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to analyze meal");
      }
    } catch (error) {
      console.error("Meal analysis error:", error);
      setError("Failed to analyze meal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedCard className="bg-white rounded-lg shadow p-4 sm:p-6">
      <motion.h2
        className="text-xl font-semibold mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}>
        Log Your Meal
      </motion.h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}>
              {error}
            </motion.div>
          )}

          {showSuccess && (
            <motion.div
              className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded flex items-center gap-2"
              variants={successVariants}
              initial="hidden"
              animate="visible"
              exit="hidden">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}>
                ✓
              </motion.span>
              Meal logged successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meal Type
          </label>
          <motion.select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            whileFocus={{ scale: 1.01 }}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </motion.select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What did you eat?
          </label>
          <motion.textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., grilled chicken breast with quinoa and steamed broccoli"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            whileFocus={{ scale: 1.01 }}
          />
          <p className="text-sm text-gray-500 mt-1">
            Be as specific as possible for better AI analysis
          </p>
        </motion.div>

        <AnimatedButton
          type="submit"
          disabled={isLoading || !description.trim()}
          className="w-full">
          {isLoading ? (
            <motion.span
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}>
              <motion.span
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Analyzing...
            </motion.span>
          ) : (
            "Analyze Meal"
          )}
        </AnimatedButton>
      </form>

      <AnimatePresence mode="wait">
        {analysis && (
          <motion.div
            className="mt-6 p-4 bg-blue-50 rounded-lg overflow-hidden"
            variants={scaleVariants}
            initial="hidden"
            animate="visible"
            exit="exit">
            <motion.h3
              className="font-semibold text-blue-900 mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}>
              ✨ AI Analysis
            </motion.h3>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}>
              {[
                {
                  value: analysis.analysis?.calories || 0,
                  label: "Calories",
                  color: "blue",
                },
                {
                  value: `${analysis.analysis?.protein || 0}g`,
                  label: "Protein",
                  color: "green",
                },
                {
                  value: `${analysis.analysis?.carbs || 0}g`,
                  label: "Carbs",
                  color: "yellow",
                },
                {
                  value: `${analysis.analysis?.fat || 0}g`,
                  label: "Fat",
                  color: "purple",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.8 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  whileHover={{ scale: 1.1 }}>
                  <motion.div
                    className={`text-2xl font-bold text-${item.color}-600`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: index * 0.1 + 0.2,
                    }}>
                    {item.value}
                  </motion.div>
                  <div className="text-sm text-gray-600">{item.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {analysis.recommendations &&
              analysis.recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}>
                  <h4 className="font-medium text-gray-800 mb-2">
                    💡 Recommendations:
                  </h4>
                  <motion.ul
                    className="space-y-1"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}>
                    {analysis.recommendations.map(
                      (rec: string, index: number) => (
                        <motion.li
                          key={index}
                          className="text-sm text-gray-700 flex items-start"
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0 },
                          }}>
                          <span className="text-blue-500 mr-2">•</span>
                          {rec}
                        </motion.li>
                      )
                    )}
                  </motion.ul>
                </motion.div>
              )}

            <motion.div
              className="mt-3 text-xs text-gray-500 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}>
              AI Confidence:{" "}
              {Math.round((analysis.confidence_score || 0) * 100)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedCard>
  );
}
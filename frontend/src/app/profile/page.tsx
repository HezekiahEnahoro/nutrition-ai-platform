"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { containerVariants, itemVariants } from "@/lib/animations";

interface CalculatedGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const API_BASE_URL =(process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "") || "";
export default function ProfilePage() {
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "",
    activity_level: "moderate",
    primary_goal: "improve_health",
    dietary_restrictions: [] as string[],
    allergies: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [calculatedGoals, setCalculatedGoals] =
    useState<CalculatedGoals | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          age: data.age?.toString() || "",
          weight: data.weight?.toString() || "",
          height: data.height?.toString() || "",
          gender: data.gender || "",
          activity_level: data.activity_level || "moderate",
          primary_goal: data.primary_goal || "improve_health",
          dietary_restrictions: data.dietary_restrictions || [],
          allergies: data.allergies || [],
        });

        if (data.daily_calorie_goal) {
          setCalculatedGoals({
            calories: data.daily_calorie_goal,
            protein: data.daily_protein_goal,
            carbs: data.daily_carbs_goal,
            fat: data.daily_fat_goal,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const profileData = {
      age: formData.age ? parseInt(formData.age) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      gender: formData.gender,
      activity_level: formData.activity_level,
      primary_goal: formData.primary_goal,
      dietary_restrictions: formData.dietary_restrictions,
      allergies: formData.allergies,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage("Profile updated successfully!");

        if (data.profile) {
          setCalculatedGoals({
            calories: data.profile.daily_calorie_goal,
            protein: data.profile.daily_protein_goal,
            carbs: data.profile.daily_carbs_goal,
            fat: data.profile.daily_fat_goal,
          });
        }
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage("Failed to update profile");
    }

    setSaving(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading profile...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <motion.h1 className="text-2xl font-bold mb-6" variants={itemVariants}>
          Your Profile
        </motion.h1>

        <AnimatedCard className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-6">
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                className={`px-4 py-3 rounded ${
                  message.includes("success")
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}>
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Physical Information */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold mb-4">
                Physical Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <motion.input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="13"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    whileFocus={{ scale: 1.01 }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <motion.select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    whileFocus={{ scale: 1.01 }}
                    required>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </motion.select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <motion.input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    step="0.1"
                    min="20"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    whileFocus={{ scale: 1.01 }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  <motion.input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    step="0.1"
                    min="100"
                    max="250"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    whileFocus={{ scale: 1.01 }}
                    required
                  />
                </div>
              </div>
            </motion.div>

            {/* Lifestyle */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold mb-4">Lifestyle</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Level
                  </label>
                  <motion.select
                    name="activity_level"
                    value={formData.activity_level}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    whileFocus={{ scale: 1.01 }}>
                    <option value="sedentary">
                      Sedentary (little/no exercise)
                    </option>
                    <option value="light">
                      Lightly active (1-3 days/week)
                    </option>
                    <option value="moderate">
                      Moderately active (3-5 days/week)
                    </option>
                    <option value="very">Very active (6-7 days/week)</option>
                    <option value="extra">Extra active (physical job)</option>
                  </motion.select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Goal
                  </label>
                  <motion.select
                    name="primary_goal"
                    value={formData.primary_goal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    whileFocus={{ scale: 1.01 }}>
                    <option value="lose_weight">Lose Weight</option>
                    <option value="maintain_weight">Maintain Weight</option>
                    <option value="gain_weight">Gain Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="improve_health">
                      Improve Overall Health
                    </option>
                  </motion.select>
                </div>
              </div>
            </motion.div>

            <AnimatedButton
              type="submit"
              disabled={saving}
              className="w-full touch-target">
              {saving ? "Saving..." : "Save Profile"}
            </AnimatedButton>
          </form>
        </AnimatedCard>

        {/* Calculated Goals */}
        <AnimatePresence mode="wait">
          {calculatedGoals && (
            <motion.div
              className="mt-6 bg-blue-50 rounded-lg p-4 sm:p-6 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring" }}>
              <h2 className="text-base sm:text-lg font-semibold mb-4">
                Your Personalized Goals
              </h2>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible">
                {[
                  {
                    value: calculatedGoals.calories,
                    label: "Cal/day",
                    suffix: "",
                    color: "blue",
                  },
                  {
                    value: calculatedGoals.protein,
                    label: "Protein/day",
                    suffix: "g",
                    color: "green",
                  },
                  {
                    value: calculatedGoals.carbs,
                    label: "Carbs/day",
                    suffix: "g",
                    color: "yellow",
                  },
                  {
                    value: calculatedGoals.fat,
                    label: "Fat/day",
                    suffix: "g",
                    color: "purple",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="text-center p-3 bg-white rounded-lg"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -5 }}>
                    <motion.div
                      className={`text-xl sm:text-2xl font-bold text-${item.color}-600`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: index * 0.1 }}>
                      <AnimatedNumber value={item.value} suffix={item.suffix} />
                    </motion.div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {item.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-xs sm:text-sm text-gray-600 mt-4">
                These goals are automatically calculated based on your profile
                and will be used to provide personalized recommendations.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}

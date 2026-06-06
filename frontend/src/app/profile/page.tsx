"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { UserProfile } from "@/types";

const DIETARY_OPTIONS = [
  "vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "paleo", "halal", "kosher",
];

interface CalculatedGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
      {children}
    </label>
  );
}

function InputField({
  label, name, type = "text", value, onChange, placeholder, min, max, step, required,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; min?: string; max?: string; step?: string; required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
        style={{ color: "var(--text-primary)" }}
      />
    </div>
  );
}

function SelectField({
  label, name, value, onChange, options, required,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="input-dark w-full appearance-none px-4 py-2.5 pr-10 rounded-xl text-sm"
          style={{
            color: value ? "var(--text-primary)" : "var(--text-muted)",
            background: "rgba(255,255,255,0.04)",
          }}>
          {options.map((o) => (
            <option key={o.value} value={o.value} style={{ background: "#0d1117", color: "#f1f5f9" }}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3" style={{ color: "var(--text-muted)" }}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
        style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.15)" }}>
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

const GOAL_CARDS = [
  { key: "calories" as const, label: "Calories / day", suffix: "",  color: "#22d3ee", glow: "rgba(34,211,238,0.2)",  bg: "rgba(34,211,238,0.06)",  border: "rgba(34,211,238,0.15)" },
  { key: "protein"  as const, label: "Protein / day",  suffix: "g", color: "#34d399", glow: "rgba(52,211,153,0.2)",  bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.15)" },
  { key: "carbs"    as const, label: "Carbs / day",    suffix: "g", color: "#fbbf24", glow: "rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.15)" },
  { key: "fat"      as const, label: "Fat / day",      suffix: "g", color: "#a78bfa", glow: "rgba(167,139,250,0.2)", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.15)" },
];

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
  const [allergyInput, setAllergyInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculatedGoals, setCalculatedGoals] = useState<CalculatedGoals | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const result = await api.getProfile();
    if (result.data) {
      const data = result.data as UserProfile;
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
          protein: data.daily_protein_goal || 0,
          carbs: data.daily_carbs_goal || 0,
          fat: data.daily_fat_goal || 0,
        });
      }
    } else if (result.error) {
      toast.error("Failed to load profile");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const profileData: Partial<UserProfile> = {
      age: formData.age ? parseInt(formData.age) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      gender: formData.gender as UserProfile["gender"],
      activity_level: formData.activity_level as UserProfile["activity_level"],
      primary_goal: formData.primary_goal as UserProfile["primary_goal"],
      dietary_restrictions: formData.dietary_restrictions,
      allergies: formData.allergies,
    };
    const result = await api.updateProfile(profileData);
    if (result.data) {
      const data = result.data as UserProfile;
      if (data.daily_calorie_goal) {
        setCalculatedGoals({
          calories: data.daily_calorie_goal,
          protein: data.daily_protein_goal || 0,
          carbs: data.daily_carbs_goal || 0,
          fat: data.daily_fat_goal || 0,
        });
      }
      toast.success("Profile saved!", {
        style: { background: "#0d1117", color: "#f1f5f9", border: "1px solid rgba(52,211,153,0.3)" },
        iconTheme: { primary: "#34d399", secondary: "#0d1117" },
      });
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleDiet = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(option)
        ? prev.dietary_restrictions.filter((r) => r !== option)
        : [...prev.dietary_restrictions, option],
    }));
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim().toLowerCase();
    if (trimmed && !formData.allergies.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, allergies: [...prev.allergies, trimmed] }));
    }
    setAllergyInput("");
  };

  const removeAllergy = (a: string) => {
    setFormData((prev) => ({ ...prev, allergies: prev.allergies.filter((x) => x !== a) }));
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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent-cyan)" }}>
            Account
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Your Profile</h1>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Physical */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-2xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
            }}>
            <SectionHeading icon="⚖️" title="Physical Information" subtitle="Used to calculate your calorie & macro targets" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder="25" min="13" max="120" required />
              <SelectField
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={[
                  { value: "", label: "Select gender" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
                required
              />
              <InputField label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} placeholder="70" min="20" max="300" step="0.1" required />
              <InputField label="Height (cm)" name="height" type="number" value={formData.height} onChange={handleChange} placeholder="175" min="100" max="250" step="0.1" required />
            </div>
          </motion.div>

          {/* Lifestyle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="rounded-2xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
            }}>
            <SectionHeading icon="🏃" title="Lifestyle" subtitle="Activity level and primary fitness goal" />
            <div className="space-y-4">
              <SelectField
                label="Activity Level"
                name="activity_level"
                value={formData.activity_level}
                onChange={handleChange}
                options={[
                  { value: "sedentary", label: "Sedentary — little or no exercise" },
                  { value: "light",    label: "Lightly active — 1–3 days/week" },
                  { value: "moderate", label: "Moderately active — 3–5 days/week" },
                  { value: "very",     label: "Very active — 6–7 days/week" },
                  { value: "extra",    label: "Extra active — physical job" },
                ]}
              />
              <SelectField
                label="Primary Goal"
                name="primary_goal"
                value={formData.primary_goal}
                onChange={handleChange}
                options={[
                  { value: "lose_weight",     label: "Lose Weight" },
                  { value: "maintain_weight", label: "Maintain Weight" },
                  { value: "gain_weight",     label: "Gain Weight" },
                  { value: "build_muscle",    label: "Build Muscle" },
                  { value: "improve_health",  label: "Improve Overall Health" },
                ]}
              />
            </div>
          </motion.div>

          {/* Dietary Restrictions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.4 }}
            className="rounded-2xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
            }}>
            <SectionHeading icon="🥗" title="Dietary Restrictions" subtitle="Select all that apply" />
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => {
                const selected = formData.dietary_restrictions.includes(opt);
                return (
                  <motion.button
                    key={opt}
                    type="button"
                    onClick={() => toggleDiet(opt)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
                    style={
                      selected
                        ? {
                            background: "rgba(34,211,238,0.15)",
                            color: "#22d3ee",
                            border: "1px solid rgba(34,211,238,0.4)",
                            boxShadow: "0 0 12px rgba(34,211,238,0.15)",
                          }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            color: "var(--text-muted)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }
                    }>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Allergies */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.4 }}
            className="rounded-2xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
            }}>
            <SectionHeading icon="⚠️" title="Allergies" subtitle="Press Enter or Add to tag an allergen" />
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllergy(); } }}
                placeholder="e.g. peanuts, shellfish…"
                className="input-dark flex-1 px-4 py-2.5 rounded-xl text-sm"
                style={{ color: "var(--text-primary)" }}
              />
              <motion.button
                type="button"
                onClick={addAllergy}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary">
                Add
              </motion.button>
            </div>
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: "rgba(251,113,133,0.1)",
                      color: "#fb7185",
                      border: "1px solid rgba(251,113,133,0.2)",
                    }}>
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="opacity-70 hover:opacity-100 transition-opacity leading-none font-bold">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={saving}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl text-sm font-semibold btn-primary disabled:opacity-40">
            {saving ? "Saving…" : "Save Profile"}
          </motion.button>
        </form>

        {/* Personalized Goals */}
        <AnimatePresence>
          {calculatedGoals && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
                }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Personalized Goals
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Auto-calculated from your profile
                  </p>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GOAL_CARDS.map((g, i) => (
                    <motion.div
                      key={g.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07, type: "spring" }}
                      className="rounded-xl p-4 text-center"
                      style={{ background: g.bg, border: `1px solid ${g.border}`, boxShadow: `0 4px 16px ${g.glow}` }}>
                      <div className="text-2xl font-bold tabular-nums mb-1" style={{ color: g.color }}>
                        {Math.round(calculatedGoals[g.key])}{g.suffix}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{g.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}

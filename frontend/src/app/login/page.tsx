"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, authLoading, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.username.trim()) e.username = "Username is required";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    const result = await login(formData.username, formData.password);
    if (result.success) {
      router.push("/dashboard");
    } else {
      const msg = result.error || "Login failed";
      setErrors({ general: msg.toLowerCase().includes("invalid") ? "Invalid username or password" : msg });
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name] || errors.general) setErrors({});
  };

  if (authLoading) {
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
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--bg-primary)" }}>

      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "rgba(34,211,238,0.04)", filter: "blur(80px)" }} />

      <motion.div
        className="w-full max-w-sm relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 64px rgba(0,0,0,0.6)",
          }}>

          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", boxShadow: "0 0 24px rgba(34,211,238,0.3)" }}>
              N
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Welcome back</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sign in to your NutritionAI account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)", color: "#fb7185" }}>
                  {errors.general}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="your_username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl text-sm input-dark"
              />
              {errors.username && (
                <p className="mt-1.5 text-xs" style={{ color: "#fb7185" }}>{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl text-sm input-dark"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs" style={{ color: "#fb7185" }}>{errors.password}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold btn-primary mt-2"
              whileTap={{ scale: 0.98 }}>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2">
                    <motion.span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
                      animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                    Signing in…
                  </motion.span>
                ) : (
                  <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Sign in
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No account?{" "}
            <Link href="/register" className="font-medium transition-colors" style={{ color: "var(--accent-cyan)" }}>
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

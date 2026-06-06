"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: "", email: "", first_name: "", last_name: "",
    password: "", password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push("/profile");
  }, [isAuthenticated, authLoading, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.username.trim()) e.username = "Username is required";
    else if (formData.username.length < 3) e.username = "Minimum 3 characters";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Minimum 6 characters";
    if (!formData.password_confirm) e.password_confirm = "Please confirm password";
    else if (formData.password !== formData.password_confirm) e.password_confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    const result = await register(formData);
    if (!result.success) {
      const msg = result.error || "Registration failed";
      if (msg.toLowerCase().includes("username")) setErrors({ username: msg });
      else if (msg.toLowerCase().includes("email")) setErrors({ email: msg });
      else if (msg.toLowerCase().includes("password")) setErrors({ password: msg });
      else setErrors({ general: msg });
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name] || errors.general) {
      setErrors((p) => { const n = { ...p }; delete n[e.target.name]; delete n.general; return n; });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <motion.div className="w-8 h-8 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "var(--accent-cyan)" }}
          animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
      </div>
    );
  }

  const field = (
    name: keyof typeof formData,
    label: string,
    type = "text",
    placeholder = "",
    hint?: string,
  ) => (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        disabled={loading}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm input-dark"
      />
      {errors[name] && <p className="mt-1.5 text-xs" style={{ color: "#fb7185" }}>{errors[name]}</p>}
      {hint && !errors[name] && <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--bg-primary)" }}>

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "rgba(139,92,246,0.04)", filter: "blur(80px)" }} />

      <motion.div
        className="w-full max-w-sm relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 64px rgba(0,0,0,0.6)",
          }}>

          <div className="text-center mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", boxShadow: "0 0 24px rgba(34,211,238,0.3)" }}>
              N
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Create account</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start your nutrition journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {errors.general && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)", color: "#fb7185" }}>
                  {errors.general}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              {field("first_name", "First name", "text", "Jane")}
              {field("last_name",  "Last name",  "text", "Doe")}
            </div>
            {field("username", "Username *", "text", "jane_doe")}
            {field("email",    "Email *",    "email", "jane@example.com")}
            {field("password", "Password *", "password", "••••••••", "Minimum 6 characters")}
            {field("password_confirm", "Confirm password *", "password", "••••••••")}

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
                    Creating account…
                  </motion.span>
                ) : (
                  <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Create account
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium transition-colors" style={{ color: "var(--accent-cyan)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

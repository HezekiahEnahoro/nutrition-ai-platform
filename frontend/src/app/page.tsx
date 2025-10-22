"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}>
              <span className="text-3xl">🥗</span>
              <span className="text-xl font-bold text-gray-900">
                NutritionAI
              </span>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}>
              <Link
                href="/login"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Get Started
              </Link>
            </motion.div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6">
                AI-Powered
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Nutrition Tracking
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Stop counting calories manually. Just describe your meal in
                plain English and let AI handle the rest.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}>
              <Link
                href="/register"
                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Start Free Today
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all">
                See How It Works
              </Link>
            </motion.div>

            <motion.p
              className="mt-6 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}>
              No credit card required • Free forever
            </motion.p>
          </div>

          {/* Demo Image Placeholder */}
          <motion.div
            className="mt-16 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1">
              <div className="bg-white rounded-lg overflow-hidden">
                <Image
                  src="/nutrition-ai-dashboard.png"
                  alt="NutritionAI Dashboard"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to track nutrition
            </h2>
            <p className="text-xl text-gray-600">
              Powered by AI and backed by USDA nutrition data
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Analysis",
                description:
                  'Just type "2 eggs with toast" and get instant nutrition breakdown. No manual searching.',
              },
              {
                icon: "📊",
                title: "Progress Tracking",
                description:
                  "Beautiful charts showing your daily, weekly, and monthly nutrition trends.",
              },
              {
                icon: "🎯",
                title: "Personalized Goals",
                description:
                  "Get custom calorie and macro targets based on your age, weight, activity level, and goals.",
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                description:
                  "Log meals in seconds. 90% faster than traditional nutrition apps.",
              },
              {
                icon: "📱",
                title: "Works Everywhere",
                description:
                  "Smooth experience on desktop, tablet, and mobile with beautiful animations.",
              },
              {
                icon: "🔒",
                title: "Your Data is Safe",
                description:
                  "Secure authentication with encrypted data storage. Your privacy matters.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to better nutrition
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Describe Your Meal",
                description:
                  'Type naturally: "chicken breast with rice and broccoli" or "2 eggs and avocado toast"',
              },
              {
                step: "2",
                title: "Get Instant Analysis",
                description:
                  "AI analyzes your meal using USDA data and gives you complete nutrition breakdown",
              },
              {
                step: "3",
                title: "Track Your Progress",
                description:
                  "View beautiful charts showing your daily totals, weekly trends, and goal adherence",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}>
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to transform your nutrition?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who are already tracking smarter, not
              harder.
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg">
              Get Started Free
            </Link>
            <p className="mt-4 text-blue-100 text-sm">
              No credit card required • Takes 30 seconds
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-3xl">🥗</span>
            <span className="text-xl font-bold text-white">NutritionAI</span>
          </div>
          <p className="mb-4">AI-powered nutrition tracking made simple</p>
          <div className="flex justify-center space-x-6 mb-4">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              className="hover:text-white transition-colors">
              Register
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            © 2025 NutritionAI. Built with Django & Next.js.
          </p>
        </div>
      </footer>
    </div>
  );
}

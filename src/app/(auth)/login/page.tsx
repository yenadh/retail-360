// src/app/login/page.tsx

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

type ApiResponse = {
  success: boolean;
  message: string;
  data?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Login failed");
        return;
      }

      const role = result.data?.role;

      if (role === "CUSTOMER") {
        router.push("/");
      } else {
        router.push("/admin/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#120A1F] px-4 py-10">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-purple-500/30 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]"
      >
        <div className="hidden bg-gradient-to-br from-[#2E1065] via-[#6D28D9] to-[#A855F7] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Retail360</h1>
                <p className="text-sm text-purple-100">
                  Online Retail Management
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-4xl font-bold leading-tight">
                Welcome back to your retail control center.
              </h2>
              <p className="mt-4 text-sm leading-6 text-purple-100">
                Manage sales, stock, orders, payments, deliveries, and business
                performance from one digital platform.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "Secure Login",
                text: "Protected access for customers and staff.",
              },
              {
                icon: Sparkles,
                title: "Modern Workflow",
                text: "Built for digital retail operations.",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.1 }}
                  className="rounded-2xl bg-white/10 p-4"
                >
                  <Icon className="mb-3 h-5 w-5 text-pink-200" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-purple-100">{item.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                Login
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Access your account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter your email and password to continue.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#8B5CF6] focus-within:bg-white">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#8B5CF6] focus-within:bg-white">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#7C3AED]"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="font-medium text-[#7C3AED] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Logging in..." : "Login"}
                {!isLoading && (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Do not have an account?{" "}
              <button
                onClick={() => router.push("/register")}
                className="font-semibold text-[#7C3AED] hover:underline"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

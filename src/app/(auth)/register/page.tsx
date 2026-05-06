// src/app/register/page.tsx

"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type VerifyEmailData = {
  verificationToken: string;
};

type UserRole =
  | "ADMIN"
  | "CUSTOMER"
  | "INVENTORY_MANAGER"
  | "SALES_STAFF"
  | "DELIVERY_STAFF";

type CreatePasswordData = {
  role: UserRole;
};

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  }, [password]);

  const strengthText = useMemo(() => {
    if (!password) return "";
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength === 2 || passwordStrength === 3) return "Medium";
    return "Strong";
  }, [password, passwordStrength]);

  async function requestVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register/request-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
        }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to send verification code");
        return;
      }

      setMessage(result.message);
      setStep(2);
    } catch {
      setError("Something went wrong. Please try again");
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const result: ApiResponse<VerifyEmailData> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Email verification failed");
        return;
      }

      setVerificationToken(result.data.verificationToken);
      setMessage(result.message);
      setStep(3);
    } catch {
      setError("Something went wrong. Please try again");
    } finally {
      setIsLoading(false);
    }
  }

  async function createPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register/create-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verificationToken,
          password,
          confirmPassword,
        }),
      });

      const result: ApiResponse<CreatePasswordData> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to create account");
        return;
      }

      setMessage(result.message);

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
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-[1fr_1.1fr]"
      >
        <div className="hidden bg-gradient-to-br from-[#2E1065] via-[#6D28D9] to-[#A855F7] p-10 text-white lg:block">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Retail360</h1>
              <p className="text-sm text-purple-100">
                E-Commerce & Inventory System
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-4xl font-bold leading-tight">
                Start your digital retail journey securely.
              </h2>
              <p className="mt-4 text-sm leading-6 text-purple-100">
                Create your account, verify your email, and access a modern
                platform for online sales, inventory, logistics, and payments.
              </p>
            </motion.div>

            <div className="grid gap-4 pt-6">
              {[
                "Secure email verification",
                "Role-based system access",
                "Modern online retail management",
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.1 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-pink-200" />
                  <span className="text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                Create Account
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Register to Retail360
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Complete the secure registration process below.
              </p>
            </div>

            <div className="mb-8 grid grid-cols-3 gap-3">
              {[
                { id: 1, label: "Details" },
                { id: 2, label: "Verify" },
                { id: 3, label: "Password" },
              ].map((item) => (
                <div key={item.id}>
                  <div
                    className={`h-2 rounded-full transition ${
                      step >= item.id ? "bg-[#7C3AED]" : "bg-slate-200"
                    }`}
                  />
                  <p
                    className={`mt-2 text-xs font-medium ${
                      step >= item.id ? "text-[#7C3AED]" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
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

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {message}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step-1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={requestVerification}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#8B5CF6] focus-within:bg-white">
                      <User className="h-5 w-5 text-slate-400" />
                      <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        required
                        placeholder="Enter your full name"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>

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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? "Sending Code..." : "Send Verification Code"}
                    {!isLoading && (
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    )}
                  </button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step-2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={verifyEmail}
                  className="space-y-5"
                >
                  <div className="rounded-2xl bg-purple-50 p-4 text-sm text-purple-800">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold">{email}</span>.
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Verification Code
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#8B5CF6] focus-within:bg-white">
                      <ShieldCheck className="h-5 w-5 text-slate-400" />
                      <input
                        value={code}
                        onChange={(event) =>
                          setCode(event.target.value.replace(/\D/g, ""))
                        }
                        maxLength={6}
                        required
                        placeholder="Enter 6-digit code"
                        className="w-full bg-transparent text-sm tracking-[0.4em] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? "Verifying..." : "Verify Email"}
                    <ShieldCheck className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setCode("");
                      setError("");
                      setMessage("");
                    }}
                    className="w-full text-sm font-medium text-slate-500 hover:text-[#7C3AED]"
                  >
                    Change email address
                  </button>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form
                  key="step-3"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={createPassword}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Create Password
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#8B5CF6] focus-within:bg-white">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        placeholder="Create password"
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

                    {password && (
                      <div className="mt-3">
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((item) => (
                            <div
                              key={item}
                              className={`h-2 rounded-full ${
                                passwordStrength >= item
                                  ? "bg-[#7C3AED]"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Password strength:{" "}
                          <span className="font-semibold">{strengthText}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Confirm Password
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#8B5CF6] focus-within:bg-white">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        required
                        placeholder="Confirm password"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-[#7C3AED] hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

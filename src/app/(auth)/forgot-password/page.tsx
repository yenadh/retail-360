// src/app/forgot-password/page.tsx

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type RequestCodeData = {
  developmentCode?: string;
};

type VerifyCodeData = {
  resetToken: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setMessage("");
    setDevelopmentCode("");

    try {
      const response = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const result: ApiResponse<RequestCodeData> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to request reset code");
        return;
      }

      setMessage(result.message);
      setDevelopmentCode(result.data?.developmentCode || "");
      setStep(2);
    } catch {
      setError("Something went wrong. Please try again");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const result: ApiResponse<VerifyCodeData> = await response.json();

      if (!response.ok || !result.success || !result.data?.resetToken) {
        setError(result.message || "Failed to verify reset code");
        return;
      }

      setResetToken(result.data.resetToken);
      setMessage("Code verified successfully");
      setStep(3);
    } catch {
      setError("Something went wrong. Please try again");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resetToken,
          password,
          confirmPassword,
        }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to reset password");
        return;
      }

      setMessage(result.message);

      setTimeout(() => {
        router.push("/login");
      }, 1200);
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
                Reset your password securely.
              </h2>

              <p className="mt-4 text-sm leading-6 text-purple-100">
                Verify your email address and create a new password to regain
                access to your Retail360 account.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-4">
            <InfoCard
              icon={ShieldCheck}
              title="Secure Verification"
              text="Reset code expires after 10 minutes."
            />

            <InfoCard
              icon={KeyRound}
              title="Password Protection"
              text="Create a new password with at least 8 characters."
            />
          </div>
        </div>

        <div className="bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <button
              onClick={() => router.push("/login")}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#7C3AED]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>

            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                Password Reset
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {step === 1 && "Forgot password?"}
                {step === 2 && "Verify reset code"}
                {step === 3 && "Create new password"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {step === 1 &&
                  "Enter your account email to receive a reset code."}
                {step === 2 &&
                  "Enter the 6-digit code sent to your email address."}
                {step === 3 && "Enter and confirm your new account password."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`h-2 rounded-full ${
                    step >= item
                      ? "bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899]"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {developmentCode && (
              <div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                Development reset code:{" "}
                <span className="font-bold">{developmentCode}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequestCode} className="space-y-5">
                <InputBox
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Enter your email"
                  required
                />

                <SubmitButton
                  isLoading={isLoading}
                  loadingText="Sending code..."
                  text="Send Reset Code"
                />
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <InputBox
                  label="Reset Code"
                  icon={KeyRound}
                  value={code}
                  onChange={(value) =>
                    setCode(value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter 6-digit code"
                  required
                />

                <SubmitButton
                  isLoading={isLoading}
                  loadingText="Verifying..."
                  text="Verify Code"
                />

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm font-semibold text-[#7C3AED] hover:underline"
                >
                  Change email
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <PasswordBox
                  label="New Password"
                  value={password}
                  onChange={setPassword}
                  showPassword={showPassword}
                  onToggleShow={() => setShowPassword((current) => !current)}
                />

                <PasswordBox
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  showPassword={showConfirmPassword}
                  onToggleShow={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                />

                <SubmitButton
                  isLoading={isLoading}
                  loadingText="Resetting..."
                  text="Reset Password"
                />
              </form>
            )}
          </div>
        </div>
      </motion.section>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/10 p-4"
    >
      <Icon className="mb-3 h-5 w-5 text-pink-200" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-purple-100">{text}</p>
    </motion.div>
  );
}

function InputBox({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#8B5CF6] focus-within:bg-white">
        <Icon className="h-5 w-5 text-slate-400" />

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function PasswordBox({
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#8B5CF6] focus-within:bg-white">
        <Lock className="h-5 w-5 text-slate-400" />

        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={8}
          placeholder="Minimum 8 characters"
          className="w-full bg-transparent text-sm outline-none"
        />

        <button
          type="button"
          onClick={onToggleShow}
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
  );
}

function SubmitButton({
  isLoading,
  loadingText,
  text,
}: {
  isLoading: boolean;
  loadingText: string;
  text: string;
}) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {text}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </>
      )}
    </button>
  );
}

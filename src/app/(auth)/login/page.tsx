"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import {
  login as loginApi,
  resendVerification,
  type LoginError,
  USER_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY
} from "@/lib/api";



type FieldErrors = Record<string, string | undefined>;

function validateLogin(data: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!data.password) errors.password = "Password is required.";
  return errors;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | LoginError | null>(null);
  const [verifiedMessage, setVerifiedMessage] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setVerifiedMessage(true);
    }
    if (searchParams.get("expired") === "1") {
      setExpiredMessage(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setExpiredMessage(false);
    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    setTouched({ email: true, password: true });
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await loginApi({ email, password });
      const user = {
        email: res.user.email,
        fullName: res.user.full_name,
        username: res.user.username,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        window.localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
        if (res.refresh_token) {
          window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.refresh_token);
        }
      }
      router.push("/dashboard");
      return;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && "message" in err) {
        setSubmitError(err as LoginError);
      } else {
        setSubmitError(err instanceof Error ? err.message : "Invalid email or password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isEmailNotVerified =
    submitError &&
    typeof submitError === "object" &&
    "code" in submitError &&
    submitError.code === "email_not_verified";

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setResendSuccess(false);
    setResendLoading(true);
    try {
      await resendVerification(email.trim());
      setResendSuccess(true);
    } catch {
      setSubmitError({ message: "Could not send email. Try again in a few minutes.", code: "email_not_verified" });
    } finally {
      setResendLoading(false);
    }
  };

  const fieldClass = (name: string) =>
    cn(
      "transition-colors",
      touched[name] &&
      errors[name] &&
      "border-destructive focus-visible:ring-destructive",
    );

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">
        Log in to your account
      </h1>
      <p className="text-muted-foreground text-center text-sm mb-8">
        Don’t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary hover:underline font-medium"
        >
          Sign up
        </Link>
      </p>

      {verifiedMessage && (
        <p className="text-sm text-green-600 dark:text-green-400 text-center mb-4 rounded-md bg-green-500/10 border border-green-500/20 py-2 px-3" role="status">
          Your email is verified. You can log in now.
        </p>
      )}

      {expiredMessage && (
        <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-4 rounded-md bg-amber-500/10 border border-amber-500/20 py-2 px-3" role="status">
          Your session has expired. Please log in again.
        </p>
      )}

      {submitError && !isEmailNotVerified && (
        <p className="text-sm text-destructive text-center mb-4 rounded-lg bg-destructive/10 border border-destructive/20 py-2.5 px-3" role="alert">
          {typeof submitError === "string" ? submitError : submitError.message}
        </p>
      )}

      {isEmailNotVerified && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-4 space-y-4" role="alert">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Verify your email
            </p>
            <p className="text-sm text-muted-foreground">
              Your account exists but your email isn’t verified yet. We sent a verification link to <span className="font-medium text-foreground">{email || "your email"}</span>. Open it to sign in, or resend if you didn’t get it.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full font-medium"
              onClick={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending…" : "Resend verification email"}
            </Button>
            {resendSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400 text-center">
                Sent. Check your inbox and spam.
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={fieldClass("email")}
            autoComplete="email"
            aria-required
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={
              touched.email && errors.email ? "email-error" : undefined
            }
          />
          {touched.email && errors.email && (
            <p
              id="email-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={cn(fieldClass("password"), "pr-10")}
              autoComplete="current-password"
              aria-required
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={
                touched.password && errors.password ? "password-error" : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {touched.password && errors.password && (
            <p
              id="password-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.password}
            </p>
          )}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold"
          disabled={submitting}
        >
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center p-8">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

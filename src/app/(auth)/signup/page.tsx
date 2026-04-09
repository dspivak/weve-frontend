"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { signup as signupApi, resendVerification } from "@/lib/api";
import { PasswordStrength, isStrongPassword } from "@/components/auth/PasswordStrength";
import { Eye, EyeOff } from "lucide-react";

type FieldErrors = Record<string, string | undefined>;

function validateSignup(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  zipCode: string;
  terms: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.firstName.trim()) errors.firstName = "First name is required.";
  if (!data.lastName.trim()) errors.lastName = "Last name is required.";
  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!data.password) {
    errors.password = "Password is required.";
  } else if (!isStrongPassword(data.password)) {
    errors.password = "Password must meet all requirements below.";
  }
  if (!data.zipCode.trim()) {
    errors.zipCode = "Zip code is required.";
  } else if (!/^\d{5}(-\d{4})?$/.test(data.zipCode.replace(/\s/g, ""))) {
    errors.zipCode = "Please enter a valid US zip code.";
  }
  if (!data.terms) errors.terms = "You must agree to the Terms & Conditions.";
  return errors;
}

function deriveUsername(email: string): string {
  const part = email.slice(0, email.indexOf("@")).replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 30);
  return part || "user";
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nextErrors = validateSignup({
      firstName,
      lastName,
      email,
      password,
      zipCode,
      terms,
    });
    setErrors(nextErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      zipCode: true,
      terms: true,
    });
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signupApi({
        email,
        password,
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        username: deriveUsername(email),
        zip_code: zipCode.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setSignupSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (name: string) =>
    cn(
      "transition-colors",
      touched[name] && errors[name] && "border-destructive focus-visible:ring-destructive"
    );

  if (signupSuccess) {
    const handleResend = async () => {
      if (!email.trim() || resendLoading) return;
      setResendMessage(null);
      setResendLoading(true);
      try {
        await resendVerification(email.trim());
        setResendMessage("Verification email sent. Check your inbox.");
      } catch {
        setResendMessage("Could not send. Try again in a few minutes.");
      } finally {
        setResendLoading(false);
      }
    };

    return (
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Check your email
        </h1>
        <p className="text-muted-foreground">
          Please check your email and verify your account. After verifying, you can log in below.
        </p>
        <Button asChild className="w-full h-11 text-base font-semibold">
          <Link href="/login">Go to login</Link>
        </Button>
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
          {resendMessage && (
            <p className={cn("text-sm", resendMessage.startsWith("Verification") ? "text-green-600 dark:text-green-400" : "text-destructive")} role="alert">
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">
        Create your account
      </h1>
      <p className="text-muted-foreground text-center text-sm mb-8">
        Join us today. Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary hover:underline font-medium"
        >
          Log in
        </Link>
      </p>

      {submitError && (
        <p className="text-sm text-destructive text-center mb-4" role="alert">
          {submitError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
              className={fieldClass("firstName")}
              autoComplete="given-name"
              aria-required
              aria-invalid={touched.firstName && !!errors.firstName}
              aria-describedby={touched.firstName && errors.firstName ? "firstName-error" : undefined}
            />
            {touched.firstName && errors.firstName && (
              <p id="firstName-error" className="text-sm text-destructive" role="alert">
                {errors.firstName}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
              className={fieldClass("lastName")}
              autoComplete="family-name"
              aria-required
              aria-invalid={touched.lastName && !!errors.lastName}
              aria-describedby={touched.lastName && errors.lastName ? "lastName-error" : undefined}
            />
            {touched.lastName && errors.lastName && (
              <p id="lastName-error" className="text-sm text-destructive" role="alert">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

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
            aria-describedby={touched.email && errors.email ? "email-error" : undefined}
          />
          {touched.email && errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
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
              placeholder="At least 8 characters, uppercase, number, special character"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={cn(fieldClass("password"), "pr-10")}
              autoComplete="new-password"
              aria-required
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={touched.password && errors.password ? "password-error" : "password-rules"}
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
          <PasswordStrength password={password} id="password-rules" />
          {touched.password && errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">
            Zip code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="zipCode"
            type="text"
            inputMode="numeric"
            placeholder="12345 or 12345-6789"
            value={zipCode}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 9);
              setZipCode(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v);
            }}
            onBlur={() => setTouched((t) => ({ ...t, zipCode: true }))}
            className={fieldClass("zipCode")}
            autoComplete="postal-code"
            aria-required
            aria-invalid={touched.zipCode && !!errors.zipCode}
            aria-describedby={touched.zipCode && errors.zipCode ? "zipCode-error" : undefined}
          />
          {touched.zipCode && errors.zipCode && (
            <p id="zipCode-error" className="text-sm text-destructive" role="alert">
              {errors.zipCode}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="transition-colors"
            autoComplete="tel"
            aria-describedby="phone-optional"
          />
          <p id="phone-optional" className="text-xs text-muted-foreground">
            Optional. We may use this to verify your account.
          </p>
        </div>

        <div className="space-y-3">
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 transition-colors",
              touched.terms && errors.terms ? "border-destructive" : "border-input"
            )}
          >
            <Checkbox
              id="terms"
              checked={terms}
              onCheckedChange={(checked) => {
                setTerms(checked === true);
                setTouched((t) => ({ ...t, terms: true }));
              }}
              aria-required
              aria-invalid={touched.terms && !!errors.terms}
              aria-describedby={touched.terms && errors.terms ? "terms-error" : undefined}
              className="mt-0.5"
            />
            <Label
              htmlFor="terms"
              className="text-sm font-normal cursor-pointer leading-relaxed text-foreground"
            >
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms &amp; Conditions
              </Link>{" "}
              <span className="text-destructive">*</span>
            </Label>
          </div>
          {touched.terms && errors.terms && (
            <p id="terms-error" className="text-sm text-destructive" role="alert">
              {errors.terms}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold"
          disabled={submitting}
        >
          {submitting ? "Signing up…" : "Sign up"}
        </Button>
      </form>
    </div>
  );
}

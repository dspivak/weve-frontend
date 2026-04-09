"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Contains number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "Contains special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function checkPasswordStrength(password: string): Record<string, boolean> {
  return PASSWORD_RULES.reduce(
    (acc, rule) => ({ ...acc, [rule.id]: rule.test(password) }),
    {} as Record<string, boolean>
  );
}

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

type PasswordStrengthProps = {
  password: string;
  className?: string;
  id?: string;
};

export function PasswordStrength({ password, className, id }: PasswordStrengthProps) {
  return (
    <ul id={id} className={cn("mt-2 space-y-1.5", className)} aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

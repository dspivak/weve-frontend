import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "default" | "lg";
  }
>(({ className, src, alt = "", fallback, size = "default", ...props }, ref) => {
  const sizeClass =
    size === "sm"
      ? "size-8 text-xs"
      : size === "lg"
        ? "size-12 text-base"
        : "size-10 text-sm";
  const initials =
    (fallback?.trim().length ?? 0) > 0
      ? fallback!
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "?";

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground font-medium",
        sizeClass,
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 48px) 48px, 96px"
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  );
});
Avatar.displayName = "Avatar";

export { Avatar };

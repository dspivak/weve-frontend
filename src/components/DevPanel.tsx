"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { setupConsoleInterception, getConsoleLogs } from "@/lib/devConsole";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from "@/lib/api";

const DEV_LINKS = [
  { href: "/dashboard", label: "Feed" },
  { href: "/dashboard/new-pf", label: "New PF" },
  { href: "/dashboard/flowchart", label: "Flowchart ✦" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/chat", label: "Chat" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Signup" },
];

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Start intercepting console as early as possible
  useEffect(() => {
    setupConsoleInterception();
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const copyDebug = () => {
    const localStorage_snapshot: Record<string, unknown> = {};
    try {
      for (const key of [TOKEN_STORAGE_KEY, USER_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY]) {
        const val = window.localStorage.getItem(key);
        localStorage_snapshot[key] = val ? "(present)" : null;
      }
    } catch {}

    const debugInfo = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pathname,
      userAgent: navigator.userAgent,
      localStorage: localStorage_snapshot,
      consoleLogs: getConsoleLogs().map(e => ({
        level: e.level,
        timestamp: e.timestamp,
        message: e.args
          .map(a => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" "),
      })),
    };

    navigator.clipboard
      .writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <div ref={panelRef} style={{ position: "fixed", bottom: 8, right: 8, zIndex: 9999 }}>
      {/* Badge */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? "#ca8a04" : "#78350f",
          color: "#fef08a",
          border: "1px solid #ca8a04",
          borderRadius: 6,
          padding: "3px 10px",
          fontSize: 11,
          fontFamily: "monospace",
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.05em",
        }}
      >
        DEV
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            right: 0,
            background: "rgba(24, 24, 27, 0.97)",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            padding: "10px 0",
            minWidth: 180,
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          {/* Nav links */}
          <div style={{ padding: "0 8px 8px", borderBottom: "1px solid #3f3f46" }}>
            {DEV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "5px 8px",
                  borderRadius: 4,
                  color: pathname === href ? "#fef08a" : "#a1a1aa",
                  background: pathname === href ? "rgba(202,138,4,0.15)" : "transparent",
                  textDecoration: "none",
                  fontWeight: pathname === href ? 600 : 400,
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Debug copy */}
          <div style={{ padding: "8px 8px 0" }}>
            <button
              onClick={copyDebug}
              style={{
                display: "block",
                width: "100%",
                padding: "5px 8px",
                borderRadius: 4,
                background: copied ? "#065f46" : "transparent",
                color: copied ? "#6ee7b7" : "#a1a1aa",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "monospace",
                textAlign: "left",
              }}
            >
              {copied ? "✓ Copied to clipboard" : "Copy debug info"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

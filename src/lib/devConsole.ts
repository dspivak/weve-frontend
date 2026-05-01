"use client";

// Module-level console interceptor.
// Import this module early (e.g. in DevPanel) to start capturing from first render.
// Works by replacing console.log/warn/error/info with wrappers that buffer entries.

export interface ConsoleEntry {
  level: "log" | "warn" | "error" | "info";
  args: unknown[];
  timestamp: string;
}

const MAX_ENTRIES = 200;
const _buffer: ConsoleEntry[] = [];
let _intercepting = false;

export function setupConsoleInterception(): void {
  if (typeof window === "undefined" || _intercepting) return;
  _intercepting = true;

  const original = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
  };

  const wrap = (level: ConsoleEntry["level"]) =>
    (...args: unknown[]) => {
      _buffer.push({ level, args, timestamp: new Date().toISOString() });
      if (_buffer.length > MAX_ENTRIES) _buffer.shift();
      original[level](...args);
    };

  console.log = wrap("log");
  console.warn = wrap("warn");
  console.error = wrap("error");
  console.info = wrap("info");
}

export function getConsoleLogs(): ConsoleEntry[] {
  return [..._buffer];
}

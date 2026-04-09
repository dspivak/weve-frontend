"use client";

import { useState, useEffect } from "react";

// ---------- Types & config ----------
type SceneId =
  | "dashboard"
  | "new-pf"
  | "pf-engine"
  | "marketplace"
  | "mkt-detail"
  | "messages"
  | "profile"
  | "end";

const SCENES: { id: SceneId; duration: number; url: string }[] = [
  { id: "dashboard", duration: 5000, url: "joinweve.com/dashboard" },
  { id: "new-pf", duration: 5000, url: "joinweve.com/new" },
  {
    id: "pf-engine",
    duration: 6000,
    url: "joinweve.com/pf/community-solar-plan",
  },
  { id: "marketplace", duration: 5000, url: "joinweve.com/marketplace" },
  {
    id: "mkt-detail",
    duration: 4500,
    url: "joinweve.com/marketplace/climate-tech-startup",
  },
  { id: "messages", duration: 5500, url: "joinweve.com/messages" },
  { id: "profile", duration: 4500, url: "joinweve.com/member/elena_r" },
  { id: "end", duration: 3500, url: "joinweve.com/dashboard" },
];

const SIDEBAR_ACTIVE: Record<SceneId, string> = {
  dashboard: "Home",
  "new-pf": "New PF",
  "pf-engine": "New PF",
  marketplace: "Marketplace",
  "mkt-detail": "Marketplace",
  messages: "Messages",
  profile: "",
  end: "Home",
};

// ---------- Hooks ----------
function useTypewriter(text: string, isActive: boolean, speed = 50, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!isActive) {
      setDisplayed("");
      return;
    }
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayed(text.slice(0, i));
          i++;
        } else clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, isActive, speed, delay]);
  return displayed;
}

function useAutoScroll(isActive: boolean, amount = 150, delay = 1200) {
  const [y, setY] = useState(0);
  useEffect(() => {
    if (!isActive) {
      setY(0);
      return;
    }
    const t = setTimeout(() => setY(amount), delay);
    return () => clearTimeout(t);
  }, [isActive, amount, delay]);
  return y;
}

// ---------- Sidebar ----------
function Sidebar({ active }: { active: string }) {
  const navItems = [
    {
      d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      label: "Home",
    },
    { d: "M12 4v16m8-8H4", label: "New PF" },
    { d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", label: "Marketplace" },
    {
      d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      label: "Messages",
    },
  ];
  return (
    <aside className="flex w-[180px] shrink-0 flex-col border-r border-[#1e2633] bg-[#080c14]">
      <div className="p-3">
        <div className="flex items-center gap-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            W
          </div>
          <span
            className="ml-2 text-sm font-bold text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Weve
          </span>
        </div>
        <nav className="mt-4 space-y-0.5">
          {navItems.map(({ d, label }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 rounded-md px-2 py-2 text-xs ${active === label ? "bg-blue-500/10 font-medium text-blue-500" : "text-[#4b5563]"}`}
            >
              <svg
                className="size-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
              {label}
            </div>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-[#1e2633] px-2.5 py-2.5">
        <div className="mb-1.5 pl-2 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
          My PFs
        </div>
        <div className="rounded px-2 py-1 text-[11px] text-[#4b5563]">
          Community Solar Plan
        </div>
        <div className="rounded px-2 py-1 text-[11px] text-[#4b5563]">
          Bike Share Network
        </div>
      </div>
    </aside>
  );
}

function Tag({ label, color = "#3b82f6" }: { label: string; color?: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: `${color}15`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

export function WalkthroughPanel() {
  const [idx, setIdx] = useState(0);
  const scene = SCENES[idx];
  const is = (s: SceneId) => scene.id === s;

  // Auto-advance to next scene
  useEffect(() => {
    const t = setTimeout(
      () => setIdx((i) => (i < SCENES.length - 1 ? i + 1 : 0)),
      scene.duration,
    );
    return () => clearTimeout(t);
  }, [idx, scene.duration]);

  // Typewriters (only active when that scene is showing)
  const pfTitle = useTypewriter(
    "Community Solar Plan for 50 Homes",
    is("new-pf"),
    45,
    800,
  );
  const aiReply = useTypewriter(
    "A community solar project for 50 homes — ambitious! What's your biggest concern: funding, permits, or getting neighbors on board?",
    is("pf-engine"),
    30,
    1200,
  );
  const msgReply = useTypewriter(
    "Thanks! Let's brainstorm the neighbor outreach strategy.",
    is("messages"),
    40,
    2200,
  );

  // Auto-scroll for dashboard, marketplace, profile
  const dashScroll = useAutoScroll(is("dashboard"), 150, 1200);
  const mktScroll = useAutoScroll(is("marketplace"), 180, 1200);
  const profileScroll = useAutoScroll(is("profile"), 130, 1500);

  const sidebarActive = SIDEBAR_ACTIVE[scene.id];

  return (
    <div className="flex h-full min-h-[420px] w-full flex-1 flex-col rounded-xl border border-[#1e2633] bg-[#0d1117] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Browser chrome */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#1e2633] bg-[#080c14] px-3 py-2">
        <div className="size-2.5 rounded-full bg-[#ff5f57]" />
        <div className="size-2.5 rounded-full bg-[#febc2e]" />
        <div className="size-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#131a27] px-3 py-1">
          <svg
            className="size-2.5 text-[#4b5563]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span className="text-[10px] text-[#4b5563] font-mono">
            {scene.url}
          </span>
        </div>
      </div>

      {/* Scene content */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden text-[#e5e7eb]">
        <div
          key={scene.id}
          className="absolute inset-0 flex opacity-100 transition-opacity duration-300"
        >
          {/* Dashboard */}
          {is("dashboard") && (
            <>
              <Sidebar active={sidebarActive} />
              <div className="flex-1 overflow-hidden">
                <div
                  className="p-4 transition-transform duration-500 ease-out"
                  style={{ transform: `translateY(-${dashScroll}px)` }}
                >
                  <h3
                    className="mb-4 text-[1.05rem] font-semibold text-white"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Welcome back, Alexis
                  </h3>
                  <div className="mb-3 rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-3">
                    <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-blue-500">
                      <span>Continue Where You Left Off</span>
                      <span className="text-[#6b7280]">2h ago</span>
                    </div>
                    <div className="mb-1 font-semibold text-white">
                      Community Solar Plan
                    </div>
                    <p className="mb-2 text-[11px] text-[#9ca3af] leading-snug">
                      &quot;Classic collective action problem! Here&apos;s a
                      plausible path...&quot;
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded bg-[#1f2937]">
                        <div className="h-full w-[35%] rounded bg-gradient-to-r from-blue-500 to-purple-500" />
                      </div>
                      <span className="text-[10px] text-[#6b7280]">35%</span>
                    </div>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {["Browse Marketplace", "Messages"].map((l) => (
                      <div
                        key={l}
                        className="rounded-lg border border-[#1f2937] bg-[#111827] px-3 py-2.5 text-center text-xs font-medium text-white"
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-[#1e2633] bg-[#111827] p-3">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
                        Your Saves
                      </div>
                      <div className="text-xl font-bold text-purple-500">3</div>
                    </div>
                    <div className="rounded-lg border border-[#1e2633] bg-[#111827] p-3">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
                        Recent Activity
                      </div>
                      <div className="flex justify-between text-[10px] text-[#6b7280]">
                        <span>Published &quot;Community Solar&quot;</span>
                        <span className="text-[#374151]">2h</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#6b7280]">
                        <span>New save on your PF</span>
                        <span className="text-[#374151]">5h</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#1e2633] bg-[#111827] p-3">
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
                      Recommended for You
                    </div>
                    <div className="flex justify-between items-center border-b border-[#1e2633] py-1.5">
                      <div>
                        <div className="text-xs font-medium text-[#e5e7eb]">
                          Climate Tech Startup Roadmap
                        </div>
                        <div className="text-[10px] text-[#374151]">
                          by @sarah_k
                        </div>
                      </div>
                      <Tag label="Business" />
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <div>
                        <div className="text-xs font-medium text-[#e5e7eb]">
                          Cooperative Housing Model
                        </div>
                        <div className="text-[10px] text-[#374151]">
                          by @marcus_j
                        </div>
                      </div>
                      <Tag label="Community" color="#f59e0b" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* New PF */}
          {is("new-pf") && (
            <>
              <Sidebar active={sidebarActive} />
              <div className="flex flex-1 flex-col items-center justify-center p-5">
                <div className="w-full max-w-[480px] text-center">
                  <h3
                    className="mb-3.5 text-lg font-semibold text-white sm:text-xl"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    What future do you want to build?
                  </h3>
                  <div className="rounded-lg border border-[#1e2633] bg-[#111827] px-4 py-3 text-left">
                    <span
                      className={pfTitle ? "text-[#e5e7eb]" : "text-[#374151]"}
                      style={{ fontSize: "0.875rem" }}
                    >
                      {pfTitle || "Describe your idea..."}
                    </span>
                    <span className="animate-pulse text-blue-500">|</span>
                  </div>
                  {pfTitle.length > 30 && (
                    <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="size-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        <span className="text-xs text-blue-500">
                          Starting PF Engine...
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6b7280]">
                        The AI will guide you through building your plausible
                        fiction
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* PF Engine */}
          {is("pf-engine") && (
            <>
              <Sidebar active={sidebarActive} />
              <div className="flex flex-1 flex-col border-r border-[#1e2633]">
                <div className="flex items-center gap-1.5 border-b border-[#1e2633] px-4 py-2 text-[11px] font-semibold text-[#e5e7eb]">
                  <div className="size-1.5 rounded-full bg-emerald-500" />{" "}
                  Conversation
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-[10px] font-bold text-white">
                      PF
                    </div>
                    <div className="max-w-[80%] rounded-lg rounded-tl-sm border border-[#1e2633] bg-[#111827] px-3 py-2 text-[11px] text-[#d1d5db] leading-relaxed">
                      Tell me about the future you&apos;d like to build.
                      What&apos;s the goal?
                    </div>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1e2633] text-[10px] font-bold text-white">
                      AS
                    </div>
                    <div className="max-w-[80%] rounded-lg rounded-tr-sm border border-blue-500/15 bg-blue-500/10 px-3 py-2 text-[11px] text-[#d1d5db] leading-relaxed">
                      I want to create a community solar project for my
                      neighborhood. About 50 homes sharing a solar installation.
                    </div>
                  </div>
                  {aiReply && (
                    <div className="flex gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-[10px] font-bold text-white">
                        PF
                      </div>
                      <div className="max-w-[80%] rounded-lg rounded-tl-sm border border-[#1e2633] bg-[#111827] px-3 py-2 text-[11px] text-[#d1d5db] leading-relaxed">
                        {aiReply}
                        <span className="animate-pulse text-blue-500">|</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 border-t border-[#1e2633] px-4 py-2">
                  <div className="flex-1 rounded-lg border border-[#1e2633] bg-[#111827] px-3 py-2 text-[11px] text-[#374151]">
                    Type your response...
                  </div>
                  <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-[11px] font-medium text-white">
                    Send
                  </div>
                </div>
              </div>
              <div className="w-[200px] shrink-0 flex flex-col bg-[#080c14]">
                <div className="border-b border-[#1e2633] px-3 py-2 text-[11px] font-semibold text-[#e5e7eb]">
                  Your Story
                </div>
                <div className="flex-1 p-3">
                  <h4 className="mb-1.5 text-[13px] font-semibold text-[#e5e7eb]">
                    Community Solar Plan
                  </h4>
                  <p className="mb-3 text-[10px] text-[#6b7280] leading-snug">
                    A community solar installation serving 50 homes, structured
                    as a cooperative...
                  </p>
                  <div className="border-t border-[#1e2633] pt-2">
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
                      Key Tasks
                    </div>
                    {[
                      "Form founding group",
                      "Research permitting",
                      "Get installer quotes",
                      "Draft co-op agreement",
                    ].map((task, i) => (
                      <div
                        key={i}
                        className="mb-1.5 flex items-center gap-1.5 text-[10px] text-[#9ca3af]"
                      >
                        <div className="flex size-3.5 shrink-0 items-center justify-center rounded border border-[#1e2633] bg-[#111827] text-[8px] text-[#374151]">
                          {i + 1}
                        </div>
                        {task}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Marketplace */}
          {is("marketplace") && (
            <>
              <Sidebar active={sidebarActive} />
              <div className="flex-1 overflow-hidden">
                <div
                  className="p-4 transition-transform duration-500 ease-out"
                  style={{ transform: `translateY(-${mktScroll}px)` }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3
                      className="text-[1.05rem] font-semibold text-white"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Marketplace
                    </h3>
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#1e2633] bg-[#111827] px-3 py-1.5 text-[11px] text-[#374151]">
                      <svg
                        className="size-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      Search...
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                      Gaps to Fill{" "}
                      <span className="rounded-full bg-[#1f2937] px-1.5 py-0.5 text-[10px] font-normal text-[#9ca3af]">
                        8
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[
                        {
                          g: "Structural analysis on flood barriers",
                          a: "elena_r",
                          c: "$500",
                          cat: "Sustainability",
                        },
                        {
                          g: "Developer for privacy protocols",
                          a: "marcus_j",
                          c: "UI exchange",
                          cat: "Technology",
                        },
                      ].map(({ g, a, c, cat }) => (
                        <div
                          key={g}
                          className="min-w-[200px] shrink-0 rounded-lg border border-[#1e2633] bg-[#111827] p-2.5"
                        >
                          <span
                            className={`rounded px-1 py-0.5 text-[10px] text-white ${cat === "Sustainability" ? "bg-green-900" : "bg-indigo-900"}`}
                          >
                            {cat}
                          </span>
                          <p className="mt-1 text-[10px] text-white line-clamp-2">
                            &quot;{g}&quot;
                          </p>
                          <div className="mt-1 flex justify-between text-[10px] text-[#6b7280]">
                            <span>@{a}</span>
                            <span className="font-medium text-emerald-500">
                              {c}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3 flex gap-1">
                    {["All", "Open", "Fork Only", "Trending"].map((tab, i) => (
                      <div
                        key={tab}
                        className={`rounded-full px-3 py-1 text-[10px] ${i === 0 ? "bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold text-white" : "border border-[#1e2633] text-[#6b7280]"}`}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        t: "Climate Tech Startup Roadmap",
                        a: "sarah_k",
                        cat: "Business",
                        cc: "bg-blue-900/80",
                        ty: "Open",
                      },
                      {
                        t: "Community Solar Project",
                        a: "alex_m",
                        cat: "Sustainability",
                        cc: "bg-green-900/80",
                        ty: "Open",
                      },
                      {
                        t: "Universal Basic AI",
                        a: "marcus_j",
                        cat: "Technology",
                        cc: "bg-indigo-900/80",
                        ty: "Trending",
                      },
                      {
                        t: "Cooperative Housing Model",
                        a: "elena_r",
                        cat: "Community",
                        cc: "bg-amber-900/80",
                        ty: "Fork Only",
                      },
                    ].map(({ t, a, cat, cc, ty }) => (
                      <div
                        key={t}
                        className="overflow-hidden rounded-lg border border-[#1e2633] bg-[#111827]"
                      >
                        <div className={`relative h-12 ${cc}`}>
                          <span className="absolute left-1 top-1 rounded px-1 text-[9px] text-white">
                            {cat}
                          </span>
                          <span
                            className={`absolute right-1 top-1 rounded px-1 text-[9px] text-white ${ty === "Open" ? "bg-blue-500" : ty === "Trending" ? "bg-amber-500" : "bg-gray-500"}`}
                          >
                            {ty}
                          </span>
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-semibold text-[#e5e7eb]">
                            {t}
                          </div>
                          <div className="text-[10px] text-blue-500">@{a}</div>
                          <div className="mt-1 flex items-center gap-1 border-t border-[#1f2937] pt-1 text-[10px] text-[#6b7280]">
                            <svg
                              className="size-2.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M5 2h14v18l-7-4-7 4V2z" />
                            </svg>
                            47
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Marketplace detail */}
          {is("mkt-detail") && (
            <>
              <Sidebar active={sidebarActive} />
              <div className="flex-1 p-4">
                <div className="mb-3 text-[10px] text-[#4b5563]">
                  Marketplace /{" "}
                  <span className="text-[#e5e7eb]">
                    Climate Tech Startup Roadmap
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <span className="rounded bg-blue-900/80 px-1.5 py-0.5 text-[10px] text-white">
                      Business
                    </span>
                    <h3
                      className="mt-2 text-lg font-semibold text-white"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Climate Tech Startup Roadmap
                    </h3>
                    <div className="mb-3 text-[11px] text-blue-500">
                      by @sarah_k
                    </div>
                    <p className="mb-3 text-[11px] text-[#9ca3af] leading-relaxed">
                      A comprehensive roadmap for launching a climate technology
                      startup, from initial research through Series A funding.
                    </p>
                    <div className="border-t border-[#1e2633] pt-3">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
                        Key Tasks (6)
                      </div>
                      {[
                        "Market analysis & validation",
                        "Assemble founding team",
                        "Regulatory compliance",
                        "Build MVP prototype",
                      ].map((t, i) => (
                        <div
                          key={i}
                          className="mb-1 flex items-center gap-2 text-[10px] text-[#9ca3af]"
                        >
                          <div className="flex size-3.5 shrink-0 items-center justify-center rounded border border-[#1e2633] bg-[#111827] text-[8px] text-[#374151]">
                            {i + 1}
                          </div>
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-[180px] shrink-0">
                    <div className="mb-2 rounded-lg border border-[#1e2633] bg-[#111827] p-3">
                      <div className="flex justify-around text-center">
                        <div>
                          <div className="text-sm font-bold text-white">47</div>
                          <div className="text-[9px] text-[#6b7280]">Saves</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">12</div>
                          <div className="text-[9px] text-[#6b7280]">Forks</div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 py-2.5 text-center text-sm font-semibold text-white">
                      Fork this PF
                    </div>
                    <div className="rounded-lg border border-blue-500/30 py-2.5 text-center text-sm font-medium text-blue-500">
                      Request to Collaborate
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Messages */}
          {is("messages") && (
            <>
              <Sidebar active={sidebarActive} />
              <div className="w-[180px] shrink-0 border-r border-[#1e2633] bg-[#080c14]">
                <div className="border-b border-[#1e2633] px-3 py-2 text-[11px] font-semibold text-[#e5e7eb]">
                  Messages
                </div>
                {[
                  {
                    n: "Elena Rodriguez",
                    m: "That sounds great! Let's do it",
                    u: true,
                  },
                  {
                    n: "Marcus Johnson",
                    m: "Thanks for the feedback",
                    u: false,
                  },
                ].map(({ n, m, u }) => (
                  <div
                    key={n}
                    className={`flex gap-2 border-b border-[#1e2633] px-3 py-2 ${u ? "bg-blue-500/5" : ""}`}
                  >
                    <div className="size-7 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-semibold text-white">
                      ER
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-[10px] ${u ? "font-semibold text-white" : "text-[#9ca3af]"}`}
                      >
                        {n}
                      </div>
                      <div className="truncate text-[9px] text-[#6b7280]">
                        {m}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-[#1e2633] px-4 py-2">
                  <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-semibold text-white">
                    ER
                  </div>
                  <span className="text-sm font-medium text-[#e5e7eb]">
                    Elena Rodriguez
                  </span>
                  <span className="text-[9px] text-emerald-500">online</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {[
                    {
                      f: "elena",
                      t: "Hey! I saw your Community Solar Plan. Really interesting approach.",
                    },
                    {
                      f: "me",
                      t: "Thanks! The hardest part is the neighbor outreach.",
                    },
                    {
                      f: "elena",
                      t: "I run a logistics company — I know about coordinating people. Want to brainstorm?",
                    },
                    { f: "me", t: "Absolutely! That would be really helpful." },
                    { f: "elena", t: "That sounds great! Let's do it" },
                  ].map(({ f, t }, i) => (
                    <div
                      key={i}
                      className={`flex ${f === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-1.5 text-[10px] leading-relaxed ${f === "me" ? "rounded-tr-sm border border-blue-500/20 bg-blue-500/10 text-[#d1d5db]" : "rounded-tl-sm border border-[#1e2633] bg-[#111827] text-[#d1d5db]"}`}
                      >
                        {t}
                      </div>
                    </div>
                  ))}
                  {msgReply && (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-lg rounded-tr-sm border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] text-[#d1d5db] leading-relaxed">
                        {msgReply}
                        <span className="animate-pulse text-blue-500">|</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 border-t border-[#1e2633] px-4 py-2">
                  <div className="flex-1 rounded-lg border border-[#1e2633] bg-[#111827] px-3 py-2 text-[10px] text-[#374151]">
                    {msgReply ? msgReply : "Type a message..."}
                  </div>
                  <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-[10px] font-medium text-white">
                    Send
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Profile */}
          {is("profile") && (
            <>
              <Sidebar active={sidebarActive} />
              <div className="flex-1 overflow-hidden">
                <div
                  className="p-4 transition-transform duration-500 ease-out"
                  style={{ transform: `translateY(-${profileScroll}px)` }}
                >
                  <div className="mb-4 flex gap-3">
                    <div className="size-14 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-semibold text-white">
                      ER
                    </div>
                    <div>
                      <h3
                        className="text-[1.05rem] font-semibold text-white"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Elena Rodriguez
                      </h3>
                      <div className="mb-1.5 text-[10px] text-[#374151]">
                        @elena_r · Joined September 2025
                      </div>
                      <p className="text-[10px] text-[#6b7280] leading-snug">
                        I run a logistics company, about 15 people. My daughter
                        and I paint together on weekends...
                      </p>
                    </div>
                  </div>
                  <div className="mb-4 space-y-2">
                    <div>
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
                        Interests
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {["Art", "Gardening", "Teaching", "Cooking"].map(
                          (it) => (
                            <Tag key={it} label={it} color="#8b5cf6" />
                          ),
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
                        Skills & Resources
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {["Languages", "Education"].map((it) => (
                          <Tag key={it} label={it} color="#10b981" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#1e2633] pt-3">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#374151]">
                      Published PFs (7)
                    </div>
                    <div className="flex justify-between items-center border-b border-[#1e2633] py-1.5">
                      <span className="text-[11px] text-[#e5e7eb]">
                        Climate Resilient Cities 2050
                      </span>
                      <Tag label="Sustainability" color="#10b981" />
                    </div>
                    <div className="flex justify-between items-center border-b border-[#1e2633] py-1.5">
                      <span className="text-[11px] text-[#e5e7eb]">
                        Cooperative Housing Model
                      </span>
                      <Tag label="Community" color="#f59e0b" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* End */}
          {is("end") && (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600">
                <svg
                  className="size-7 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3
                className="mb-1.5 text-xl font-semibold text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                POC Walkthrough Complete
              </h3>
              <p className="text-sm text-[#6b7280]">
                You&apos;ve seen the full Plausible Fiction experience
              </p>
              <p className="text-[11px] text-[#374151]">
                Restarting in a moment...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

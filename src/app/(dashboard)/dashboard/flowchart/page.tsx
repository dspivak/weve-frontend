"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────

type ConversationMessage = { role: "user" | "assistant"; content: string };

type RealtimeTask = {
  id: string;
  label: string;
  parentId: string | null;
  outcomes?: Array<{ id: string; label: string; likelihood?: number }>;
  plausibility?: "high" | "medium" | "low";
};

type RealtimeFlowchart = {
  goal: string | null;
  tasks: RealtimeTask[];
  valueCurrency?: string | null;
};

function createEmpty(): RealtimeFlowchart {
  return { goal: null, tasks: [] };
}

// Apply LLM operations to the local flowchart (mirrors realtimeFlowchart.js)
function applyOps(fc: RealtimeFlowchart, ops: unknown[]): RealtimeFlowchart {
  if (!ops || ops.length === 0) return fc;
  // Dynamically import is unavailable at top-level in TS; use a copy of the logic
  let result = { ...fc, tasks: [...fc.tasks] };
  for (const op of ops as Array<Record<string, unknown>>) {
    switch (op.op) {
      case "setGoal":
        result = { ...result, goal: op.label as string };
        break;
      case "addTask": {
        const existing = result.tasks.find((t) => t.id === op.id);
        if (!existing) {
          result = {
            ...result,
            tasks: [
              ...result.tasks,
              {
                id: op.id as string,
                label: op.label as string,
                parentId: (op.parentId as string | null) ?? null,
                outcomes: (op.outcomes as RealtimeTask["outcomes"]) ?? [],
              },
            ],
          };
        }
        break;
      }
      case "updateTask": {
        result = {
          ...result,
          tasks: result.tasks.map((t) =>
            t.id === op.id ? { ...t, ...(op as Record<string, unknown>) } : t,
          ),
        };
        break;
      }
      case "removeTask":
        result = { ...result, tasks: result.tasks.filter((t) => t.id !== op.id) };
        break;
      case "setTaskLikelihood": {
        result = {
          ...result,
          tasks: result.tasks.map((t) =>
            t.id === op.taskId
              ? {
                  ...t,
                  outcomes: (t.outcomes ?? []).map((o) =>
                    o.id === op.outcomeId
                      ? { ...o, likelihood: op.likelihood as number }
                      : o,
                  ),
                }
              : t,
          ),
        };
        break;
      }
      case "setValueCurrency":
        result = { ...result, valueCurrency: op.currency as string };
        break;
    }
  }
  return result;
}

// ── Tree preview ──────────────────────────────────────────────────────────

function TreeNode({
  nodeId,
  label,
  allTasks,
  depth,
  isGoal,
}: {
  nodeId: string | null;
  label: string;
  allTasks: RealtimeTask[];
  depth: number;
  isGoal: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const children =
    nodeId === null
      ? allTasks.filter((t) => t.parentId === null)
      : allTasks.filter((t) => t.parentId === nodeId);

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 4,
          padding: "3px 0",
        }}
      >
        {children.length > 0 ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#71717a",
              fontSize: 10,
              padding: 0,
              marginTop: 2,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {expanded ? "▼" : "▶"}
          </button>
        ) : (
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: isGoal ? "#a78bfa" : "#3f3f46",
              flexShrink: 0,
              marginTop: 4,
            }}
          />
        )}
        <span
          style={{
            fontSize: 12,
            color: isGoal ? "#e4e4e7" : "#a1a1aa",
            fontWeight: isGoal ? 600 : 400,
            lineHeight: "1.4",
          }}
        >
          {label}
        </span>
      </div>
      {expanded && children.length > 0 && (
        <div style={{ borderLeft: "1px solid #27272a", marginLeft: 4, paddingLeft: 8 }}>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              nodeId={child.id}
              label={child.label}
              allTasks={allTasks}
              depth={depth + 1}
              isGoal={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FlowchartPreview({ flowchart }: { flowchart: RealtimeFlowchart }) {
  const isEmpty = !flowchart.goal && flowchart.tasks.length === 0;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #27272a",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Your Story
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {isEmpty ? (
          <p style={{ fontSize: 12, color: "#52525b", lineHeight: 1.5 }}>
            Your plan will take shape here as you talk.
          </p>
        ) : (
          <>
            {flowchart.goal && (
              <TreeNode
                nodeId={null}
                label={flowchart.goal}
                allTasks={flowchart.tasks}
                depth={0}
                isGoal={true}
              />
            )}
            {!flowchart.goal && flowchart.tasks.length > 0 &&
              flowchart.tasks
                .filter((t) => t.parentId === null)
                .map((t) => (
                  <TreeNode
                    key={t.id}
                    nodeId={t.id}
                    label={t.label}
                    allTasks={flowchart.tasks}
                    depth={0}
                    isGoal={false}
                  />
                ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function FlowchartPage() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowchart, setFlowchart] = useState<RealtimeFlowchart>(createEmpty);
  const [mobilePanel, setMobilePanel] = useState<"chat" | "preview">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Re-focus after response arrives
  const prevLoading = useRef(false);
  useEffect(() => {
    if (prevLoading.current && !loading) {
      textareaRef.current?.focus();
    }
    prevLoading.current = loading;
  }, [loading]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setError(null);

    const userMsg: ConversationMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const token = getAccessToken();
      const history = [...messages, userMsg];

      const res = await fetch(`${API_BASE}/api/flowchart/converse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          current_flowchart: flowchart,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.detail === "string" ? data.detail : "Request failed",
        );
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.ai_response },
      ]);
      if (data.operations?.length) {
        setFlowchart((prev) => applyOps(prev, data.operations));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages((prev) => prev.slice(0, -1)); // remove the user message on error
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, flowchart]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen min-h-0 w-full flex-col lg:flex-row overflow-hidden">
      {/* ── Left: Conversation ─────────────────────────────── */}
      <section
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col border-r border-border bg-background",
          "lg:min-w-0",
          mobilePanel !== "chat" && "hidden lg:flex",
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-violet-400" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">
              Plausible Fiction
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-xs"
            onClick={() => setMobilePanel("preview")}
          >
            View Story
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            {isEmpty && (
              <div className="mt-8 flex flex-col items-start gap-2 px-2">
                <p className="text-base font-semibold text-foreground">
                  What do you want to build?
                </p>
                <p className="text-sm text-muted-foreground">
                  Describe a goal or project and I&rsquo;ll help you map out a
                  plausible path to achieve it.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-muted/80 px-4 py-2.5 text-sm text-foreground shadow-sm">
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-muted/80 px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} aria-hidden />
          </div>

          {/* Input */}
          <footer className="shrink-0 border-t border-border bg-background p-4">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe your plan…"
                rows={2}
                disabled={loading}
                className="min-w-0 flex-1 resize-none rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="shrink-0 self-end bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          </footer>
        </div>
      </section>

      {/* ── Right: Story preview ───────────────────────────── */}
      <aside
        className={cn(
          "flex h-full min-h-0 w-full flex-col border-border bg-card/50 lg:w-[320px] lg:shrink-0",
          mobilePanel !== "preview" && "hidden lg:flex",
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground">Your Story</span>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-xs"
            onClick={() => setMobilePanel("chat")}
          >
            Back to Chat
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <FlowchartPreview flowchart={flowchart} />
        </div>
      </aside>
    </div>
  );
}

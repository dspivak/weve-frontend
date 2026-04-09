"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generatePlausibleFiction,
  modifyPlausibleFiction,
  generatePostImage,
  createPost,
  getAccessToken,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const USER_STORAGE_KEY = "weve_user";

const INITIAL_AI_MESSAGE =
  "Tell me about the future you'd like to build. What's the goal?";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function nextId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStoredUserName(): string {
  if (typeof window === "undefined") return "You";
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return "You";
    const data = JSON.parse(raw) as { fullName?: string };
    return typeof data?.fullName === "string" ? data.fullName : "You";
  } catch {
    return "You";
  }
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

/** Parse numbered or bullet lines after "Key tasks:" into key tasks (max 6). */
function parseKeyTasks(text: string): string[] {
  const lines = text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const tasks: string[] = [];
  let afterKeyTasks = false;
  for (const line of lines) {
    if (/^key\s+tasks?\s*:?\s*$/i.test(line)) {
      afterKeyTasks = true;
      continue;
    }
    if (!afterKeyTasks) continue;
    const numberedDot = /^\d+\.\s+(.+)$/.exec(line);
    const numberedParen = /^\d+\)\s+(.+)$/.exec(line);
    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    const content =
      numberedDot?.[1] ?? numberedParen?.[1] ?? bullet?.[1] ?? null;
    if (content && content.length > 5 && content.length < 150) {
      tasks.push(content);
      if (tasks.length >= 6) break;
    }
  }
  return tasks;
}

/** Derive a short title from the generated content (or refined prompt). Prefer AI content so title matches the post. */
function deriveStoryTitle(
  refinedPrompt: string | null,
  latestContent: string | null,
): string {
  const src = latestContent ?? refinedPrompt ?? "";
  const firstLine = src.split(/\n/)[0]?.trim() ?? "";
  if (firstLine.length > 60) return firstLine.slice(0, 57) + "...";
  return firstLine || "Your story";
}

/** Story body: always use the latest AI-generated content (the actual post), not the refined prompt. */
function deriveStoryDescription(
  _refinedPrompt: string | null,
  latestContent: string | null,
): string {
  if (!latestContent)
    return "Your summary and key tasks will appear here as you talk with the AI.";
  return latestContent;
}

export default function NewPlausibleFictionPage() {
  const [inputValue, setInputValue] = useState("");
  const [activePanel, setActivePanel] = useState<"chat" | "preview">("chat");
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: INITIAL_AI_MESSAGE },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(
    null,
  );
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const latestAssistantContent =
    messages.filter((m) => m.role === "assistant").pop()?.content ?? null;
  const hasAssistantContent = Boolean(latestAssistantContent);
  const isFirstTurn = messages.filter((m) => m.role === "user").length === 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
    };
  }, [attachedImageUrl]);

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
    setAttachedImageUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsgId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed },
    ]);
    setInputValue("");

    setLoading(true);
    let contentForImage: string | null = null;
    try {
      if (isFirstTurn) {
        const res = await generatePlausibleFiction(trimmed);
        setRefinedPrompt(res.refined_prompt);
        const content = res.content ?? res.refined_prompt;
        contentForImage = content;
        const assistantId = nextId();
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content },
        ]);
      } else if (latestAssistantContent) {
        const res = await modifyPlausibleFiction(
          latestAssistantContent,
          trimmed,
        );
        contentForImage = res.content;
        const assistantId = nextId();
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: res.content },
        ]);
      }
      if (contentForImage && contentForImage.trim()) {
        setAiGeneratedImageUrl(null);
        setAiImageLoading(true);
        generatePostImage(contentForImage)
          .then((r) => setAiGeneratedImageUrl(r.image_url))
          .catch(() => setAiGeneratedImageUrl(null))
          .finally(() => setAiImageLoading(false));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, isFirstTurn, latestAssistantContent]);

  const displayName = getStoredUserName();
  const userInitials = getInitials(displayName);
  const storyTitle = deriveStoryTitle(refinedPrompt, latestAssistantContent);
  const storyDescription = deriveStoryDescription(
    refinedPrompt,
    latestAssistantContent,
  );
  const keyTasks = latestAssistantContent
    ? parseKeyTasks(latestAssistantContent)
    : [];

  return (
    <div className="flex h-full min-h-0 w-full flex-col lg:flex-row">
      {/* Left: Conversation — ~60–65% */}
      <section
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col border-r border-border bg-background",
          "lg:min-w-0 lg:max-w-[65%]",
          activePanel !== "chat" && "hidden lg:flex"
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full bg-emerald-500"
              aria-hidden
            />
            <h2 className="text-base font-semibold text-foreground">
              Conversation
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-xs font-semibold"
            onClick={() => setActivePanel("preview")}
          >
            Preview Post
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            data-chat-scroll
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
          >
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {messages.map((msg) =>
              msg.role === "user" ? (
                <div
                  key={msg.id}
                  className="flex justify-end gap-2"
                  role="listitem"
                >
                  <div className="flex max-w-[85%] flex-col items-end">
                    <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                  <Avatar
                    fallback={displayName}
                    size="default"
                    className="h-9 w-9 shrink-0"
                  />
                </div>
              ) : (
                <div
                  key={msg.id}
                  className="flex justify-start gap-2"
                  role="listitem"
                >
                  <Avatar
                    fallback="PF"
                    size="default"
                    className="h-9 w-9 shrink-0 bg-primary/20 text-primary"
                  />
                  <div className="flex max-w-[85%] flex-col">
                    <div className="rounded-2xl rounded-bl-md border border-border bg-muted/80 px-4 py-2.5 text-sm text-foreground shadow-sm">
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="flex justify-start gap-2">
                <Avatar
                  fallback="PF"
                  size="default"
                  className="h-9 w-9 shrink-0 bg-primary/20 text-primary"
                />
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-muted/80 px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Thinking…
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} aria-hidden />
          </div>

          <footer className="shrink-0 border-t border-border bg-background p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Attach image"
              onChange={handleImageAttach}
            />
            <div className="flex gap-2">
              {attachedImageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    URL.revokeObjectURL(attachedImageUrl);
                    setAttachedImageUrl(null);
                  }}
                  aria-label="Remove photo"
                >
                  <X className="size-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Add photo"
                >
                  <ImagePlus className="size-5" />
                </Button>
              )}
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your response..."
                className="min-w-0 flex-1 bg-muted/50 border-border"
                disabled={loading}
                aria-label="Your response"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !inputValue.trim()}
                className="shrink-0 bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          </footer>
        </div>
      </section>

      {/* Right: Your Story — ~35–40% */}
      <aside
        className={cn(
          "flex h-full min-h-0 w-full flex-col border-border bg-card/50 lg:w-[35%] lg:min-w-[280px] lg:max-w-[420px]",
          activePanel !== "preview" && "hidden lg:flex"
        )}
      >
        <header className="shrink-0 border-b border-border px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Your Story
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              This is the post you’ll share to the feed.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-xs font-semibold"
            onClick={() => setActivePanel("chat")}
          >
            Back to Chat
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {storyTitle}
              </h3>
            </div>

            {(aiImageLoading || aiGeneratedImageUrl) && (
              <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                {aiImageLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-sm">
                      Generating image for your story…
                    </span>
                  </div>
                ) : aiGeneratedImageUrl ? (
                  <>
                    <img
                      src={aiGeneratedImageUrl}
                      alt="AI-generated illustration for your story"
                      className="w-full max-h-64 object-cover"
                    />
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      AI-generated image from your post
                    </p>
                  </>
                ) : null}
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {storyDescription}
              </p>
            </div>

            {attachedImageUrl && (
              <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                <img
                  src={attachedImageUrl}
                  alt="Attached to your story"
                  className="w-full max-h-48 object-cover"
                />
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  Photo attached to post
                </p>
              </div>
            )}

            {(keyTasks.length > 0 || hasAssistantContent) && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Key tasks identified
                </h4>
                {keyTasks.length > 0 ? (
                  <ol className="mt-2 list-none space-y-2">
                    {keyTasks.map((task, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-foreground"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {i + 1}
                        </span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Continue the conversation to see suggested tasks.
                  </p>
                )}
              </div>
            )}

            {!hasAssistantContent && (
              <p className="text-sm text-muted-foreground">
                Your story and key tasks will appear here as you discuss your
                plan with the AI.
              </p>
            )}
          </div>
        </div>

        {/* Footer: Publish story / post */}
        <footer className="shrink-0 border-t border-border bg-card/80 p-4">
          {publishError && (
            <p className="mb-2 text-sm text-destructive" role="alert">
              {publishError}
            </p>
          )}
          <Button
            onClick={async () => {
              if (!latestAssistantContent && !refinedPrompt) {
                setPublishError(
                  "Add some content by chatting with the AI first.",
                );
                return;
              }
              setPublishError(null);
              const token = getAccessToken();
              if (!token) {
                setPublishError("You must be logged in to publish.");
                return;
              }
              const contentToPublish =
                latestAssistantContent ?? storyDescription ?? "";
              if (!contentToPublish.trim()) {
                setPublishError(
                  "Add some content by chatting with the AI first.",
                );
                return;
              }
              setPublishing(true);
              try {
                await createPost(token, {
                  title: storyTitle || null,
                  content: contentToPublish.trim(),
                  status: "published",
                  image_url:
                    aiGeneratedImageUrl || attachedImageUrl || undefined,
                });
                router.push("/dashboard");
              } catch (e) {
                setPublishError(
                  e instanceof Error
                    ? e.message
                    : "Failed to publish. Try again.",
                );
              } finally {
                setPublishing(false);
              }
            }}
            disabled={(!hasAssistantContent && !refinedPrompt) || publishing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {publishing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Publishing…
              </>
            ) : (
              "Publish story"
            )}
          </Button>
        </footer>
      </aside>
    </div>
  );
}

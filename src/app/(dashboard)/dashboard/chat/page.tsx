"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Send, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getAccessToken,
  getConversations,
  getConversationMessages,
  sendMessage,
  checkExistingConversation,
  getMe,
  getProfileByUserId,
  markConversationAsRead,
  getPost,
  type ConversationResponse,
  type MessageResponse,
  type ChatParticipant
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ChatSkeleton } from "@/components/dashboard/ChatSkeleton";
import { PostCard, type Post } from "@/components/dashboard/PostCard";
import { mapApiPostToPost } from "@/lib/postUtils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign } from "lucide-react";
import { Label } from "@/components/ui/label";

function ContributionDialog({
  isOpen,
  onOpenChange,
  recipientName,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contribute Support</DialogTitle>
          <DialogDescription>
            You are about to make a contribution to {recipientName}. Thank you for supporting their work!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center">
                <DollarSign className="size-4" />
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="10.00"
                className="pl-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-2">
            <Label htmlFor="message" className="text-right mt-2">
              Message
            </Label>
            <div className="col-span-3">
              <textarea
                id="message"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Optional message..."
              />
            </div>
          </div>
          <div className="bg-muted px-4 py-3 rounded-md text-xs text-muted-foreground mt-2">
            This is a dummy payment form. Actual payment processing will be implemented later.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onOpenChange(false)}
          >
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userIdParam = searchParams.get("user_id");
  const postIdParam = searchParams.get("post_id");

  const [myId, setMyId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(MessageResponse & { pending?: boolean })[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [pendingRecipient, setPendingRecipient] = useState<ChatParticipant | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [referencedPost, setReferencedPost] = useState<Post | null>(null);
  const [refPostLoading, setRefPostLoading] = useState(false);
  const [showContributionDialog, setShowContributionDialog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const me = await getMe(token);
        if (me) setMyId(me.id);

        const convsRes = await getConversations(token);
        setConversations(convsRes.conversations);

        // Handle query params
        if (userIdParam) {
          const check = await checkExistingConversation(token, userIdParam);
          if (check.exists && check.id) {
            setSelectedId(check.id);
          } else {
            // New conversation
            const profile = await getProfileByUserId(token, userIdParam);
            if (profile) {
              setPendingRecipient(profile);
              setSelectedId(null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to init chat:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userIdParam, router]);

  // Load messages when selection changes
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    const loadMsgs = async () => {
      const token = getAccessToken();
      if (!token) return;
      setMsgLoading(true);
      try {
        const res = await getConversationMessages(token, selectedId);
        setMessages(res.messages);
        setPendingRecipient(null);
        // Mark as read
        await markConversationAsRead(token, selectedId);
        // Optimistically clear unread count in UI
        setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, unread_count: 0 } : c));
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setMsgLoading(false);
      }
    };
    loadMsgs();
  }, [selectedId]);

  // Determine active post ID from URL or message history
  useEffect(() => {
    const newActivePostId = postIdParam || messages.find(m => m.post_id)?.post_id || null;
    if (newActivePostId !== activePostId) {
      setActivePostId(newActivePostId);
    }
  }, [postIdParam, messages, activePostId]);

  // Fetch the referenced post when activePostId changes
  useEffect(() => {
    if (!activePostId) {
      setReferencedPost(null);
      return;
    }
    const loadPost = async () => {
      const token = getAccessToken();
      if (!token) return;
      setRefPostLoading(true);
      try {
        const postRes = await getPost(token, activePostId);
        setReferencedPost(mapApiPostToPost(postRes));
      } catch (err) {
        console.error("Failed to load referenced post:", err);
      } finally {
        setRefPostLoading(false);
      }
    };
    loadPost();
  }, [activePostId]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`chat:${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageResponse;
          setMessages((prev) => {
            // If we already have the exact real message, ignore
            if (prev.find((m) => m.id === newMsg.id)) return prev;

            // If we find an optimistic 'temp' message with same content and sender, replace it instead of appending string
            const pendingIndex = prev.findIndex((m) => m.pending && m.sender_id === newMsg.sender_id && m.content === newMsg.content);
            if (pendingIndex !== -1) {
              const newArray = [...prev];
              newArray[pendingIndex] = newMsg;
              return newArray;
            }

            // Normal new message (e.g., from the friend)
            return [...prev, newMsg];
          });

          // If we are currently looking at this conversation, mark it as read immediately
          const token = getAccessToken();
          if (token) {
            markConversationAsRead(token, selectedId).catch(console.error);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          // Refresh conversation list for unread counts and last messages
          const token = getAccessToken();
          if (token) {
            getConversations(token).then(res => setConversations(res.conversations)).catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const token = getAccessToken();
    if (!token || !inputValue.trim() || !myId) return;

    const recipientId = selectedConversation?.participant.id || pendingRecipient?.id;
    if (!recipientId) return;

    const content = inputValue.trim();
    setInputValue("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: selectedId || "temp-conv",
      sender_id: myId,
      content,
      post_id: postIdParam,
      created_at: new Date().toISOString(),
      pending: true
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await sendMessage(token, {
        recipient_id: recipientId,
        content,
        post_id: postIdParam
      });

      if (!selectedId) {
        setSelectedId(res.conversation_id);
        const convsRes = await getConversations(token);
        setConversations(convsRes.conversations);
      }

      setMessages((prev) =>
        prev.map(m => m.id === tempId ? res : m)
      );
    } catch (err) {
      console.error("Failed to send:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputValue(content); // Restore on error
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedId);
  const activeParticipant = selectedConversation?.participant || pendingRecipient;

  if (loading) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col md:flex-row bg-background">
      {/* Left panel: chat list */}
      <aside
        className={cn(
          "flex h-full min-h-0 w-full flex-col border-r border-border bg-card/50 md:w-[30%] md:min-w-[260px] md:max-w-[360px]",
          (selectedId || pendingRecipient) && "hidden md:flex"
        )}
      >
        <div className="shrink-0 border-b border-border px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Messages
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your conversations
          </p>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {conversations.length === 0 && !pendingRecipient && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <MessageSquare className="mb-2 size-8 opacity-20" />
              <p className="text-sm">No messages yet.</p>
            </div>
          )}
          {conversations.map((c) => {
            const isActive = selectedId === c.id;
            return (
              <li key={c.id} className="border-b border-border/80 last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    setPendingRecipient(null);
                    // Clear URL params to prevent post_id leakage
                    router.replace("/dashboard/chat", { scroll: false });
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    isActive
                      ? "bg-primary/10 text-foreground border-l-2 border-l-primary"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <Avatar
                    fallback={c.participant.full_name}
                    size="default"
                    className="shrink-0 h-11 w-11"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          isActive || c.unread_count > 0 ? "font-semibold" : "font-medium"
                        )}
                      >
                        {c.participant.full_name}
                      </span>
                      <div className="flex items-center gap-2">
                        {c.unread_count > 0 && !isActive && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                        {c.last_at && (
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {format(new Date(c.last_at), "HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={cn(
                      "truncate text-xs mt-0.5",
                      c.unread_count > 0 && !isActive ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {c.last_message || "Start a conversation"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Right panel: conversation */}
      <section
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col bg-background",
          !selectedId && !pendingRecipient && "hidden md:flex"
        )}
      >
        {activeParticipant ? (
          <>
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                onClick={() => {
                  setSelectedId(null);
                  setPendingRecipient(null);
                }}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <Avatar
                fallback={activeParticipant.full_name}
                size="default"
                className="h-9 w-9 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {activeParticipant.full_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{activeParticipant.username}
                </p>
              </div>
              <div className="shrink-0">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium flex gap-1.5 items-center px-4"
                  onClick={() => setShowContributionDialog(true)}
                >
                  <DollarSign className="size-4" />
                  Contribute
                </Button>
              </div>
            </header>

            <ContributionDialog
              isOpen={showContributionDialog}
              onOpenChange={setShowContributionDialog}
              recipientName={activeParticipant.full_name}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
                {msgLoading && messages.length === 0 && (
                  <div className="flex-1 space-y-6 p-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex max-w-[80%] flex-col gap-2",
                          i % 2 === 1 ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "h-12 w-48 rounded-2xl shimmer",
                            i % 2 === 1 ? "rounded-tr-none" : "rounded-tl-none"
                          )}
                        />
                        <div className="h-3 w-16 rounded shimmer" />
                      </div>
                    ))}
                  </div>
                )}
                {messages.length === 0 && !msgLoading && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Start chatting with {activeParticipant.full_name}</p>
                  </div>
                )}

                {/* Render the referenced post at the top of the chat */}
                {refPostLoading && !referencedPost && (
                  <div className="mx-4 mt-2 mb-4 overflow-hidden rounded-xl border border-border shadow-sm max-w-[85%] self-start bg-card/50 shrink-0">
                    <div className="space-y-3 p-4">
                      <div className="flex gap-3">
                        <div className="size-10 rounded-full shimmer shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/3 rounded shimmer" />
                          <div className="h-3 w-1/4 rounded shimmer" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full rounded shimmer" />
                        <div className="h-4 w-3/4 rounded shimmer" />
                      </div>
                    </div>
                  </div>
                )}
                {referencedPost && (
                  <div className="mx-4 mt-2 mb-4 overflow-hidden rounded-xl border border-border shadow-sm max-w-[85%] self-start bg-card shrink-0">
                    <div className="bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 border-b border-border">
                      <MessageSquare className="size-3.5" />
                      Referenced Post
                    </div>
                    <PostCard post={referencedPost} hideActions />
                  </div>
                )}

                {messages.map((msg) => {
                  const isMe = msg.sender_id === myId;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md",
                          msg.pending && "opacity-80"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {msg.content}
                        </p>
                        <p
                          className={cn(
                            "mt-1.5 text-right text-[10px]",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {msg.pending ? "Sending..." : format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} aria-hidden />
              </div>

              <footer className="shrink-0 border-t border-border bg-background p-4">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message…"
                    className="min-w-0 flex-1 bg-muted/50 border-border focus-visible:ring-primary"
                    aria-label="Message"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputValue.trim()}
                    className="shrink-0 px-4 font-semibold"
                  >
                    Send
                  </Button>
                </form>
              </footer>
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full bg-muted p-5">
              <MessageSquare className="size-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Select a conversation
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Choose a chat from the list to view messages and continue the conversation.
              </p>
            </div>
          </div>
        )}
      </section>
    </div >
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatContent />
    </Suspense>
  );
}

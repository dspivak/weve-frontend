"use client";

import { useState, useEffect } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAccessToken,
  deleteNotification,
  type NotificationResponse
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { NotificationSkeleton } from "@/components/dashboard/NotificationSkeleton";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Heart, Bookmark, CheckCheck, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      const resp = await getNotifications(token);
      setNotifications(resp.notifications);
      setUnreadCount(resp.unread_count);
      setTotalCount(resp.total);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setupRealtime = async () => {
      const token = getAccessToken();
      const refreshToken = typeof window !== "undefined" ? window.localStorage.getItem("weve_refresh_token") : null;
      if (token) {
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: refreshToken || '',
        });
      }

      // Subscribe to real-time changes
      const channel = supabase
        .channel('notifications-feed')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            console.log('Realtime notification change:', payload);
            if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setNotifications(prev => {
                const target = prev.find(n => n.id === deletedId);
                if (target) {
                  setTotalCount(c => Math.max(0, c - 1));
                  if (!target.is_read) setUnreadCount(u => Math.max(0, u - 1));
                }
                return prev.filter(n => n.id !== deletedId);
              });
            } else {
              // Re-fetch for INSERT/UPDATE to get full actor/post objects
              fetchNotifications();
            }
          }
        )
        .subscribe();

      return channel;
    };

    fetchNotifications();
    let channel: any;
    setupRealtime().then(c => channel = c);

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await markNotificationAsRead(token, id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await markAllNotificationsAsRead(token);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await deleteNotification(token, id);
      const target = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
      if (target && !target.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast("Notification deleted", "success");
    } catch (e) {
      console.error(e);
      toast("Failed to delete notification", "error");
    }
  };

  const getActionInfo = (type: string) => {
    switch (type) {
      case "post_liked":
        return {
          icon: <Heart className="size-4 text-pink-500 fill-pink-500" />,
          text: "liked your post"
        };
      case "post_saved":
        return {
          icon: <Bookmark className="size-4 text-blue-500 fill-blue-500" />,
          text: "saved your post"
        };
      case "new_message":
        return {
          icon: <MessageSquare className="size-4 text-green-500 fill-green-500" />,
          text: "sent you a message"
        };
      default:
        return {
          icon: null,
          text: "interacted with your post"
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        </header>
        <NotificationSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-14 md:top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-foreground leading-tight">
            Notifications ({totalCount.toString().padStart(2, '0')})
          </h1>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all gap-1.5"
          >
            <CheckCheck className="size-3.5" />
            Mark all as read
          </Button>
        )}
      </header>

      <div className="divide-y divide-border">
        {error ? (
          <div className="p-8 text-center text-muted-foreground">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => {
            const { icon, text } = getActionInfo(notification.type);
            return (
              <div
                key={notification.id}
                className={cn(
                  "group relative flex gap-4 p-4 transition-all hover:bg-muted/30 cursor-pointer",
                  !notification.is_read && "bg-blue-500/5"
                )}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                {!notification.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                )}

                <div className="relative h-fit">
                  <Avatar
                    className="h-10 w-10 shrink-0 border border-border"
                    fallback={notification.actor.full_name || notification.actor.username}
                  />
                  {!notification.is_read && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex size-2.5 rounded-full bg-blue-500 border border-background"></span>
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {notification.actor.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate font-normal">
                        @{notification.actor.username}
                      </span>
                      <span className="text-muted-foreground text-[10px]">•</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                      title="Delete notification"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-foreground">
                    {icon}
                    <span>{text}</span>
                  </div>

                  {notification.post && (
                    <div className="mt-2 p-3 rounded-lg border border-border bg-muted/20 text-sm italic">
                      <p className="text-muted-foreground line-clamp-2 overflow-hidden">
                        "{notification.post.content}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DashboardSidebar,
  type DashboardUser,
} from "@/components/dashboard/DashboardSidebar";
import { SplashScreen } from "@/components/SplashScreen";
import { LayoutSkeleton } from "@/components/dashboard/LayoutSkeleton";
import { PostSkeleton } from "@/components/dashboard/PostSkeleton";
import { Button } from "@/components/ui/button";
import {
  getMe,
  refreshAuth,
  getNotifications,
  getConversations,
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  clearAuth,
  getAccessToken,
  getRefreshToken
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const isChatPage = pathname?.startsWith("/dashboard/chat") ?? false;
  const isNewPfPage = pathname?.startsWith("/dashboard/new-pf") ?? false;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!token && !refreshToken) {
      clearAuth();
      router.replace("/login");
      return;
    }

    const applyUser = (me: { id: string; email: string; full_name: string; username: string }) => {
      setUser({
        id: me.id,
        email: me.email,
        fullName: me.full_name,
        username: me.username,
        avatarUrl: null,
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify({
            id: me.id,
            email: me.email,
            fullName: me.full_name,
            username: me.username,
          })
        );
      }
    };

    const tryRefresh = async (): Promise<boolean> => {
      if (!refreshToken) return false;
      try {
        const res = await refreshAuth(refreshToken);
        if (!res) return false;
        window.localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
        if (res.refresh_token) window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.refresh_token);
        applyUser(res.user);
        return true;
      } catch (e) {
        return false;
      }
    };

    const initAuth = async () => {
      if (token) {
        try {
          const me = await getMe(token);
          if (me) {
            applyUser(me);
            setAuthChecked(true);
            return;
          }
        } catch (e) {
          // Fall through to refresh
        }
      }

      const ok = await tryRefresh();
      if (!ok) {
        clearAuth();
        router.replace("/login");
      }
      setAuthChecked(true);
    };

    initAuth();
  }, [mounted, router]);

  useEffect(() => {
    if (!authChecked || !mounted) return;
    const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (!token) return;

    const fetchCounts = async () => {
      try {
        const notifRes = await getNotifications(token);
        setUnreadCount(notifRes.unread_count);

        const chatRes = await getConversations(token);
        const totalUnreadChat = chatRes.conversations.reduce((acc, curr) => acc + curr.unread_count, 0);
        setUnreadChatCount(totalUnreadChat);
      } catch (e) {
        console.error("Failed to fetch counts", e);
      }
    };

    const setupRealtime = async () => {
      if (!user?.id) return null;
      // Set session so Realtime can pass RLS
      const refreshToken = typeof window !== "undefined" ? window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) : null;
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken || '',
      });

      // Subscribe to real-time changes
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user?.id || ''}`
          },
          () => {
            fetchCounts();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
          },
          () => {
            fetchCounts();
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      return channel;
    };

    fetchCounts();
    let channel: any;
    setupRealtime().then(c => channel = c);

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [authChecked, mounted, user?.id]);


  if (!mounted || !authChecked || !user) {
    return (
      <LayoutSkeleton>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </LayoutSkeleton>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop left sidebar — fixed, no scroll */}
      <div className="sticky top-0 h-screen hidden w-64 shrink-0 flex-col overflow-hidden md:flex">
        <DashboardSidebar user={user} unreadCount={unreadCount} unreadChatCount={unreadChatCount} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <DashboardSidebar
              user={user}
              mobile
              unreadCount={unreadCount}
              unreadChatCount={unreadChatCount}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main content + mobile header */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="font-semibold text-foreground">Weve</span>
        </header>
        <main className={cn("flex flex-1 min-w-0", (!isChatPage && !isNewPfPage) && "justify-center")}>
          <div
            id="feed-scroll-area"
            data-feed-scroll
            className={cn(
              "flex w-full flex-col bg-background",
              (isChatPage || isNewPfPage) ? "h-screen overflow-hidden" : "max-w-[600px] border-x border-border"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  Bell,
  MessageCircle,
  User,
  LogOut,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type DashboardUser = {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
};

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Profile", icon: User },
] as const;

type DashboardSidebarProps = {
  user: DashboardUser;
  /** On mobile, when provided, sidebar is shown as overlay and this closes it (e.g. after nav). */
  onClose?: () => void;
  /** Whether sidebar is shown as mobile overlay (affects styling). */
  mobile?: boolean;
  unreadCount?: number;
  unreadChatCount?: number;
};

export function DashboardSidebar({
  user,
  onClose,
  mobile,
  unreadCount,
  unreadChatCount,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    setUserMenuOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("weve_user");
      window.localStorage.removeItem("weve_token");
      window.localStorage.removeItem("weve_refresh_token");
      router.push("/login");
      router.refresh();
    }
  };

  const handleNav = () => {
    onClose?.();
  };

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col overflow-y-auto overflow-x-hidden border-r border-border bg-card px-2",
        mobile && "fixed inset-y-0 left-0 z-50 w-64 shadow-xl",
      )}
      aria-label="Dashboard navigation"
    >
      {/* Logo — minimal, like X */}
      <div className="flex h-14 shrink-0 items-center justify-between px-2">
        <Link
          href="/dashboard"
          onClick={handleNav}
          className="rounded-full p-2.5 font-semibold text-foreground hover:bg-accent/50 transition-colors"
          aria-label="Weve home"
        >
          <span className="text-xl font-bold tracking-tight">Weve</span>
        </Link>
        {mobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close menu"
          >
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Nav — icon + label, no border, like X */}
      <nav className="shrink-0 py-1" aria-label="Main">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={handleNav}
                  className={cn(
                    "flex items-center gap-4 rounded-full py-3 pl-3 pr-4 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive
                      ? "font-semibold text-foreground bg-accent/50"
                      : "text-foreground hover:bg-accent/50",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="relative">
                    <Icon
                      className="size-[1.35rem] shrink-0"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {label === "Notifications" && (unreadCount ?? 0) > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
                      </span>
                    )}
                    {label === "Chat" && (unreadChatCount ?? 0) > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* New Plausible Fiction — theme blue primary button */}
      <div className="mt-2 shrink-0 px-2">
        <Button
          asChild
          className="h-12 w-full rounded-full font-semibold gap-2 text-[15px]"
        >
          <Link href="/dashboard/new-pf" onClick={handleNav}>
            <Plus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            New Plausible Fiction
          </Link>
        </Button>
      </div>

      {/* User row — avatar, name/handle, three-dots on far right (X style) */}
      <div className="mt-auto shrink-0 border-t border-border py-2">
        <div className="relative flex items-center gap-2 rounded-full px-2 py-1 min-w-0 hover:bg-accent/50 transition-colors">
          <Link
            href="/dashboard/profile"
            onClick={handleNav}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar
              src={user.avatarUrl ?? undefined}
              fallback={user.fullName}
              size="sm"
              className="shrink-0 bg-primary/20 text-primary ring-1 ring-border"
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                @{user.username}
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground"
            aria-label="Account menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute bottom-full left-0 right-0 z-50 mb-1 rounded-2xl border border-border bg-popover py-1 shadow-xl">
                <Link
                  href="/dashboard/profile"
                  onClick={() => {
                    handleNav();
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-[15px] text-foreground hover:bg-accent"
                >
                  <User className="size-4 shrink-0" aria-hidden />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

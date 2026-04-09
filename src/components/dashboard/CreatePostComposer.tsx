"use client";

import { useState } from "react";
import {
  Image,
  Smile,
  Calendar,
  MapPin,
  BarChart2,
  Film,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { DashboardUser } from "./DashboardSidebar";

type CreatePostComposerProps = {
  currentUser: DashboardUser;
};

const actionIcons = [
  { icon: Image, label: "Media" },
  { icon: Film, label: "GIF" },
  { icon: BarChart2, label: "Poll" },
  { icon: Smile, label: "Emoji" },
  { icon: Calendar, label: "Schedule" },
  { icon: MapPin, label: "Location" },
] as const;

export function CreatePostComposer({ currentUser }: CreatePostComposerProps) {
  const [value, setValue] = useState("");

  const canPost = value.trim().length > 0;

  const handlePost = () => {
    if (!canPost) return;
    // TODO: submit to API
    setValue("");
  };

  return (
    <div className="flex gap-3 border-b border-border px-4 py-3">
      <div className="shrink-0 pt-1">
        <Avatar
          src={currentUser.avatarUrl ?? undefined}
          fallback={currentUser.fullName}
          size="default"
        />
      </div>
      <div className="min-w-0 flex-1">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What's happening?"
          rows={2}
          className="w-full resize-none bg-transparent py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Compose post"
        />
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1">
            {actionIcons.map(({ icon: Icon, label }) => (
              <Button
                key={label}
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                aria-label={label}
              >
                <Icon className="size-4" aria-hidden />
              </Button>
            ))}
          </div>
          <Button
            type="button"
            onClick={handlePost}
            disabled={!canPost}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}

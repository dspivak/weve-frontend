"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Forward, Heart, Users, Bookmark, MoreHorizontal, X, Link as LinkIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAccessToken, togglePostLike, togglePostSave } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { CollaborationModal } from "./CollaborationModal";

export type PostAuthor = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
  verified?: boolean;
};

/** Rich link card (image on top, then title + description) */
export type PostCardPreview = {
  imageUrl: string;
  title: string;
  description?: string;
  tag?: string;
};

export type Post = {
  id: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  collaborationCount?: number;
  repostCount?: number;
  viewCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  collaboration_parent_id?: string | null;
  collaboration_task_id?: string | null;
  parent_post?: Post;
  /** Single image shown at top of post content */
  imageUrl?: string | null;
  /** Rich link card: image on top, then title/description (e.g. article preview) */
  card?: PostCardPreview | null;
  /** If set, show "X reposted" line above the post */
  repostedBy?: { fullName: string; username: string } | null;
};

type PostCardProps = {
  post: Post;
  hideActions?: boolean;
};

export function PostCard({ post, hideActions }: PostCardProps) {
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [bookmarked, setBookmarked] = useState(Boolean(post.savedByMe));
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collabModalOpen, setCollabModalOpen] = useState(false);

  // Loading states
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // State for parent post actions (when rendered in a collaboration thread)
  const [parentLiked, setParentLiked] = useState(Boolean(post.parent_post?.likedByMe));
  const [parentBookmarked, setParentBookmarked] = useState(Boolean(post.parent_post?.savedByMe));
  const [parentLikeCount, setParentLikeCount] = useState(post.parent_post?.likeCount || 0);
  const [parentCollabModalOpen, setParentCollabModalOpen] = useState(false);
  const [isParentLiking, setIsParentLiking] = useState(false);
  const [isParentBookmarking, setIsParentBookmarking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLiking) return;
    const token = getAccessToken();
    if (!token) {
      toast("Please login to like posts", "error");
      return;
    }
    setIsLiking(true);
    try {
      const res = await togglePostLike(token, post.id);
      setLiked(res.liked);
      setLikeCount(res.like_count);
      toast(res.liked ? "Post liked" : "Post unliked");
    } catch {
      toast("Failed to update like", "error");
    } finally {
      setIsLiking(false);
    }
  };

  const handleParentLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!post.parent_post || isParentLiking) return;
    const token = getAccessToken();
    if (!token) {
      toast("Please login to like posts", "error");
      return;
    }
    setIsParentLiking(true);
    try {
      const res = await togglePostLike(token, post.parent_post.id);
      setParentLiked(res.liked);
      setParentLikeCount(res.like_count);
      toast(res.liked ? "Post liked" : "Post unliked");
    } catch {
      toast("Failed to update like", "error");
    } finally {
      setIsParentLiking(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isBookmarking) return;
    const token = getAccessToken();
    if (!token) {
      toast("Please login to save posts", "error");
      return;
    }
    setIsBookmarking(true);
    try {
      const res = await togglePostSave(token, post.id);
      setBookmarked(res.saved);
      toast(res.saved ? "Added to bookmarks" : "Removed from bookmarks");
    } catch {
      toast("Failed to update bookmark", "error");
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleParentBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!post.parent_post || isParentBookmarking) return;
    const token = getAccessToken();
    if (!token) {
      toast("Please login to save posts", "error");
      return;
    }
    setIsParentBookmarking(true);
    try {
      const res = await togglePostSave(token, post.parent_post.id);
      setParentBookmarked(res.saved);
      toast(res.saved ? "Added to bookmarks" : "Removed from bookmarks");
    } catch {
      toast("Failed to update bookmark", "error");
    } finally {
      setIsParentBookmarking(false);
    }
  };

  const isCollaboration = !!post.parent_post;

  return (
    <div className="flex flex-col">
      {/* 1. Parent Post (Full Height) if this is a collaboration */}
      {post.parent_post && (
        <article className="flex gap-3 px-4 pt-4 pb-1 relative transition-colors hover:bg-muted/10">
          {/* Vertical line connecting to the child (collaborator) avatar */}
          <div className="absolute left-[35px] top-[54px] bottom-0 w-0.5 bg-border/60" />

          <Link
            href={`/dashboard/profile?u=${post.parent_post.author.username}`}
            className="shrink-0 relative z-10"
          >
            <Avatar
              src={post.parent_post.author.avatarUrl ?? undefined}
              fallback={post.parent_post.author.fullName}
              size="default"
              className="size-10"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-sm hover:underline">
                {post.parent_post.author.fullName}
              </span>
              <span className="text-muted-foreground text-sm truncate">
                @{post.parent_post.author.username}
              </span>
              <span className="text-muted-foreground text-sm shrink-0">
                · {post.parent_post.createdAt}
              </span>
            </div>
            {/* Image/Card before text for Parent Post */}
            {!post.parent_post.card && post.parent_post.imageUrl && (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-muted aspect-video max-h-[400px] w-full mt-2 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.parent_post.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            {post.parent_post.card && (
              <a href="#" className="block overflow-hidden rounded-2xl border border-border bg-muted mt-2 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="relative aspect-[2/1] w-full min-h-[160px] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.parent_post.card.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-foreground line-clamp-2">{post.parent_post.card.title}</p>
                </div>
              </a>
            )}

            <p className="text-[15px] text-foreground leading-relaxed mt-1 whitespace-pre-wrap break-words">
              {post.parent_post.content}
            </p>

            {/* Action bar for Parent Post */}
            {!hideActions && (
              <div className="mt-3 flex items-center justify-between max-w-sm">
                <Button
                  variant="ghost" size="sm" onClick={handleParentLike}
                  disabled={isParentLiking}
                  className={cn("h-8 px-2 gap-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50", parentLiked && "text-destructive")}
                >
                  {isParentLiking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Heart className={cn("size-4", parentLiked && "fill-current")} />
                  )}
                  {(parentLikeCount || 0) > 0 ? <span className="text-xs">{parentLikeCount}</span> : null}
                </Button>
                <Link
                  href={`/dashboard/chat?user_id=${post.parent_post.author.id}&post_id=${post.parent_post.id}`}
                  className="flex items-center text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-2 gap-1.5 rounded-md transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="size-4" />
                  {(post.parent_post.commentCount || 0) > 0 ? <span className="text-xs">{post.parent_post.commentCount}</span> : null}
                </Link>
                <Button
                  variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setParentCollabModalOpen(true); }}
                  className="text-muted-foreground hover:text-primary h-8 px-2 gap-1.5"
                >
                  <Users className="size-4" />
                  {(post.parent_post.collaborationCount || 0) > 0 ? <span className="text-xs">{post.parent_post.collaborationCount}</span> : null}
                </Button>
                <Button
                  variant="ghost" size="sm" onClick={handleParentBookmark}
                  disabled={isParentBookmarking}
                  className={cn("h-8 px-2 gap-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50", parentBookmarked && "text-primary")}
                >
                  {isParentBookmarking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Bookmark className={cn("size-4", parentBookmarked && "fill-current")} />
                  )}
                </Button>
              </div>
            )}
          </div>
        </article>
      )}

      <article
        className={cn(
          "flex gap-3 px-4 py-3 relative transition-colors hover:bg-muted/10",
          post.parent_post && "pt-1"
        )}
        aria-labelledby={`post-${post.id}-author`}
      >
        {/* Vertical line from top (if parent exists) and potentially downwards if there were more children */}
        {post.parent_post && (
          <div className="absolute left-[35px] top-0 h-3 w-0.5 bg-border/60" />
        )}

        <Link
          href={`/dashboard/profile?u=${post.author.username}`}
          className="shrink-0 relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
          aria-hidden
        >
          <Avatar
            src={post.author.avatarUrl ?? undefined}
            fallback={post.author.fullName}
            size="default"
            className="shrink-0"
          />
        </Link>
        <div className="min-w-0 flex-1">
          {/* Optional repost line */}
          {post.repostedBy && (
            <div className="mb-1 flex items-center gap-1.5 text-muted-foreground text-sm">
              <Forward className="size-3.5 shrink-0" aria-hidden />
              <Link
                href={`/dashboard/profile?u=${post.repostedBy.username}`}
                className="hover:underline font-medium text-foreground/90"
              >
                {post.repostedBy.fullName} reposted
              </Link>
            </div>
          )}
          {/* Author row: name, @username, time, options */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
              <Link
                id={`post-${post.id}-author`}
                href={`/dashboard/profile?u=${post.author.username}`}
                className="font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded truncate"
              >
                {post.author.fullName}
              </Link>
              {post.author.verified && (
                <svg
                  className="size-4 shrink-0 text-primary"
                  viewBox="0 0 22 22"
                  fill="currentColor"
                  aria-label="Verified"
                >
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.551 1.17-.569 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.437 1.245-.223.606-.27 1.263-.14 1.896.13.634.435 1.218.884 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.427 1.347 1.246z" />
                </svg>
              )}
              <span className="text-muted-foreground text-sm truncate">
                @{post.author.username}
              </span>
              <span className="text-muted-foreground text-sm shrink-0">
                · {post.createdAt}
              </span>
            </div>
          </div>

          {/* Content: image/card on top, then text */}
          <div className="mt-1 space-y-2">
            {!post.card && post.imageUrl && (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-muted aspect-video max-h-[400px] w-full mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {post.card && (
              <a
                href="#"
                className="block overflow-hidden rounded-2xl border border-border bg-muted mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-[2/1] w-full min-h-[160px] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.card.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-foreground line-clamp-2">
                    {post.card.title}
                  </p>
                </div>
              </a>
            )}

            {post.content ? (
              <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
                {post.content}
              </p>
            ) : null}
          </div>


          {/* Action bar for Main Post */}
          {!hideActions && (
            <div className="mt-3 flex items-center justify-between max-w-sm">
              <Button
                variant="ghost" size="sm" onClick={handleLike}
                disabled={isLiking}
                className={cn("h-8 px-2 gap-1.5 text-muted-foreground hover:text-destructive disabled:opacity-50", liked && "text-destructive")}
              >
                {isLiking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Heart className={cn("size-4", liked && "fill-current")} />
                )}
                {(likeCount || 0) > 0 ? <span className="text-xs">{likeCount}</span> : null}
              </Button>
              <Link
                href={`/dashboard/chat?user_id=${post.author.id}&post_id=${post.id}`}
                className="flex items-center text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-2 gap-1.5 rounded-md transition-colors"
              >
                <MessageCircle className="size-4" />
                {(post.commentCount || 0) > 0 ? <span className="text-xs">{post.commentCount}</span> : null}
              </Link>
              <Button
                variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setCollabModalOpen(true); }}
                className="text-muted-foreground hover:text-primary h-8 px-2 gap-1.5"
              >
                <Users className="size-4" />
                {(post.collaborationCount || 0) > 0 ? <span className="text-xs">{post.collaborationCount}</span> : null}
              </Button>
              <Button
                variant="ghost" size="sm" onClick={handleBookmark}
                disabled={isBookmarking}
                className={cn("h-8 px-2 gap-1.5 text-muted-foreground hover:text-primary disabled:opacity-50", bookmarked && "text-primary")}
              >
                {isBookmarking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
                )}
              </Button>
            </div>
          )}
        </div>

        <CollaborationModal
          isOpen={collabModalOpen}
          onClose={() => setCollabModalOpen(false)}
          parentPost={post}
          onSuccess={() => {
            toast("Success! Your collaboration is now live.");
          }}
        />

        {post.parent_post && (
          <CollaborationModal
            isOpen={parentCollabModalOpen}
            onClose={() => setParentCollabModalOpen(false)}
            parentPost={post.parent_post}
            onSuccess={() => {
              toast("Success! Your collaboration is now live.");
            }}
          />
        )}
      </article>
      <div className="h-px bg-border/40 w-full" />
    </div>
  );
}

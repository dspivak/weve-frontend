"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ArrowUp } from "lucide-react";
import { PostCard, type Post } from "@/components/dashboard/PostCard";
import { PostSkeleton } from "@/components/dashboard/PostSkeleton";
import { Input } from "@/components/ui/input";
import { getPosts, getAccessToken } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { mapApiPostToPost, postMatchesSearch } from "@/lib/postUtils";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

  const loadFeed = async (pageNum = 1, showLoadingState = false) => {
    const token = getAccessToken();
    if (!token) {
      if (showLoadingState) setFeedLoading(false);
      setFeedError("Not authenticated");
      return;
    }

    if (showLoadingState) setFeedLoading(true);
    if (pageNum > 1) setIsFetchingMore(true);

    try {
      const res = await getPosts(token, "published", undefined, undefined, pageNum, 10);
      const newPosts = res.posts.map(mapApiPostToPost);

      if (pageNum === 1) {
        setFeedPosts(newPosts);
      } else {
        setFeedPosts((prev) => [...prev, ...newPosts]);
      }

      // Determine if there's more – if we got fewer than 10, or if we've reached the total
      if (newPosts.length < 10) {
        setHasMore(false);
      } else if (res.total && (pageNum * 10 >= res.total)) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setFeedError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load feed";
      if (msg.includes("Invalid or expired") || msg.includes("Not authenticated")) {
        window.localStorage.removeItem("weve_token");
        window.location.href = "/login";
        return;
      }
      if (pageNum === 1) {
        setFeedError(msg);
        setFeedPosts([]);
      }
    } finally {
      if (showLoadingState) setFeedLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadFeed(1, true);
  }, []);

  // When searchQuery changes, reset feed
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadFeed(1, true);
  }, [searchQuery]);

  // Track scroll position on the window
  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY < 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Infinite Scroll Trigger
  useEffect(() => {
    const el = document.getElementById("infinite-scroll-trigger");
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !feedLoading && !isFetchingMore) {
          setPage((p) => {
            const nextPage = p + 1;
            loadFeed(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1, root: null }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, feedLoading, isFetchingMore]);

  // Subscribe to new posts via Realtime
  useEffect(() => {
    const channel = supabase
      .channel("feed-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: "status=eq.published",
        },
        () => {
          setNewPostsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-load if feed is empty (and we aren't searching), OR if the user is at the very top of the feed
  useEffect(() => {
    if (newPostsCount > 0 && (feedPosts.length === 0 || isAtTop) && !searchQuery.trim()) {
      setNewPostsCount(0);
      setPage(1);
      setHasMore(true);
      loadFeed(1);
    }
  }, [newPostsCount, feedPosts.length, searchQuery, isAtTop]);

  const filteredPosts = useMemo(() => {
    let results = feedPosts.filter((post) => postMatchesSearch(post, searchQuery));

    // Remove standalone parent posts if their collaboration is already in the feed
    const threadedParentIds = new Set(results.map(p => p.parent_post?.id).filter(Boolean));
    results = results.filter(p => !threadedParentIds.has(p.id));

    return results;
  }, [searchQuery, feedPosts]);

  return (
    <div className="flex flex-col relative h-full">
      <header className="sticky top-14 md:top-0 z-10 shrink-0 border-b border-border bg-background transition-all">
        <div className="px-4 py-3">
          <label htmlFor="feed-search" className="sr-only">
            Search feeds by username or post content
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="feed-search"
              type="search"
              placeholder="Search by username or text in post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-border"
              autoComplete="off"
              aria-label="Search feeds by username or post content"
            />
          </div>
        </div>
      </header>

      {/* Floating "New Posts Available" Button */}
      {newPostsCount > 0 && feedPosts.length > 0 && (
        <div className="sticky top-[72px] z-20 flex justify-center h-0 overflow-visible pointer-events-none">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setNewPostsCount(0);
              setPage(1);
              setHasMore(true);
              loadFeed(1);
            }}
            className="pointer-events-auto mt-2 flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:bg-blue-600 hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
            aria-label="Load new posts"
          >
            <ArrowUp className="size-4" />
            New posts available
          </button>
        </div>
      )}

      <div className="flex flex-col">
        {feedLoading && page === 1 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : feedError && feedPosts.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            {feedError}
          </div>
        ) : filteredPosts.length > 0 ? (
          <>
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Intersection Element */}
            <div id="infinite-scroll-trigger" className="h-10 w-full flex items-center justify-center p-4">
              {isFetchingMore && <PostSkeleton />}
            </div>

            {!hasMore && filteredPosts.length > 5 && (
              <div className="px-4 py-12 text-center text-muted-foreground text-sm border-t border-border/50">
                You're all caught up! ✨
              </div>
            )}
          </>
        ) : (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            {searchQuery.trim()
              ? "No posts match your search. Try a different username or keyword."
              : "No posts to show. Create one from New Plausible Fiction."}
          </div>
        )}
      </div>
    </div>
  );
}

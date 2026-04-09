import { type Post } from "@/components/dashboard/PostCard";

/** Format published_at or created_at for display (e.g. "2h", "1d", "Mar 1") */
export function formatPostDate(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return diffMins <= 1 ? "Just now" : `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function mapApiPostToPost(api: any): Post {
    const dateStr = api.published_at ?? api.created_at;
    const fullName = (api.author?.full_name ?? "").trim();
    const username = (api.author?.username ?? "").trim();

    return {
        id: api.id,
        author: {
            id: api.author?.id ?? "",
            fullName: fullName || "Unknown",
            username: username || "unknown",
            avatarUrl: null,
        },
        content: api.content,
        createdAt: formatPostDate(dateStr),
        imageUrl: api.image_url ?? null,
        collaboration_parent_id: api.collaboration_parent_id ?? null,
        collaboration_task_id: api.collaboration_task_id ?? null,
        likeCount: api.like_count ?? 0,
        collaborationCount: api.collaboration_count ?? 0,
        likedByMe: api.liked_by_me ?? false,
        savedByMe: api.saved_by_me ?? false,
        commentCount: 0,
        repostCount: 0,
        viewCount: 0,
        parent_post: api.parent_post ? mapApiPostToPost(api.parent_post) : undefined,
    };
}

export function postMatchesSearch(post: Post, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const authorName = post.author.fullName.toLowerCase();
    const authorHandle = post.author.username.toLowerCase();
    const authorHandleWithAt = `@${authorHandle}`;
    const content = (post.content || "").toLowerCase();
    return (
        authorName.includes(q) ||
        authorHandle.includes(q) ||
        authorHandleWithAt.includes(q) ||
        content.includes(q)
    );
}

import { PostSkeleton } from "@/components/dashboard/PostSkeleton";

export default function Loading() {
    return (
        <div className="flex flex-col">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
        </div>
    );
}

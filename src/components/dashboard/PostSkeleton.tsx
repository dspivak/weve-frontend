import { Skeleton } from "@/components/ui/Skeleton";

export function PostSkeleton() {
    return (
        <article className="flex gap-3 border-b border-border px-4 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-3">
                {/* Author row */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>

                {/* Content area */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[80%]" />
                </div>

                {/* Optional Image placeholder */}
                <Skeleton className="aspect-video w-full rounded-2xl" />

                {/* Action bar */}
                <div className="flex items-center justify-between max-w-md pt-1">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
        </article>
    );
}

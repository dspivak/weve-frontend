import { Skeleton } from "@/components/ui/Skeleton";

function ItemCardSkeleton() {
    return (
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
                <Skeleton className="h-6 w-32" />
            </div>
            <div className="divide-y divide-border">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 px-4 py-3">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    </div>
                ))}
            </div>
        </section>
    );
}

export function RightSidebarSkeleton() {
    return (
        <aside className="hidden h-full w-80 shrink-0 overflow-hidden border-l border-border bg-background lg:block">
            <div className="h-full overflow-y-auto p-4 space-y-4">
                <ItemCardSkeleton />
                <ItemCardSkeleton />
            </div>
        </aside>
    );
}

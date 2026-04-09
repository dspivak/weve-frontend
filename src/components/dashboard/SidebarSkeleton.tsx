import { Skeleton } from "@/components/ui/Skeleton";

export function SidebarSkeleton() {
    return (
        <aside className="flex h-full w-full flex-col border-r border-border bg-card px-2">
            {/* Logo */}
            <div className="flex h-14 shrink-0 items-center px-4">
                <Skeleton className="h-7 w-20" />
            </div>

            {/* Nav items */}
            <nav className="shrink-0 space-y-1 py-1">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-full px-3 py-3">
                        <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-24 flex-1" />
                    </div>
                ))}
            </nav>

            {/* Button */}
            <div className="mt-2 shrink-0 px-2">
                <Skeleton className="h-12 w-full rounded-full" />
            </div>

            {/* User row */}
            <div className="mt-auto border-t border-border py-2">
                <div className="flex items-center gap-2 px-2 py-1">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </div>
        </aside>
    );
}

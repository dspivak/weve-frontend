import { Skeleton } from "@/components/ui/Skeleton";

export function NotificationSkeleton() {
    return (
        <div className="divide-y divide-border">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

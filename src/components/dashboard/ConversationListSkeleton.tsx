import { Skeleton } from "@/components/ui/Skeleton";

export function ConversationListSkeleton() {
    return (
        <ul className="flex flex-col">
            {[...Array(6)].map((_, i) => (
                <li key={i} className="border-b border-border/80 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex justify-between items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-8" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

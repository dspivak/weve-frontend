import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileCardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="relative">
                {/* Banner */}
                <Skeleton className="aspect-[3/1] w-full" />
                {/* Avatar */}
                <div className="absolute -bottom-16 left-4">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                </div>
            </div>

            <div className="mt-16 px-4 space-y-4">
                {/* Name and Handle */}
                <div className="space-y-1.5">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                </div>
            </div>
        </div>
    );
}

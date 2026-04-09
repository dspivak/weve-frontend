import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function MessageBubbleSkeleton({ isMe = false }: { isMe?: boolean }) {
    return (
        <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[70%] space-y-1.5",
                    isMe ? "items-end" : "items-start"
                )}
            >
                <Skeleton
                    className={cn(
                        "h-10 w-[200px] rounded-2xl",
                        isMe ? "rounded-br-md" : "rounded-bl-md"
                    )}
                />
                <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <Skeleton className="h-2.5 w-12" />
                </div>
            </div>
        </div>
    );
}

export function ChatThreadSkeleton() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <MessageBubbleSkeleton isMe={false} />
            <MessageBubbleSkeleton isMe={true} />
            <MessageBubbleSkeleton isMe={false} />
            <MessageBubbleSkeleton isMe={false} />
            <MessageBubbleSkeleton isMe={true} />
        </div>
    );
}

import { ConversationListSkeleton } from "@/components/dashboard/ConversationListSkeleton";
import { ChatThreadSkeleton } from "@/components/dashboard/MessageBubbleSkeleton";

export default function Loading() {
    return (
        <div className="flex h-full w-full bg-background min-h-0 overflow-hidden">
            {/* Side list (visible on desktop) */}
            <div className="hidden h-full w-[30%] min-w-[260px] max-w-[360px] border-r border-border md:flex md:flex-col">
                <div className="px-4 py-6 border-b border-border">
                    <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />
                </div>
                <ConversationListSkeleton />
            </div>

            {/* Thread area */}
            <div className="flex flex-1 flex-col">
                <div className="h-14 border-b border-border flex items-center px-4">
                    <div className="h-9 w-9 rounded-full bg-muted/50 animate-pulse" />
                    <div className="ml-3 space-y-1">
                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-muted/50 rounded animate-pulse" />
                    </div>
                </div>
                <ChatThreadSkeleton />
            </div>
        </div>
    );
}

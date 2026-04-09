"use client";

import { cn } from "@/lib/utils";

export function ChatSkeleton() {
    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
            {/* Sidebar Skeleton */}
            <div className="hidden w-80 flex-col border-r border-border md:flex">
                <div className="p-4 border-b border-border">
                    <div className="h-8 w-3/4 rounded shimmer" />
                </div>
                <div className="flex-1 space-y-4 p-4 overflow-y-auto">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="size-12 rounded-full shimmer" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/2 rounded shimmer" />
                                <div className="h-3 w-3/4 rounded shimmer" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Skeleton */}
            <div className="flex flex-1 flex-col">
                {/* Header */}
                <div className="flex h-16 items-center border-b border-border px-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full shimmer" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 rounded shimmer" />
                            <div className="h-3 w-20 rounded shimmer" />
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-6 p-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex max-w-[80%] flex-col gap-2",
                                i % 2 === 1 ? "ml-auto items-end" : "items-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "h-12 w-48 rounded-2xl shimmer",
                                    i % 2 === 1 ? "rounded-tr-none" : "rounded-tl-none"
                                )}
                            />
                            <div className="h-3 w-16 rounded shimmer" />
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="border-t border-border p-4">
                    <div className="h-12 w-full rounded-full shimmer" />
                </div>
            </div>
        </div>
    );
}

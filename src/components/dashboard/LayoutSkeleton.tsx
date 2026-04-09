import { SidebarSkeleton } from "@/components/dashboard/SidebarSkeleton";
import { RightSidebarSkeleton } from "@/components/dashboard/RightSidebarSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export function LayoutSkeleton({ children }: { children?: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop left sidebar */}
            <div className="hidden h-screen w-64 shrink-0 flex-col overflow-hidden md:flex">
                <SidebarSkeleton />
            </div>

            {/* Main content area */}
            <div className="flex min-h-0 flex-1 flex-col">
                {/* Mobile header placeholder */}
                <header className="z-30 flex h-14 shrink-0 items-center border-b border-border bg-background px-4 md:hidden">
                    <Skeleton className="h-5 w-20" />
                </header>

                <main className="flex min-h-0 flex-1 min-w-0 overflow-hidden">
                    <div className="flex min-h-0 flex-1 justify-center min-w-0">
                        <div className="flex h-full min-h-0 w-full max-w-[600px] flex-col overflow-auto border-x border-border bg-background">
                            {children}
                        </div>
                    </div>
                    <RightSidebarSkeleton />
                </main>
            </div>
        </div>
    );
}

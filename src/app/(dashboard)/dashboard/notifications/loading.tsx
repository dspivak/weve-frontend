import { NotificationSkeleton } from "@/components/dashboard/NotificationSkeleton";

export default function Loading() {
    return (
        <div className="min-h-screen border-l border-border">
            <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 h-14 flex items-center">
                <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
            </header>
            <NotificationSkeleton />
        </div>
    );
}

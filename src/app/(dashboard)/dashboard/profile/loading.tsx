import { ProfileCardSkeleton } from "@/components/dashboard/ProfileCardSkeleton";

export default function Loading() {
    return (
        <div className="min-h-screen border-x border-border">
            <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 h-14 flex items-center">
                <h1 className="text-lg font-semibold text-foreground">Profile</h1>
            </header>
            <ProfileCardSkeleton />
        </div>
    );
}

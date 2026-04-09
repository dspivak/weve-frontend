"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type ContributionItem = {
  id: string;
  title: string;
  author?: string;
  meta: string;
  href?: string;
};

const MOCK_CONTRIBUTIONS: ContributionItem[] = [
  {
    id: "1",
    title: "Community Solar Plan",
    author: "Alex Rivera",
    meta: "2h ago · Plausible Future · 5 contributions",
    href: "#",
  },
  {
    id: "2",
    title: "Cooperative Housing Model",
    author: "Jordan Lee",
    meta: "1d ago · Collaboration · 12 contributors",
    href: "#",
  },
  {
    id: "3",
    title: "Climate Tech Startup Roadmap",
    author: "Sam Chen",
    meta: "2d ago · Plausible Future · 8 contributions",
    href: "#",
  },
];

const MOCK_COLLABORATIONS: ContributionItem[] = [
  {
    id: "1",
    title: "Bike Share Network — Task 3",
    author: "Elena Rodriguez",
    meta: "Active · 3 members",
    href: "#",
  },
  {
    id: "2",
    title: "Downtown Delivery Model",
    author: "Marcus Johnson",
    meta: "Invited · Pending",
    href: "#",
  },
];

function ItemCard({
  title,
  items,
}: {
  title: string;
  items: ContributionItem[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href ?? "#"}
            className="flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <Avatar
              fallback={item.author ?? item.title.slice(0, 2)}
              size="sm"
              className="shrink-0 bg-muted text-muted-foreground ring-1 ring-border"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground text-sm line-clamp-2">
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.meta}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground rounded-full"
              aria-label="More options"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function RightSidebar() {
  const pathname = usePathname();
  if (pathname === "/dashboard/profile") {
    return null;
  }

  return (
    <aside
      className="hidden h-full w-80 shrink-0 overflow-hidden border-l border-border bg-background lg:block"
      aria-label="Contribution and collaboration"
    >
      <div className="h-full overflow-y-auto p-4 space-y-4">
        <ItemCard title="Contributions" items={MOCK_CONTRIBUTIONS} />
        <ItemCard title="Collaborations" items={MOCK_COLLABORATIONS} />
      </div>
    </aside>
  );
}

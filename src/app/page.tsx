import Image from "next/image";
import Link from "next/link";
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header: logo, Login + Signup right */}
      <header className="absolute top-0 left-0 right-0 z-[110] w-full bg-transparent">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-90"
            aria-label="Weve home"
          >
            <Image
              src="/app-logo.png"
              alt="Weve Logo"
              width={32}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <LandingPage />
    </div>
  );
}

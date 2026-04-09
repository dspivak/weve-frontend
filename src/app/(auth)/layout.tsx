import Image from "next/image";
import Link from "next/link";
import { WalkthroughPanel } from "@/components/auth/WalkthroughPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Fixed viewport wrapper: prevents any body scroll; only inner left column scrolls */
    <div className="fixed inset-0 overflow-hidden bg-background">
      <main className="h-full w-full flex flex-col lg:flex-row overflow-hidden">
        {/* Left: only this section scrolls */}
        <section
          data-auth-scroll
          className="flex flex-col min-h-0 flex-1 lg:flex-none lg:w-[45%] lg:max-w-[500px] overflow-y-auto overflow-x-hidden border-border bg-card"
        >
          <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:px-10 lg:py-12 lg:border-r">
            <div className="w-full max-w-md mx-auto">
              {/* Back link + logo (both go to home) */}
              <div className="mb-6 flex shrink-0 flex-col items-center gap-4">
                <Link
                  href="/"
                  className="self-start text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  aria-label="Back to home"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Link>
                <Link href="/" className="flex items-center justify-center" aria-label="Weve home">
                  <Image
                    src="/app-logo.png"
                    alt=""
                    width={56}
                    height={56}
                    className="h-12 w-auto sm:h-14 sm:w-auto object-contain"
                    priority
                  />
                </Link>
              </div>
              {children}
            </div>
          </div>
        </section>

        {/* Right: fixed, no scroll */}
        <section className="hidden lg:flex flex-1 min-h-0 items-center justify-center p-6 xl:p-10 bg-black min-w-0 overflow-hidden">
          <div className="w-full max-w-[960px] h-full max-h-[600px] min-h-[420px] flex items-center justify-center">
            <WalkthroughPanel />
          </div>
        </section>
      </main>
    </div>
  );
}

"use client";
import {
  ChartNoAxesCombined,
  List,
  Plus,
  Settings,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/bets", label: "Bets", icon: List },
  { href: "/add", label: "Add bet", icon: Plus },
  { href: "/settings", label: "Settings", icon: Settings },
];
export function AppShell({
  children,
  demo,
}: {
  children: ReactNode;
  demo: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </span>
            <span>
              Bet ledger
              <span className="block text-xs font-normal tracking-normal text-muted-foreground">
                Your bets. A clearer picture.
              </span>
            </span>
          </Link>
          <nav
            aria-label="Desktop navigation"
            className="hidden grid-cols-3 gap-2 md:grid"
          >
            {items
              .filter((item) => item.href !== "/add")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex h-11 w-28 items-center justify-center whitespace-nowrap rounded-lg px-4 text-sm font-medium",
                    isActive(item.href)
                      ? "bg-secondary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
          <Link href="/add" className={cn(buttonVariants(), "h-11 gap-2 px-4")}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add bet</span>
            <span className="sr-only sm:hidden">Add bet</span>
          </Link>
        </div>
      </header>
      {demo && (
        <div className="border-b bg-amber-50 px-5 py-2 text-center text-xs text-amber-950">
          Local demo · Saved on this computer · No private account connected
        </div>
      )}
      <main
        id="main"
        className="mx-auto max-w-6xl px-5 py-8 pb-28 sm:px-8 md:pb-12"
      >
        {children}
      </main>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card/95 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 min-w-0 flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "size-5",
                  item.href === "/add" &&
                    "rounded-full bg-primary text-primary-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

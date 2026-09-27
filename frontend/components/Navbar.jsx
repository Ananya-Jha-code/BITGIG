"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { setRole, useRole } from "@/lib/role";
import { cn } from "@/lib/utils";

const NAV_LINKS = {
  company: [
    { href: "/company", label: "My gigs" },
    { href: "/company/gigs/new", label: "Create gig" },
  ],
  expert: [
    { href: "/tasks", label: "Marketplace" },
    { href: "/expert/earnings", label: "Earnings" },
  ],
};

export default function Navbar() {
  const role = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const links = NAV_LINKS[role] ?? [];

  function switchRole() {
    setRole(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
        <Link href="/" aria-label="BITGIG home">
          <Wordmark size="sm" />
        </Link>

        <div className="flex flex-1 items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                pathname === link.href && "bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {role && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground capitalize">
              {role}
            </span>
            <Button variant="outline" size="sm" onClick={switchRole}>
              Switch role
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}

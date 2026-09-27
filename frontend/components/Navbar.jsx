"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/api";
import { setRole, useRole } from "@/lib/role";
import { cn } from "@/lib/utils";

const NAV_LINKS = {
  company: [
    { href: "/company", label: "Gigs" },
    { href: "/company/gigs/new", label: "Create gig" },
  ],
  expert: [
    { href: "/tasks", label: "Marketplace" },
    { href: "/expert/earnings", label: "Earnings" },
    { href: "/expert/onboarding", label: "Credentials" },
  ],
};

function isActive(pathname, href) {
  if (href === "/company") return pathname === "/company" || /^\/company\/gigs\/(?!new)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const role = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const links = NAV_LINKS[role] ?? [];

  useEffect(() => {
    let cancelled = false;
    getCurrentUser(role).then((u) => {
      if (!cancelled) setUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, [role]);

  function switchRole() {
    setRole(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-360 items-center gap-8 px-6">
        <Link href="/" aria-label="BITGIG home" className="rounded-sm">
          <Wordmark size="sm" />
        </Link>

        <div className="flex h-full flex-1 items-center gap-1">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full items-center px-3 text-sm transition-colors duration-150",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />
                )}
              </Link>
            );
          })}
        </div>

        {role && user && (
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm text-foreground">{user.name}</span>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {role}
                {role === "expert" && <VerifiedBadge status={user.credential_status} className="normal-case tracking-normal" />}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={switchRole} className="text-muted-foreground">
              Switch role
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}

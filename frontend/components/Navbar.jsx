"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeftRight } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Wordmark from "@/components/Wordmark";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

function initials(name) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
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
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-360 items-center gap-10 px-6 lg:px-10">
        <Link href="/" aria-label="BITGIG home" className="rounded-sm transition-transform duration-200 hover:scale-[1.03]">
          <Wordmark size="sm" />
        </Link>

        <div className="flex flex-1 items-center gap-1">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[15px] font-medium transition-colors duration-200",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-foreground/6"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    aria-hidden
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {role && user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-ink font-mono text-xs font-semibold text-white">
                {initials(user.name)}
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{user.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                  {role}
                  {role === "expert" && <VerifiedBadge status={user.credential_status} />}
                </span>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={switchRole} aria-label="Switch role" className="size-10 rounded-full">
                  <ArrowLeftRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Switch role</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <GeminiChip>Built on Gemini</GeminiChip>
        )}
      </nav>
    </header>
  );
}

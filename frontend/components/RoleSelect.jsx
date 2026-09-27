"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setRole } from "@/lib/role";

const ROLES = [
  {
    role: "company",
    icon: Building2,
    title: "I'm a company",
    description:
      "Post annotation gigs for lab videos. Gemini pre-segments each video against your SOP, and verified experts correct it.",
    cta: "Post a gig",
    href: "/company",
  },
  {
    role: "expert",
    icon: Microscope,
    title: "I'm an expert",
    description:
      "Pick up tasks that match your specialty. Start from Gemini's draft, not a blank timeline.",
    cta: "Browse tasks",
    href: "/tasks",
  },
];

export default function RoleSelect() {
  const router = useRouter();

  function choose(role, href) {
    setRole(role);
    router.push(href);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {ROLES.map(({ role, icon: Icon, title, description, cta, href }) => (
        <Card key={role} className="gap-5 pt-6 ring-border">
          <CardHeader className="gap-3 px-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Icon className="size-6" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </CardContent>
          <CardFooter className="border-border bg-transparent px-6 pb-6">
            <Button
              size="lg"
              className="h-11 w-full text-base"
              onClick={() => choose(role, href)}
            >
              {cta}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

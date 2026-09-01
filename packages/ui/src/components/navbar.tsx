"use client";

import { LogOut, Menu, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { ThemeToggle } from "./theme-toggle";

export interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  /** Brand name shown on the left */
  brand?: string;
  /** Brand href */
  brandHref?: string;
  /** Navigation links rendered in the center / hamburger */
  links?: NavLink[];
  /** Rendered to the right of links (before auth) — for app-specific widgets */
  actions?: React.ReactNode;
}

export function Navbar({ brand = "Platform", brandHref = "/", links = [], actions }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center gap-4">
        {/* Brand */}
        <Link href={brandHref} className="mr-4 font-semibold tracking-tight">
          {brand}
        </Link>

        {/* Desktop links */}
        {links.length > 0 && (
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Custom app actions */}
        {actions}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Auth */}
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="User menu">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "avatar"}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{session.user.name ?? "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm">
            <Link href="/auth">Sign in</Link>
          </Button>
        )}

        {/* Mobile hamburger */}
        {links.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 pt-6">
                <Link href={brandHref} className="mb-2 font-semibold">
                  {brand}
                </Link>
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
}

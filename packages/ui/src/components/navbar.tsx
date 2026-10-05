"use client";

import { LogOut, Menu, Shield, User, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
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
  /** Optional small circular logo image shown before the brand name */
  brandLogo?: string;
  /** Extra nav links rendered before the auth buttons — e.g. a cross-app link */
  links?: NavLink[];
  /** Rendered in the center of the bar — typically a search input */
  search?: React.ReactNode;
}

export function Navbar({
  brand = "Platform",
  brandHref = "/",
  brandLogo,
  links = [],
  search,
}: NavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-background/95 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="container flex h-16 items-center gap-3 sm:gap-4">
        {/* Brand */}
        <Link href={brandHref} className="flex min-h-11 min-w-0 items-center gap-2">
          {brandLogo && (
            // eslint-disable-next-line
            <img src={brandLogo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          )}
          <span className="text-primary text-sm font-extrabold leading-tight tracking-tight sm:text-lg">
            {brand}
          </span>
        </Link>

        {/* Search (desktop). On phones it lives in the menu panel instead. */}
        <div className="mx-auto hidden w-full max-w-md flex-1 lg:block">{search}</div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {links.length > 0 && (
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((link) => (
                <Button key={link.href} asChild variant="ghost" size="sm">
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
          )}
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          {/* Auth */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User menu">
                  {session.user.image ? (
                    // eslint-disable-next-line
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
                  <p className="text-muted-foreground truncate text-xs">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {session.user.admin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
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
            <div className="hidden items-center gap-2 lg:flex">
              <Button asChild variant="outline" size="sm">
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth?tab=register">Join now</Link>
              </Button>
            </div>
          )}

          {/* Phone menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Phone menu panel */}
      {menuOpen && (
        <div id="mobile-menu" className="bg-background border-t lg:hidden">
          <div className="container space-y-4 py-4">
            {search && <div>{search}</div>}

            {links.length > 0 && (
              <nav className="flex flex-col">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:bg-accent flex min-h-11 items-center rounded-lg px-3 text-base font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            <div className="flex min-h-11 items-center justify-between border-t pt-3">
              <span className="text-muted-foreground text-sm">Theme</span>
              <ThemeToggle />
            </div>

            {session?.user ? (
              <div className="grid gap-1 border-t pt-3">
                <Link
                  href="/profile"
                  className="hover:bg-accent flex min-h-11 items-center gap-2 rounded-lg px-3 text-base font-medium"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                {session.user.admin && (
                  <Link
                    href="/admin"
                    className="hover:bg-accent flex min-h-11 items-center gap-2 rounded-lg px-3 text-base font-medium"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-destructive hover:bg-accent flex min-h-11 items-center gap-2 rounded-lg px-3 text-left text-base font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t pt-3">
                <Button asChild variant="outline">
                  <Link href="/auth">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?tab=register">Join now</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

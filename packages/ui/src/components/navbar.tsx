"use client";

import { LogOut, Mail, Menu, Phone, Shield, User, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { AscendButton } from "./ascend/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "../lib/utils";

const CONTACT = {
  phone: "+91 91135 92725",
  phoneHref: "tel:+919113592725",
  email: "admin@cloudvidyaacademy.com",
};

export interface NavLink {
  label: string;
  href: string;
  /** Subtle glow, for drawing attention to one link (e.g. a limited-time program). */
  glow?: boolean;
}

const glowClass =
  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse";

interface NavbarProps {
  /** Brand name shown on the left — ignored once `logo` is given. */
  brand?: string;
  /** Brand href */
  brandHref?: string;
  /** Optional small circular logo image shown before the brand name */
  brandLogo?: string;
  /**
   * Full brand mark, e.g. a responsive pair of `<CloudVidyaLogo>` elements.
   * Takes over the whole brand slot — `brand`/`brandLogo` are ignored when set.
   */
  logo?: React.ReactNode;
  /** Extra nav links rendered before the auth buttons — e.g. a cross-app link */
  links?: NavLink[];
  /** Rendered in the center of the bar — typically a search input */
  search?: React.ReactNode;
}

export function Navbar({
  brand = "Platform",
  brandHref = "/",
  brandLogo,
  logo,
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
    <header className="safe-top sticky top-5 z-40 w-full px-5 sm:px-8">
      <div className="nav-pill mx-auto flex h-16 max-w-[1120px] items-center gap-3 rounded-full px-4 sm:gap-4 sm:px-6">
        {/* Brand */}
        <Link
          href={brandHref}
          aria-label={logo ? `${brand}, home` : undefined}
          className="ring-offset-background focus-visible:ring-ring flex min-h-11 min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {logo ?? (
            <>
              {brandLogo && (
                // eslint-disable-next-line
                <img
                  src={brandLogo}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              )}
              <span className="text-primary text-sm font-extrabold leading-tight tracking-tight sm:text-lg">
                {brand}
              </span>
            </>
          )}
        </Link>

        {/* Search (desktop). On phones it lives in the menu panel instead. */}
        <div className="mx-auto hidden w-full max-w-md flex-1 lg:block">{search}</div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {links.length > 0 && (
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium normal-case tracking-normal transition-colors dark:text-[#D4D4D8] dark:hover:text-[#FAFAFA] dark:aria-[current=page]:text-[#FAFAFA]",
                    link.glow && `${glowClass} rounded-full`
                  )}
                >
                  {link.label}
                </Link>
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
              <DropdownMenuContent
                align="end"
                className="w-60 rounded-[20px] border border-white/10 bg-[#161618] p-2 shadow-[0_24px_64px_-16px_rgb(0_0_0_/_0.6)]"
              >
                <div className="px-3 py-2 text-sm">
                  <p className="font-bold text-white">{session.user.name ?? "User"}</p>
                  <p className="truncate text-xs text-zinc-400">{session.user.email}</p>
                  {session.user.studentId && (
                    <span className="mt-1.5 inline-block w-fit rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-mono text-xs text-blue-400">
                      ID: {session.user.studentId}
                    </span>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  asChild
                  className="group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  <Link href="/profile">
                    <User className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-white" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {session.user.admin && (
                  <DropdownMenuItem
                    asChild
                    className="group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] focus:bg-white/[0.06]"
                  >
                    <Link href="/admin">
                      <Shield className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-white" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border-t border-white/10 px-3 py-2.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/10 hover:text-blue-300 focus:bg-blue-500/10 focus:text-blue-300"
                  onSelect={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <AscendButton variant="secondary" size="sm">
                    Contact us
                  </AscendButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 rounded-[20px] border border-white/10 bg-[#161618] p-3 shadow-[0_24px_64px_-16px_rgb(0_0_0_/_0.6)]"
                >
                  <DropdownMenuItem
                    asChild
                    className="group flex cursor-pointer items-start gap-3 rounded-xl p-2.5 text-sm transition-colors hover:bg-white/[0.06] focus:bg-white/[0.06]"
                  >
                    <a href={CONTACT.phoneHref}>
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-all group-hover:bg-blue-500 group-hover:text-white">
                        <Phone className="h-4 w-4" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-xs text-zinc-400">Call us</span>
                        <span className="truncate text-sm font-medium text-zinc-100">
                          {CONTACT.phone}
                        </span>
                      </span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="group flex cursor-pointer items-start gap-3 rounded-xl p-2.5 text-sm transition-colors hover:bg-white/[0.06] focus:bg-white/[0.06]"
                  >
                    <a href={`mailto:${CONTACT.email}`}>
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-all group-hover:bg-blue-500 group-hover:text-white">
                        <Mail className="h-4 w-4" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-xs text-zinc-400">Email support</span>
                        <span className="truncate text-sm font-medium text-zinc-100">
                          {CONTACT.email}
                        </span>
                      </span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <AscendButton asChild variant="default" size="sm">
                <Link href="/auth">Login</Link>
              </AscendButton>
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

      {/* Phone menu — a fixed, full-height right-side sheet. CSS-only motion
          (no AnimatePresence/motion.div): the backdrop+panel are only in the
          DOM while menuOpen is true, so the slide/fade below is a plain CSS
          mount animation (tailwindcss-animate's `animate-in`), and closing it
          unmounts immediately rather than coordinating an exit animation —
          deliberately, since adding exit-delay state would be a logic change. */}
      {menuOpen && (
        <>
          {/* Backdrop is decorative only — no click-to-close handler added,
              per the tripwire gate (that would be new logic, not a pure
              restyle). Closing still works via the X toggle button and the
              existing pathname-change effect. See NEEDS LOGIC CHANGE. */}
          <div
            aria-hidden="true"
            className="animate-in fade-in-0 fixed inset-0 z-40 bg-black/60 duration-[233ms] ease-[var(--cv-ease)] lg:hidden dark:backdrop-blur-sm"
          />
          <div
            id="mobile-menu"
            className="sheet-panel bg-background animate-in slide-in-from-right fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto rounded-l-[32px] border-l duration-[233ms] ease-[var(--cv-ease)] lg:hidden"
          >
            <div className="flex flex-col gap-4 p-6">
              {search && <div>{search}</div>}

              {links.length > 0 && (
                <nav className="flex flex-col">
                  {links.map((link, i) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex h-14 items-center gap-4 border-b border-white/[0.08] text-left",
                        link.glow && `${glowClass} rounded-lg px-3`
                      )}
                    >
                      <span className="font-mono text-sm text-[#4D94FF]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-[22px] font-semibold leading-[28px]">
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </nav>
              )}

              <div className="flex min-h-11 items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-muted-foreground text-sm">Theme</span>
                <ThemeToggle />
              </div>

              {session?.user ? (
                <div className="grid gap-1 pb-3">
                  <Link
                    href="/profile"
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-medium hover:bg-white/[0.06]"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  {session.user.admin && (
                    <Link
                      href="/admin"
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-medium hover:bg-white/[0.06]"
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-base font-medium text-blue-600 hover:bg-white/[0.06] dark:text-blue-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid gap-2 pb-3">
                  <AscendButton asChild variant="default" className="w-full rounded-full">
                    <Link href="/auth">Login</Link>
                  </AscendButton>
                  <a
                    href={CONTACT.phoneHref}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-medium hover:bg-white/[0.06]"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {CONTACT.phone}
                  </a>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-medium hover:bg-white/[0.06]"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="break-all">{CONTACT.email}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

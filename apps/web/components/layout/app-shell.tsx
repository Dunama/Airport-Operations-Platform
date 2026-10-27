"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut, Plane, User } from "lucide-react";
import { cn } from "cn";

import { clearSession, homeForRole, type Role } from "@/lib/auth";
import { useSession } from "@/lib/use-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { Separator } from "@/components/ui/separator";

const ROLE_LABELS: Record<Role, string> = {
  ground: "Ground Staff",
  ops: "Operations",
  airline: "Airline",
  admin: "Administrator",
  guest: "Guest",
};

function initials(name: string) {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function SidebarAccount({
  collapsed,
  onProfile,
  onLogout,
}: {
  collapsed?: boolean;
  onProfile?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-sidebar-border px-3 pt-3">
      <Link
        href="/profile"
        onClick={onProfile}
        title={collapsed ? "Profile" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <User className="size-4 shrink-0" />
        {!collapsed && "Profile"}
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onLogout}
        title={collapsed ? "Sign out" : undefined}
        className={cn(
          "mt-1 w-full justify-start gap-3 px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <LogOut className="size-4 shrink-0" />
        {!collapsed && "Sign out"}
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();
  const [open, setOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const role: Role = session?.role ?? "guest";
  const home = homeForRole(role);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-svh">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar py-4 transition-[width] lg:flex",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <Link
          href={home}
          className={cn(
            "flex items-center gap-2.5 px-5 pb-4 text-sm font-semibold tracking-tight text-sidebar-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Plane className="size-4" />
          </span>
          {!collapsed && "Airport Ops"}
        </Link>
        <SidebarNav role={role} collapsed={collapsed} />
        <div className="mt-auto px-5 pt-4">
          <SidebarAccount collapsed={collapsed} onLogout={handleLogout} />
          {!collapsed && (
            <div className="text-[11px] text-sidebar-foreground/50">
              {ROLE_LABELS[role]}
            </div>
          )}
        </div>
      </aside>

      <div className={cn("transition-[padding-left]", collapsed ? "lg:pl-16" : "lg:pl-60")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  aria-label="Open navigation"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetHeader className="border-b border-sidebar-border pb-4">
                <SheetTitle className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Plane className="size-4" />
                  </span>
                  Airport Ops
                </SheetTitle>
              </SheetHeader>
              <SidebarNav role={role} onNavigate={() => setOpen(false)} />
              <SidebarAccount
                onProfile={() => setOpen(false)}
                onLogout={() => {
                  setOpen(false);
                  handleLogout();
                }}
              />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu />
          </Button>

          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-sm font-semibold">Airport Ops</span>
          </div>

          <Badge variant="secondary" className="hidden lg:inline-flex">
            {ROLE_LABELS[role]}
          </Badge>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" className="gap-2 px-2" />}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {initials(session?.name ?? "...")}
                </span>
                <span className="hidden text-sm font-medium sm:inline">
                  {session?.name ?? ""}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{session?.name ?? ""}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {session?.email ?? ""}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8")}>
          {children}
        </main>
      </div>
    </div>
  );
}

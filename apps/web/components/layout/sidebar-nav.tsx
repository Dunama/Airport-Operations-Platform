"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  Package,
  TriangleAlert,
  CalendarDays,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import type { Role } from "@/lib/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const GROUND_NAV: NavItem[] = [
  { href: "/ground", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ground/flights", label: "Flights", icon: Plane },
  { href: "/ground/turnaround", label: "Turnarounds", icon: Plane },
  { href: "/ground/baggage", label: "Baggage", icon: Package },
  { href: "/ground/incidents", label: "Incidents", icon: TriangleAlert },
  { href: "/ground/schedule", label: "My schedule", icon: CalendarDays },
];

export const AIRLINE_NAV: NavItem[] = [
  { href: "/airline", label: "Dashboard", icon: LayoutDashboard },
  { href: "/airline/flights", label: "Flights", icon: Plane },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/ground/manage", label: "Manage", icon: Settings2 },
];

export function navForRole(role: Role): NavItem[] {
  if (role === "airline") return AIRLINE_NAV;
  if (role === "admin" || role === "ops") return [...GROUND_NAV, ...ADMIN_NAV];
  return GROUND_NAV;
}

interface SidebarNavProps {
  role: Role;
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function SidebarNav({ role, onNavigate, collapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const nav = navForRole(role);
  const root = nav[0]?.href ?? "/";

  return (
    <nav className={cn("flex flex-col gap-1 px-3", collapsed && "px-2")}>
      {nav.map((item) => {
        const active =
          item.href === root
            ? pathname === root
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        );
      })}
    </nav>
  );
}

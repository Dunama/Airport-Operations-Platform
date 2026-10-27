"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { homeForRole, type Role } from "@/lib/auth";
import { PageLoader } from "@/components/async/plane-loader";
import { useIsClient, useSession } from "@/lib/use-session";
import { AppShell } from "./app-shell";

/** Auth + role guard. Admin is allowed everywhere; everyone else is scoped. */
export function ProtectedShell({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const session = useSession();
  const isClient = useIsClient();
  const allowed = allow.join(",");

  const authorized =
    isClient &&
    session !== null &&
    session.role !== "guest" &&
    (session.role === "admin" || allowed.split(",").includes(session.role));

  React.useEffect(() => {
    if (!isClient) return;
    if (!session || session.role === "guest") {
      router.replace("/login");
      return;
    }
    if (session.role !== "admin" && !allowed.split(",").includes(session.role)) {
      router.replace(homeForRole(session.role));
    }
  }, [isClient, session, allowed, router]);

  if (!authorized) return <PageLoader />;

  return <AppShell>{children}</AppShell>;
}

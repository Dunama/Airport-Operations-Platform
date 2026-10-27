"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/async/plane-loader";
import { getSession, homeForRole } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    router.replace(session ? homeForRole(session.role) : "/login");
  }, [router]);

  return <PageLoader />;
}

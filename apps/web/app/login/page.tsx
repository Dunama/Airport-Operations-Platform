"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plane, ArrowRight } from "lucide-react";
import { PlaneLoader } from "@/components/async/plane-loader";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getSession, homeForRole, login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const session = getSession();
    if (session) router.replace(homeForRole(session.role));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      const session = getSession();
      router.replace(homeForRole(session?.role ?? "guest"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center px-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plane className="size-5" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Airport Operations Platform
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Ground handling crew — use your station account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@airport.aop"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-status-critical-soft px-3 py-2 text-sm text-status-critical"
                >
                  {error}
                </p>
              )}

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? (
                  <PlaneLoader size="sm" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Demo: admin@aop.dev / ops@aop.dev / ground@aop.dev / airline@aop.dev — password Passw0rd!
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

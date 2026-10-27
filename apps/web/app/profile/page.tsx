"use client";

import { Shield, Mail, User, Plane } from "lucide-react";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const session = useSession();

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your account details and role permissions"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm font-medium">{session?.email ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <Shield className="size-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="text-sm font-medium capitalize">
                  {session?.role ?? "guest"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <Plane className="size-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Airline ID</div>
                <div className="text-sm font-medium tabular-nums">
                  {session?.airlineId ?? "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {session?.role === "admin" &&
                "Full access to all modules including system configuration."}
              {session?.role === "ops" &&
                "Operations access including ground oversight and incident management."}
              {session?.role === "ground" &&
                "Ground handling access: flights, turnarounds, baggage, incidents and schedule."}
              {session?.role === "airline" &&
                "Airline-scoped access to your flights and turnaround status."}
              {!session?.role && "Not signed in."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

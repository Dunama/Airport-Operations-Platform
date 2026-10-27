"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "cn";

import { api } from "@/lib/api";
import { severityMeta, type StatusTone } from "@/lib/status";
import type { Flight, Gate } from "@/lib/types";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CATEGORIES: Record<string, string> = {
  baggage_delay: "Baggage delay",
  security: "Security",
  equipment: "Equipment",
  fuel_spill: "Fuel / spill",
  passenger: "Passenger",
  weather: "Weather",
  medical: "Medical",
  other: "Other",
};

const TONE_ACTIVE: Record<StatusTone, string> = {
  critical: "bg-status-critical-soft text-status-critical border-status-critical/40",
  ok: "bg-status-ok-soft text-status-ok border-status-ok/40",
  pending: "bg-status-pending-soft text-status-pending border-status-pending/40",
  neutral: "bg-status-neutral-soft text-status-neutral border-border",
};

interface IncidentFormProps {
  flights: Flight[];
  gates: Gate[];
  initialFlightId?: number;
}

export function IncidentForm({ flights, gates, initialFlightId }: IncidentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [flightId, setFlightId] = React.useState(
    String(initialFlightId ?? flights[0]?.id ?? "")
  );
  const [gateId, setGateId] = React.useState(String(gates[0]?.id ?? ""));
  const [category, setCategory] = React.useState("equipment");
  const [severity, setSeverity] = React.useState(3);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const flightItems = Object.fromEntries(
    flights.map((f) => [String(f.id), `${f.flight_no} (${f.direction})`])
  );
  const gateItems = Object.fromEntries(gates.map((g) => [String(g.id), g.code]));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!flightId || !gateId) {
      setError("Pick a flight and a gate.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.createIncident({
        flight_id: Number(flightId),
        gate_id: Number(gateId),
        category,
        severity,
      });
      toast({
        variant: severity >= 4 ? "error" : "warning",
        title: "Incident reported",
        description: CATEGORIES[category],
      });
      router.push("/ground/incidents");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit the report.";
      setError(message);
      toast({ variant: "error", title: "Couldn't report incident", description: message });
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Report incident</CardTitle>
        <CardDescription>
          Logged against your account — severity drives the colour everywhere it
          appears.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="flight">Flight</Label>
              <Select
                value={flightId}
                onValueChange={(v) => setFlightId(v as string)}
                items={flightItems}
              >
                <SelectTrigger id="flight" className="w-full">
                  <SelectValue placeholder="Pick a flight" />
                </SelectTrigger>
                <SelectContent>
                  {flights.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.flight_no} ({f.direction})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="gate">Gate</Label>
              <Select
                value={gateId}
                onValueChange={(v) => setGateId(v as string)}
                items={gateItems}
              >
                <SelectTrigger id="gate" className="w-full">
                  <SelectValue placeholder="Pick a gate" />
                </SelectTrigger>
                <SelectContent>
                  {gates.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as string)}
              items={CATEGORIES}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Severity</Label>
            <div className="flex gap-2" role="radiogroup" aria-label="Severity">
              {[1, 2, 3, 4, 5].map((value) => {
                const active = severity === value;
                const tone = severityMeta(value).tone;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSeverity(value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      active
                        ? TONE_ACTIVE[tone]
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Red marks severity 4–5 · amber 3 · slate 1–2.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-status-critical-soft px-3 py-2 text-sm text-status-critical"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/ground/incidents")}
            >
              <X />
              Cancel
            </Button>
            <Button type="submit" disabled={busy || flights.length === 0}>
              {busy ? <Loader2 className="animate-spin" /> : <Check />}
              Submit report
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

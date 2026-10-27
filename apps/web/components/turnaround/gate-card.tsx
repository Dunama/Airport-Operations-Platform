"use client";

import * as React from "react";
import { DoorOpen } from "lucide-react";

import { formatTime } from "@/lib/format";
import type {
  Aircraft,
  InboundEta,
  Gate,
  GateAssignment,
  OptimizationRun,
  Rotation,
} from "@/lib/types";
import { InboundEtaLine } from "@/components/eta/inbound-eta";
import { GateAssignmentForm } from "@/components/manage/gate-assignment-form";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GateCard({
  rotationId,
  assignment,
  gates,
  rotations,
  aircraft,
  optimizationRuns,
  requestedBy,
  inbound,
  onChanged,
}: {
  rotationId: number;
  assignment: GateAssignment | undefined;
  gates: Gate[];
  rotations: Rotation[];
  aircraft: Map<number, Aircraft>;
  optimizationRuns: OptimizationRun[];
  requestedBy: number;
  /** Live landing estimate for the inbound leg, so the gate crew can prepare. */
  inbound?: InboundEta;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const gate = assignment ? gates.find((g) => g.id === assignment.gate_id) : undefined;
  const rotation = rotations.find((r) => r.id === rotationId) ?? {
    id: rotationId,
    aircraft_id: 0,
    on_block_planned: "",
    off_block_planned: "",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DoorOpen className="size-4 text-muted-foreground" />
          Gate
        </CardTitle>
        <CardDescription>
          {assignment
            ? `${formatTime(assignment.start)}–${formatTime(assignment.end)} · ${assignment.source}`
            : "No gate assigned to this rotation"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <span className="text-2xl font-semibold">{gate?.code ?? "—"}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          {assignment ? "Change gate" : "Assign gate"}
        </Button>
      </CardContent>
      {inbound && (
        <CardContent>
          <InboundEtaLine item={inbound} />
        </CardContent>
      )}

      <GateAssignmentForm
        open={open}
        item={assignment ?? null}
        onOpenChange={setOpen}
        onSaved={() => {
          setOpen(false);
          toast({
            variant: "success",
            title: assignment ? "Gate changed" : "Gate assigned",
          });
          onChanged();
        }}
        rotations={[rotation, ...rotations.filter((r) => r.id !== rotationId)]}
        gates={gates}
        aircraft={aircraft}
        optimizationRuns={optimizationRuns}
        requestedBy={requestedBy}
      />
    </Card>
  );
}

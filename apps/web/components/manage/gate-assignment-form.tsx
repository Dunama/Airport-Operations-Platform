"use client";

import * as React from "react";

import { api } from "@/lib/api";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import type {
  Aircraft,
  Gate,
  GateAssignment,
  OptimizationRun,
  Rotation,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "greedy", label: "Greedy" },
  { value: "optimizer", label: "Optimizer" },
];

export function GateAssignmentForm({
  open,
  item,
  onOpenChange,
  onSaved,
  rotations,
  gates,
  aircraft,
  optimizationRuns,
  requestedBy,
}: CrudFormProps<GateAssignment> & {
  rotations: Rotation[];
  gates: Gate[];
  aircraft: Map<number, Aircraft>;
  optimizationRuns: OptimizationRun[];
  requestedBy: number;
}) {
  const [rotationId, setRotationId] = React.useState(
    String(item?.rotation_id ?? rotations[0]?.id ?? "")
  );
  const [gateId, setGateId] = React.useState(
    String(item?.gate_id ?? gates[0]?.id ?? "")
  );
  const [source, setSource] = React.useState(item?.source ?? "manual");
  const [start, setStart] = React.useState(toLocalInput(item?.start));
  const [end, setEnd] = React.useState(toLocalInput(item?.end));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startIso = fromLocalInput(start);
    const endIso = fromLocalInput(end);
    if (!rotationId || !gateId || !startIso || !endIso) {
      setError("A rotation, gate and time window are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let runId = item?.run_id ?? optimizationRuns[0]?.id;
      if (!runId) {
        const run = await api.createOptimizationRun({
          requested_by: requestedBy,
          horizon_start: startIso,
          horizon_end: endIso,
          n_flights: 1,
          status: "manual",
        });
        runId = run.id;
      }
      const payload = {
        rotation_id: Number(rotationId),
        gate_id: Number(gateId),
        run_id: runId,
        source,
        is_active: true,
        start: startIso,
        end: endIso,
      };
      if (item) {
        await api.updateGateAssignment(item.id, payload);
      } else {
        await api.createGateAssignment(payload);
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save the gate assignment."
      );
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit gate assignment" : "Assign a gate"}
      description="Parks a rotation at a gate for a time window. Overlapping windows on the same gate are rejected."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Rotation" className="sm:col-span-2">
        <SimpleSelect
          value={rotationId}
          onValueChange={setRotationId}
          options={rotations.map((r) => ({
            value: String(r.id),
            label: `Rotation #${r.id} · ${
              aircraft.get(r.aircraft_id)?.registration ?? "unassigned"
            }`,
          }))}
          placeholder="Pick a rotation"
        />
      </Field>
      <Field label="Gate">
        <SimpleSelect
          value={gateId}
          onValueChange={setGateId}
          options={gates.map((g) => ({ value: String(g.id), label: g.code }))}
          placeholder="Pick a gate"
        />
      </Field>
      <Field label="Source">
        <SimpleSelect
          value={source}
          onValueChange={setSource}
          options={SOURCE_OPTIONS}
        />
      </Field>
      <Field label="From" htmlFor="assignment-start">
        <Input
          id="assignment-start"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </Field>
      <Field label="Until" htmlFor="assignment-end">
        <Input
          id="assignment-end"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}

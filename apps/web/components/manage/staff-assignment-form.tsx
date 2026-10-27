"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Rotation, Shift, Staff, StaffAssignment } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function StaffAssignmentForm({
  open,
  item,
  onOpenChange,
  onSaved,
  shifts,
  staff,
  rotations,
}: CrudFormProps<StaffAssignment> & {
  shifts: Shift[];
  staff: Staff[];
  rotations: Rotation[];
}) {
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const [shiftId, setShiftId] = React.useState(
    String(item?.shift_id ?? shifts[0]?.id ?? "")
  );
  const [rotationId, setRotationId] = React.useState(
    String(item?.rotation_id ?? rotations[0]?.id ?? "")
  );
  const [task, setTask] = React.useState(item?.task ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shiftId || !rotationId || !task.trim()) {
      setError("A shift, rotation and task are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      shift_id: Number(shiftId),
      rotation_id: Number(rotationId),
      task: task.trim(),
    };
    try {
      if (item) {
        await api.updateStaffAssignment(item.id, payload);
      } else {
        await api.createStaffAssignment(payload);
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the assignment."
      );
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit assignment" : "New assignment"}
      description="Rosters a shift onto a rotation's ramp tasks."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Shift" className="sm:col-span-2">
        <SimpleSelect
          value={shiftId}
          onValueChange={setShiftId}
          options={shifts.map((s) => ({
            value: String(s.id),
            label: `${staffById.get(s.staff_id)?.name ?? `Staff #${s.staff_id}`} · Shift #${s.id}`,
          }))}
          placeholder="Pick a shift"
        />
      </Field>
      <Field label="Rotation">
        <SimpleSelect
          value={rotationId}
          onValueChange={setRotationId}
          options={rotations.map((r) => ({
            value: String(r.id),
            label: `Rotation #${r.id}`,
          }))}
          placeholder="Pick a rotation"
        />
      </Field>
      <Field label="Task" htmlFor="assignment-task">
        <Input
          id="assignment-task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="baggage_load"
        />
      </Field>
    </FormDialog>
  );
}

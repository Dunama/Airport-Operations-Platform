"use client";

import * as React from "react";

import { api } from "@/lib/api";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import type { Shift, Staff } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function ShiftForm({
  open,
  item,
  onOpenChange,
  onSaved,
  staff,
}: CrudFormProps<Shift> & { staff: Staff[] }) {
  const [staffId, setStaffId] = React.useState(
    String(item?.staff_id ?? staff[0]?.id ?? "")
  );
  const [start, setStart] = React.useState(toLocalInput(item?.start));
  const [end, setEnd] = React.useState(toLocalInput(item?.end));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startIso = fromLocalInput(start);
    const endIso = fromLocalInput(end);
    if (!staffId || !startIso || !endIso) {
      setError("A staff member and shift window are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = { staff_id: Number(staffId), start: startIso, end: endIso };
    try {
      if (item) {
        await api.updateShift(item.id, payload);
      } else {
        await api.createShift(payload);
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save the shift — it may overlap an existing one."
      );
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit shift" : "New shift"}
      description="Shifts for the same staff member cannot overlap."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Staff member" className="sm:col-span-2">
        <SimpleSelect
          value={staffId}
          onValueChange={setStaffId}
          options={staff.map((s) => ({
            value: String(s.id),
            label: `${s.name} · ${s.skill}`,
          }))}
          placeholder="Pick a staff member"
        />
      </Field>
      <Field label="Start" htmlFor="shift-start">
        <Input
          id="shift-start"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </Field>
      <Field label="End" htmlFor="shift-end">
        <Input
          id="shift-end"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}

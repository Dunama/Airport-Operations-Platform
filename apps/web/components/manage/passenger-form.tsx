"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Passenger } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function PassengerForm({
  open,
  item,
  onOpenChange,
  onSaved,
}: CrudFormProps<Passenger>) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [nationality, setNationality] = React.useState(item?.nationality ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !nationality.trim()) {
      setError("A name and nationality are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = { name: name.trim(), nationality: nationality.trim() };
    try {
      if (item) {
        await api.updatePassenger(item.id, payload);
      } else {
        await api.createPassenger(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the passenger.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit passenger" : "New passenger"}
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Name" htmlFor="passenger-name">
        <Input
          id="passenger-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Amaka Obi"
        />
      </Field>
      <Field label="Nationality" htmlFor="passenger-nationality">
        <Input
          id="passenger-nationality"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="Nigerian"
        />
      </Field>
    </FormDialog>
  );
}

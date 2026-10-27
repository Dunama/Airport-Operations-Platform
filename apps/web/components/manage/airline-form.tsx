"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Airline } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function AirlineForm({
  open,
  item,
  onOpenChange,
  onSaved,
}: CrudFormProps<Airline>) {
  const [iata, setIata] = React.useState(item?.iata ?? "");
  const [name, setName] = React.useState(item?.name ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = iata.trim().toUpperCase();
    const label = name.trim();
    if (code.length < 2 || !label) {
      setError("An IATA code and a name are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (item) {
        await api.updateAirline(item.id, { iata: code, name: label });
      } else {
        await api.createAirline({ iata: code, name: label });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the airline.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit airline" : "New airline"}
      description="Airlines own aircraft and operate the flight schedule."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="IATA code" htmlFor="airline-iata">
        <Input
          id="airline-iata"
          value={iata}
          onChange={(e) => setIata(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="HM"
        />
      </Field>
      <Field label="Name" htmlFor="airline-name">
        <Input
          id="airline-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Harmattan Air"
        />
      </Field>
    </FormDialog>
  );
}

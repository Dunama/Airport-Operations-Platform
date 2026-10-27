"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Airport } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function AirportForm({
  open,
  item,
  onOpenChange,
  onSaved,
}: CrudFormProps<Airport>) {
  const [iata, setIata] = React.useState(item?.iata ?? "");
  const [icao, setIcao] = React.useState(item?.icao ?? "");
  const [name, setName] = React.useState(item?.name ?? "");
  const [timezone, setTimezone] = React.useState(item?.timezone ?? "UTC");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      iata: iata.trim().toUpperCase(),
      icao: icao.trim().toUpperCase(),
      name: name.trim(),
      timezone: timezone.trim(),
    };
    if (payload.iata.length !== 3 || payload.icao.length !== 4 || !payload.name) {
      setError("Use a 3-letter IATA, 4-letter ICAO and a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (item) {
        await api.updateAirport(item.id, payload);
      } else {
        await api.createAirport(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the airport.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit airport" : "New airport"}
      description="Airports are referenced as flight origins and destinations."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="IATA" htmlFor="airport-iata">
        <Input
          id="airport-iata"
          value={iata}
          onChange={(e) => setIata(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="LOS"
        />
      </Field>
      <Field label="ICAO" htmlFor="airport-icao">
        <Input
          id="airport-icao"
          value={icao}
          onChange={(e) => setIcao(e.target.value.toUpperCase())}
          maxLength={4}
          placeholder="DNMM"
        />
      </Field>
      <Field label="Name" htmlFor="airport-name" className="sm:col-span-2">
        <Input
          id="airport-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Murtala Muhammed International Airport"
        />
      </Field>
      <Field label="Timezone" htmlFor="airport-timezone" hint="IANA name, e.g. Africa/Lagos">
        <Input
          id="airport-timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="Africa/Lagos"
        />
      </Field>
    </FormDialog>
  );
}

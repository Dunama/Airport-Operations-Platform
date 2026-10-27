"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Aircraft, AircraftType, Airline } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function AircraftForm({
  open,
  item,
  onOpenChange,
  onSaved,
  airlines,
  types,
}: CrudFormProps<Aircraft> & {
  airlines: Airline[];
  types: AircraftType[];
}) {
  const [registration, setRegistration] = React.useState(
    item?.registration ?? ""
  );
  const [airlineId, setAirlineId] = React.useState(
    String(item?.airline_id ?? airlines[0]?.id ?? "")
  );
  const [typeId, setTypeId] = React.useState(
    String(item?.type_id ?? types[0]?.id ?? "")
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registration.trim() || !airlineId || !typeId) {
      setError("Registration, airline and type are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      registration: registration.trim().toUpperCase(),
      airline_id: Number(airlineId),
      type_id: Number(typeId),
    };
    try {
      if (item) {
        await api.updateAircraft(item.id, payload);
      } else {
        await api.createAircraft(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the aircraft.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit aircraft" : "New aircraft"}
      description="Aircraft link an airline to a type and are used by rotations."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Registration" htmlFor="aircraft-reg">
        <Input
          id="aircraft-reg"
          value={registration}
          onChange={(e) => setRegistration(e.target.value.toUpperCase())}
          placeholder="5N-HMA"
        />
      </Field>
      <Field label="Airline">
        <SimpleSelect
          value={airlineId}
          onValueChange={setAirlineId}
          options={airlines.map((a) => ({
            value: String(a.id),
            label: `${a.iata} — ${a.name}`,
          }))}
          placeholder="Pick an airline"
        />
      </Field>
      <Field label="Type" className="sm:col-span-2">
        <SimpleSelect
          value={typeId}
          onValueChange={setTypeId}
          options={types.map((t) => ({
            value: String(t.id),
            label: `${t.icao_code} — ${t.seats} seats`,
          }))}
          placeholder="Pick a type"
        />
      </Field>
    </FormDialog>
  );
}

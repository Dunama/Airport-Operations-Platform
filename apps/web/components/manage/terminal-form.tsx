"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Airport, Terminal } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field } from "./fields";
import { AirportPicker, airportLabel } from "./airport-picker";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function TerminalForm({
  open,
  item,
  onOpenChange,
  onSaved,
  airports,
}: CrudFormProps<Terminal> & { airports: Map<number, Airport> }) {
  const [code, setCode] = React.useState(item?.code ?? "");
  const [airportId, setAirportId] = React.useState<number | null>(
    item?.airport_id ?? null
  );
  const [airportLabelValue, setAirportLabelValue] = React.useState<
    string | undefined
  >(
    item
      ? airportLabelOrId(airports.get(item.airport_id), item.airport_id)
      : undefined
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim() || !airportId) {
      setError("A terminal code and airport are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = { airport_id: airportId, code: code.trim().toUpperCase() };
    try {
      if (item) {
        await api.updateTerminal(item.id, payload);
      } else {
        await api.createTerminal(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the terminal.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit terminal" : "New terminal"}
      description="Terminals group gates within an airport."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Airport">
        <AirportPicker
          initialLabel={airportLabelValue}
          onChange={(airport) => {
            setAirportId(airport.id);
            setAirportLabelValue(airportLabel(airport));
          }}
        />
      </Field>
      <Field label="Code" htmlFor="terminal-code">
        <Input
          id="terminal-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="T1"
        />
      </Field>
    </FormDialog>
  );
}

function airportLabelOrId(airport: Airport | undefined, id: number): string {
  return airport ? airportLabel(airport) : `Airport #${id}`;
}

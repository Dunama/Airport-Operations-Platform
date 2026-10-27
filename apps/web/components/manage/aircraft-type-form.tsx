"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { AircraftType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

const SIZE_OPTIONS = ["A", "B", "C", "D", "E", "F"].map((value) => ({
  value,
  label: value,
}));

export function AircraftTypeForm({
  open,
  item,
  onOpenChange,
  onSaved,
}: CrudFormProps<AircraftType>) {
  const [icaoCode, setIcaoCode] = React.useState(item?.icao_code ?? "");
  const [size, setSize] = React.useState(item?.size ?? "C");
  const [seats, setSeats] = React.useState(String(item?.seats ?? ""));
  const [turnMin, setTurnMin] = React.useState(
    String(item?.typical_turn_min ?? "")
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const seatCount = Number(seats);
    const turn = Number(turnMin);
    if (!icaoCode.trim() || !seatCount || !turn) {
      setError("ICAO code, seat count and turnaround minutes are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      icao_code: icaoCode.trim().toUpperCase(),
      size,
      seats: seatCount,
      typical_turn_min: turn,
    };
    try {
      if (item) {
        await api.updateAircraftType(item.id, payload);
      } else {
        await api.createAircraftType(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the type.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit aircraft type" : "New aircraft type"}
      description="Types drive seat capacity and typical turnaround duration."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="ICAO code" htmlFor="type-icao">
        <Input
          id="type-icao"
          value={icaoCode}
          onChange={(e) => setIcaoCode(e.target.value.toUpperCase())}
          maxLength={4}
          placeholder="B738"
        />
      </Field>
      <Field label="Wake size">
        <SimpleSelect
          value={size}
          onValueChange={setSize}
          options={SIZE_OPTIONS}
        />
      </Field>
      <Field label="Seats" htmlFor="type-seats">
        <Input
          id="type-seats"
          type="number"
          min={1}
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          placeholder="162"
        />
      </Field>
      <Field label="Typical turn (min)" htmlFor="type-turn">
        <Input
          id="type-turn"
          type="number"
          min={1}
          value={turnMin}
          onChange={(e) => setTurnMin(e.target.value)}
          placeholder="45"
        />
      </Field>
    </FormDialog>
  );
}

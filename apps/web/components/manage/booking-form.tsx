"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Booking, Flight, Passenger } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function BookingForm({
  open,
  item,
  onOpenChange,
  onSaved,
  flights,
  passengers,
}: CrudFormProps<Booking> & { flights: Flight[]; passengers: Passenger[] }) {
  const [flightId, setFlightId] = React.useState(
    String(item?.flight_id ?? flights[0]?.id ?? "")
  );
  const [passengerId, setPassengerId] = React.useState(
    String(item?.passenger_id ?? passengers[0]?.id ?? "")
  );
  const [seat, setSeat] = React.useState(item?.seat ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!flightId || !passengerId || !seat.trim()) {
      setError("A flight, passenger and seat are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      flight_id: Number(flightId),
      passenger_id: Number(passengerId),
      seat: seat.trim().toUpperCase(),
    };
    try {
      if (item) {
        await api.updateBooking(item.id, payload);
      } else {
        await api.createBooking(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the booking.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit booking" : "New booking"}
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Flight" className="sm:col-span-2">
        <SimpleSelect
          value={flightId}
          onValueChange={setFlightId}
          options={flights.map((f) => ({
            value: String(f.id),
            label: `${f.flight_no} · ${f.sched_time.slice(0, 10)}`,
          }))}
          placeholder="Pick a flight"
        />
      </Field>
      <Field label="Passenger">
        <SimpleSelect
          value={passengerId}
          onValueChange={setPassengerId}
          options={passengers.map((p) => ({
            value: String(p.id),
            label: p.name,
          }))}
          placeholder="Pick a passenger"
        />
      </Field>
      <Field label="Seat" htmlFor="booking-seat">
        <Input
          id="booking-seat"
          value={seat}
          onChange={(e) => setSeat(e.target.value.toUpperCase())}
          placeholder="14C"
        />
      </Field>
    </FormDialog>
  );
}

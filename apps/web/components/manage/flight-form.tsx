"use client";

import * as React from "react";

import { api } from "@/lib/api";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import {
  FLIGHT_DIRECTIONS,
  FLIGHT_STATUSES,
  type Aircraft,
  type AircraftType,
  type Airline,
  type Airport,
  type Flight,
  type FlightDirection,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { AirportPicker, airportLabel } from "./airport-picker";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

const DIRECTION_LABELS: Record<FlightDirection, string> = {
  ARR: "Arrival (ARR)",
  DEP: "Departure (DEP)",
  IN: "Inbound (IN)",
  OUT: "Outbound (OUT)",
};

const STATUS_OPTIONS = FLIGHT_STATUSES.map((value) => ({
  value,
  label: value[0]!.toUpperCase() + value.slice(1),
}));

const DIRECTION_OPTIONS = FLIGHT_DIRECTIONS.map((value) => ({
  value,
  label: DIRECTION_LABELS[value],
}));

export function FlightForm({
  open,
  item,
  onOpenChange,
  onSaved,
  airlines,
  aircraft,
  aircraftTypes,
  airports,
}: CrudFormProps<Flight> & {
  airlines: Airline[];
  aircraft: Aircraft[];
  aircraftTypes: AircraftType[];
  airports: Map<number, Airport>;
}) {
  const [flightNo, setFlightNo] = React.useState(item?.flight_no ?? "");
  const [direction, setDirection] = React.useState<FlightDirection>(
    item?.direction ?? "DEP"
  );
  const [airlineId] = React.useState(
    String(item?.airline_id ?? airlines[0]?.id ?? "")
  );
  const [originId, setOriginId] = React.useState<number | null>(
    item?.origin_id ?? null
  );
  const [originLabel, setOriginLabel] = React.useState<string | undefined>(
    item ? airportLabelOrId(airports.get(item.origin_id), item.origin_id) : undefined
  );
  const [destId, setDestId] = React.useState<number | null>(
    item?.dest_id ?? null
  );
  const [destLabel, setDestLabel] = React.useState<string | undefined>(
    item ? airportLabelOrId(airports.get(item.dest_id), item.dest_id) : undefined
  );
  const [aircraftId, setAircraftId] = React.useState("");
  const [sched, setSched] = React.useState(toLocalInput(item?.sched_time));
  const [status, setStatus] = React.useState(item?.status ?? "scheduled");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const typeById = new Map(aircraftTypes.map((t) => [t.id, t.icao_code]));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const schedIso = fromLocalInput(sched);
    if (!flightNo.trim() || !airlineId || !originId || !destId || !schedIso) {
      setError("Flight number, airline, origin, destination and time are required.");
      return;
    }
    if (!item && !aircraftId) {
      setError("Pick an aircraft so a rotation can be created.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (item) {
        await api.updateFlight(item.id, {
          flight_no: flightNo.trim().toUpperCase(),
          direction,
          airline_id: Number(airlineId),
          origin_id: originId,
          dest_id: destId,
          status,
          sched_time: schedIso,
        });
      } else {
        await api.createFlight({
          flight_no: flightNo.trim().toUpperCase(),
          direction,
          airline_id: Number(airlineId),
          origin_id: originId,
          dest_id: destId,
          status,
          sched_time: schedIso,
          aircraft_id: Number(aircraftId),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the flight.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? `Edit ${item.flight_no}` : "New flight"}
      description={
        item
          ? "Changes publish to the flight board immediately."
          : "Creating an aircraft rotation keeps the turnaround board in sync."
      }
      error={error}
      busy={busy}
      onSubmit={submit}
      submitLabel={item ? "Save changes" : "Create flight"}
    >
      <Field label="Flight number" htmlFor="flight-no">
        <Input
          id="flight-no"
          value={flightNo}
          onChange={(e) => setFlightNo(e.target.value.toUpperCase())}
          placeholder="HM100"
        />
      </Field>
      <Field label="Direction">
        <SimpleSelect
          value={direction}
          onValueChange={(v) => setDirection(v as FlightDirection)}
          options={DIRECTION_OPTIONS}
        />
      </Field>
      {item ? (
        <Field label="Airline">
          <Input value={String(item.airline_id)} disabled />
        </Field>
      ) : null}
      <Field label="Status">
        <SimpleSelect
          value={status}
          onValueChange={setStatus}
          options={STATUS_OPTIONS}
        />
      </Field>
      <Field label="Origin">
        <AirportPicker
          initialLabel={originLabel}
          onChange={(airport) => {
            setOriginId(airport.id);
            setOriginLabel(airportLabel(airport));
          }}
        />
      </Field>
      <Field label="Destination">
        <AirportPicker
          initialLabel={destLabel}
          onChange={(airport) => {
            setDestId(airport.id);
            setDestLabel(airportLabel(airport));
          }}
        />
      </Field>
      <Field label="Scheduled time" htmlFor="flight-sched">
        <Input
          id="flight-sched"
          type="datetime-local"
          value={sched}
          onChange={(e) => setSched(e.target.value)}
        />
      </Field>
      {!item && (
        <Field
          label="Aircraft"
          hint="A rotation and turnaround are created automatically."
        >
          <SimpleSelect
            value={aircraftId}
            onValueChange={setAircraftId}
            options={aircraft.map((a) => ({
              value: String(a.id),
              label: `${a.registration}${
                typeById.get(a.type_id) ? ` · ${typeById.get(a.type_id)}` : ""
              }`,
            }))}
            placeholder="Pick an aircraft"
          />
        </Field>
      )}
    </FormDialog>
  );
}

function airportLabelOrId(
  airport: Airport | undefined,
  id: number
): string {
  return airport ? airportLabel(airport) : `Airport #${id}`;
}

"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Charge, Flight } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function ChargeForm({
  open,
  item,
  onOpenChange,
  onSaved,
  flights,
}: CrudFormProps<Charge> & { flights: Flight[] }) {
  const [flightId, setFlightId] = React.useState(
    String(item?.flight_id ?? flights[0]?.id ?? "")
  );
  const [kind, setKind] = React.useState(item?.kind ?? "");
  const [amount, setAmount] = React.useState(
    item ? String(item.amount_minor / 100) : ""
  );
  const [currency, setCurrency] = React.useState(item?.currency ?? "NGN");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountValue = Number(amount);
    if (!flightId || !kind.trim() || !amountValue || currency.trim().length !== 3) {
      setError("A flight, charge kind, amount and 3-letter currency are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      flight_id: Number(flightId),
      kind: kind.trim(),
      amount_minor: Math.round(amountValue * 100),
      currency: currency.trim().toUpperCase(),
    };
    try {
      if (item) {
        await api.updateCharge(item.id, payload);
      } else {
        await api.createCharge(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the charge.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit charge" : "New charge"}
      description="Billable charges levied against a flight."
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
      <Field label="Kind" htmlFor="charge-kind">
        <Input
          id="charge-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          placeholder="landing_fee"
        />
      </Field>
      <Field label="Amount" htmlFor="charge-amount" hint="In whole currency units.">
        <Input
          id="charge-amount"
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="150.00"
        />
      </Field>
      <Field label="Currency" htmlFor="charge-currency">
        <Input
          id="charge-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="NGN"
        />
      </Field>
    </FormDialog>
  );
}

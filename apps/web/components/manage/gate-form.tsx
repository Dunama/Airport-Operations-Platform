"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Gate, Terminal } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

const KIND_OPTIONS = [
  { value: "contact", label: "Contact" },
  { value: "remote", label: "Remote" },
];

const SIZE_OPTIONS = ["C", "D", "E", "F"].map((value) => ({ value, label: value }));

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "maintenance", label: "Maintenance" },
];

const BOOL_OPTIONS = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

export function GateForm({
  open,
  item,
  onOpenChange,
  onSaved,
  terminals,
}: CrudFormProps<Gate> & { terminals: Terminal[] }) {
  const [terminalId, setTerminalId] = React.useState(
    String(item?.terminal_id ?? terminals[0]?.id ?? "")
  );
  const [code, setCode] = React.useState(item?.code ?? "");
  const [kind, setKind] = React.useState(item?.kind ?? "contact");
  const [maxSize, setMaxSize] = React.useState(item?.max_size ?? "D");
  const [intlCapable, setIntlCapable] = React.useState(
    String(item?.intl_capable ?? false)
  );
  const [status, setStatus] = React.useState(item?.status ?? "open");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!terminalId || !code.trim()) {
      setError("A terminal and gate code are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      terminal_id: Number(terminalId),
      code: code.trim().toUpperCase(),
      kind,
      max_size: maxSize,
      intl_capable: intlCapable === "true",
      status,
    };
    try {
      if (item) {
        await api.updateGate(item.id, payload);
      } else {
        await api.createGate(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the gate.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit gate" : "New gate"}
      description="Gates belong to a terminal and host rotations on the apron."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Terminal">
        <SimpleSelect
          value={terminalId}
          onValueChange={setTerminalId}
          options={terminals.map((t) => ({
            value: String(t.id),
            label: t.code,
          }))}
          placeholder="Pick a terminal"
        />
      </Field>
      <Field label="Code" htmlFor="gate-code">
        <Input
          id="gate-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="A1"
        />
      </Field>
      <Field label="Kind">
        <SimpleSelect value={kind} onValueChange={setKind} options={KIND_OPTIONS} />
      </Field>
      <Field label="Max aircraft size">
        <SimpleSelect
          value={maxSize}
          onValueChange={setMaxSize}
          options={SIZE_OPTIONS}
        />
      </Field>
      <Field label="International capable">
        <SimpleSelect
          value={intlCapable}
          onValueChange={setIntlCapable}
          options={BOOL_OPTIONS}
        />
      </Field>
      <Field label="Status">
        <SimpleSelect
          value={status}
          onValueChange={setStatus}
          options={STATUS_OPTIONS}
        />
      </Field>
    </FormDialog>
  );
}

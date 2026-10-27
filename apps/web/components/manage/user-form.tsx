"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { Airline, AppUser, RoleRecord } from "@/lib/types";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

const BOOL_OPTIONS = [
  { value: "false", label: "Inactive" },
  { value: "true", label: "Active" },
];

export function UserForm({
  open,
  item,
  onOpenChange,
  onSaved,
  roles,
  airlines,
}: CrudFormProps<AppUser> & { roles: RoleRecord[]; airlines: Airline[] }) {
  const [roleId, setRoleId] = React.useState(String(item?.role_id ?? ""));
  const [airlineId, setAirlineId] = React.useState(
    String(item?.airline_id ?? "")
  );
  const [isActive, setIsActive] = React.useState(
    String(item?.is_active ?? false)
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!item) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roleId || !airlineId) {
      setError("A role and airline are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.updateUser(item!.id, {
        role_id: Number(roleId),
        airline_id: Number(airlineId),
        is_active: isActive === "true",
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the user.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${item.email}`}
      description="Users register themselves — admins manage role, airline and access here."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Role">
        <SimpleSelect
          value={roleId}
          onValueChange={setRoleId}
          options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
          placeholder="Pick a role"
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
      <Field label="Access" className="sm:col-span-2">
        <SimpleSelect
          value={isActive}
          onValueChange={setIsActive}
          options={BOOL_OPTIONS}
        />
      </Field>
    </FormDialog>
  );
}

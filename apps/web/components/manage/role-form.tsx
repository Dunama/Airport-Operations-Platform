"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { RoleRecord } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function RoleForm({
  open,
  item,
  onOpenChange,
  onSaved,
}: CrudFormProps<RoleRecord>) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = name.trim();
    if (!label) {
      setError("A role name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (item) {
        await api.updateRole(item.id, { name: label });
      } else {
        await api.createRole({ name: label });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the role.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit role" : "New role"}
      description="Roles gate what a user can see and manage across the app."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Name" htmlFor="role-name" className="sm:col-span-2">
        <Input
          id="role-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ops"
        />
      </Field>
    </FormDialog>
  );
}

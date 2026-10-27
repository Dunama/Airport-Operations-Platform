"use client";

import * as React from "react";

import { api } from "@/lib/api";
import type { AppUser, Staff } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "./fields";
import { FormDialog } from "./form-dialog";
import type { CrudFormProps } from "./form-props";

export function StaffForm({
  open,
  item,
  onOpenChange,
  onSaved,
  users,
}: CrudFormProps<Staff> & { users: AppUser[] }) {
  const [userId, setUserId] = React.useState(
    String(item?.user_id ?? users[0]?.id ?? "")
  );
  const [name, setName] = React.useState(item?.name ?? "");
  const [skill, setSkill] = React.useState(item?.skill ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !name.trim() || !skill.trim()) {
      setError("A linked account, name and skill are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      user_id: Number(userId),
      name: name.trim(),
      skill: skill.trim(),
    };
    try {
      if (item) {
        await api.updateStaff(item.id, payload);
      } else {
        await api.createStaff(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the staff member.");
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit staff member" : "New staff member"}
      description="Links a ground-crew profile to a login account."
      error={error}
      busy={busy}
      onSubmit={submit}
    >
      <Field label="Account" className="sm:col-span-2">
        <SimpleSelect
          value={userId}
          onValueChange={setUserId}
          options={users.map((u) => ({ value: String(u.id), label: u.email }))}
          placeholder="Pick an account"
        />
      </Field>
      <Field label="Name" htmlFor="staff-name">
        <Input
          id="staff-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ade Bello"
        />
      </Field>
      <Field label="Skill" htmlFor="staff-skill">
        <Input
          id="staff-skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="ramp agent"
        />
      </Field>
    </FormDialog>
  );
}

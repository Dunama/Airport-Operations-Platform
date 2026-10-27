"use client";

import * as React from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/async/states";
import { useToast } from "@/components/toast/toast-provider";
import { ConfirmDialog } from "./confirm-dialog";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface CrudManagerProps<T extends { id: number }> {
  rows: T[];
  columns: Column<T>[];
  searchText: (row: T) => string;
  searchPlaceholder?: string;
  createLabel: string;
  /** Overrides the entity name used in toast copy (derived from createLabel otherwise). */
  entityLabel?: string;
  canCreate?: boolean;
  emptyTitle: string;
  emptyHint?: string;
  canManage: boolean;
  deleteTitle: (row: T) => string;
  deleteDescription?: (row: T) => string;
  onDelete: (row: T) => Promise<void>;
  onChanged: () => void;
  renderForm: (args: {
    open: boolean;
    item: T | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
  }) => React.ReactNode;
}

function deriveLabel(createLabel: string): string {
  return createLabel
    .replace(/^New\s+/i, "")
    .replace(/^Assign (a|an)\s+/i, "")
    .trim();
}

function capitalize(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text;
}

export function CrudManager<T extends { id: number }>({
  rows,
  columns,
  searchText,
  searchPlaceholder = "Search…",
  createLabel,
  entityLabel,
  canCreate = true,
  emptyTitle,
  emptyHint,
  canManage,
  deleteTitle,
  deleteDescription,
  onDelete,
  onChanged,
  renderForm,
}: CrudManagerProps<T>) {
  const { toast } = useToast();
  const label = entityLabel ?? deriveLabel(createLabel);
  const [query, setQuery] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<T | null>(null);
  const [deleting, setDeleting] = React.useState<T | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((row) => searchText(row).toLowerCase().includes(q))
    : rows;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await onDelete(deleting);
      setDeleting(null);
      toast({ variant: "success", title: `${capitalize(label)} deleted` });
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed.";
      setDeleteError(message);
      toast({
        variant: "error",
        title: `Couldn't delete ${label}`,
        description: message,
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>
        {canManage && canCreate && (
          <Button type="button" onClick={openCreate} className="ml-auto">
            <Plus />
            {createLabel}
          </Button>
        )}
      </div>

      <Card className="p-0 ring-0">
        {filtered.length === 0 ? (
          <EmptyState title={emptyTitle} hint={emptyHint} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.header} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
                {canManage && <TableHead className="w-24 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.header} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(row);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {renderForm({
        open: formOpen,
        item: editing,
        onOpenChange: setFormOpen,
        onSaved: () => {
          const wasEditing = editing !== null;
          setFormOpen(false);
          toast({
            variant: "success",
            title: `${capitalize(label)} ${wasEditing ? "updated" : "created"}`,
          });
          onChanged();
        },
      })}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={deleting ? deleteTitle(deleting) : "Delete record"}
        description={
          deleting && deleteDescription
            ? deleteDescription(deleting)
            : "This action cannot be undone."
        }
        busy={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

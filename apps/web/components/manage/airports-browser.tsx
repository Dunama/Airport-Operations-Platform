"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import type { Airport } from "@/lib/types";
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
import { EmptyState, ErrorState, ListSkeleton } from "@/components/async/states";
import { useToast } from "@/components/toast/toast-provider";
import { AirportForm } from "./airport-form";
import { ConfirmDialog } from "./confirm-dialog";

const PAGE_SIZE = 50;

export function AirportsBrowser({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast();
  const [term, setTerm] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [nonce, setNonce] = React.useState(0);
  const [rows, setRows] = React.useState<Airport[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Airport | null>(null);
  const [deleting, setDeleting] = React.useState<Airport | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => setNonce((n) => n + 1), []);

  React.useEffect(() => {
    let active = true;
    const offset = page * PAGE_SIZE;
    Promise.all([
      api.listAirportsPage({
        search: search || undefined,
        offset,
        limit: PAGE_SIZE,
      }),
      api.countAirports(search || undefined),
    ]).then(
      ([items, count]) => {
        if (!active) return;
        if (items.length === 0 && page > 0) {
          setLoading(true);
          setPage((p) => Math.max(0, p - 1));
          return;
        }
        setRows(items);
        setTotal(count.total);
        setError(null);
        setLoading(false);
      },
      (err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load airports.");
        setLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [search, page, nonce]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setPage(0);
    setSearch(term.trim());
    refresh();
  }

  function goTo(next: number) {
    setLoading(true);
    setPage(next);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.deleteAirport(deleting.id);
      setDeleting(null);
      toast({ variant: "success", title: "Airport deleted" });
      refresh();
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed.";
      setDeleteError(message);
      toast({ variant: "error", title: "Couldn't delete airport", description: message });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={runSearch} className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search airport by IATA, ICAO or name…"
            className="pl-9"
            aria-label="Search airports"
          />
        </form>
        <Button
          type="button"
          className="ml-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          New airport
        </Button>
      </div>

      {error ? (
        <ErrorState error={new ApiError(0, error)} onRetry={refresh} />
      ) : loading ? (
        <ListSkeleton rows={8} />
      ) : rows.length === 0 ? (
        <Card className="p-0 ring-0">
          <EmptyState
            title="No airports found"
            hint={search ? "Try a different search term." : "Add an airport."}
          />
        </Card>
      ) : (
        <>
          <Card className="p-0 ring-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IATA</TableHead>
                  <TableHead>ICAO</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Timezone</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((airport) => (
                  <TableRow key={airport.id}>
                    <TableCell className="font-medium">{airport.iata}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {airport.icao}
                    </TableCell>
                    <TableCell>{airport.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {airport.timezone}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(airport);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(airport);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString()} airport{total === 1 ? "" : "s"}
              {search ? ` matching “${search}”` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => goTo(page - 1)}
              >
                <ChevronLeft />
                Prev
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                Page {page + 1} / {pageCount.toLocaleString()}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page + 1 >= pageCount}
                onClick={() => goTo(page + 1)}
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}

      <AirportForm
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        item={editing}
        onOpenChange={setFormOpen}
        onSaved={() => {
          const wasEditing = editing !== null;
          setFormOpen(false);
          toast({
            variant: "success",
            title: `Airport ${wasEditing ? "updated" : "created"}`,
          });
          refresh();
          onChanged();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={deleting ? `Delete ${deleting.iata}` : "Delete airport"}
        description="This removes the airport from the reference set. Flights referencing it will block the delete."
        busy={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

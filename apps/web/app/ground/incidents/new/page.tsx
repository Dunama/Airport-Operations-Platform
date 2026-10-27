"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { loadFlightsView } from "@/lib/data";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/layout/page-header";
import { IncidentForm } from "@/components/incident/incident-form";
import { Query } from "@/components/async/query";
import { ListSkeleton } from "@/components/async/states";
import { Button } from "@/components/ui/button";

export default function NewIncidentPage() {
  const result = useAsync("flights+gates", loadFlightsView);

  return (
    <div>
      <Button
        render={<Link href="/ground/incidents" />}
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="mb-4"
      >
        <ArrowLeft />
        All incidents
      </Button>
      <PageHeader
        title="Report incident"
        description="Log a new ground incident against a flight"
      />
      <Query result={result} skeleton={<ListSkeleton rows={4} />}>
        {({ flights, reference }) => (
          <IncidentForm flights={flights} gates={Array.from(reference.gates.values())} />
        )}
      </Query>
    </div>
  );
}

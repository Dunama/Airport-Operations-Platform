"use client";

import { loadFlightsView } from "@/lib/data";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/layout/page-header";
import { FlightBoard } from "@/components/flight/flight-board";
import { Query } from "@/components/async/query";
import { ListSkeleton } from "@/components/async/states";

export default function FlightBoardPage() {
  const result = useAsync("flights", loadFlightsView);

  return (
    <div>
      <PageHeader
        title="Flight board"
        description="Arrivals and departures across the station"
      />
      <Query result={result} skeleton={<ListSkeleton rows={8} />}>
        {({ flights, airports, reference }) => (
          <FlightBoard
            flights={flights}
            airports={airports}
            airlines={reference.airlines}
            baseHref="/ground/flights"
          />
        )}
      </Query>
    </div>
  );
}

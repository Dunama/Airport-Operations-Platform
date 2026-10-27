"use client";

import { loadFlightsView } from "@/lib/data";
import { useAsync } from "@/lib/use-async";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/layout/page-header";
import { FlightBoard } from "@/components/flight/flight-board";
import { Query } from "@/components/async/query";
import { ListSkeleton } from "@/components/async/states";

export default function AirlineFlightsPage() {
  const session = useSession();
  const airlineId = session?.airlineId ?? 0;
  const result = useAsync("flights", loadFlightsView);

  return (
    <div>
      <PageHeader title="Flights" description="Your airline's flight board" />
      <Query result={result} skeleton={<ListSkeleton rows={8} />}>
        {({ flights, airports, reference }) => {
          const filtered = airlineId
            ? flights.filter((f) => f.airline_id === airlineId)
            : flights;
          return (
            <FlightBoard
              flights={filtered}
              airports={airports}
              airlines={reference.airlines}
              baseHref="/airline/flights"
            />
          );
        }}
      </Query>
    </div>
  );
}

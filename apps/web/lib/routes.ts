const resource = (prefix: string) => ({
  collection: prefix,
  item: (id: number | string) => `${prefix}/${id}`,
});

export const API_ROUTES = {
  health: "/health",
  auth: {
    login: "/auth/login",
    me: "/auth/me",
    users: resource("/auth/users"),
  },
  airports: {
    ...resource("/airports"),
    count: "/airports/count",
  },
  terminals: resource("/terminals"),
  flights: {
    ...resource("/flights"),
    events: "/flights/events",
    delayPredictions: "/flights/delay-predictions",
  },
  airlines: resource("/airlines"),
  aircraft: resource("/aircraft"),
  aircraftTypes: resource("/aircraft-types"),
  gates: resource("/gates"),
  activity: "/activity",
  opensky: { inbound: "/opensky/inbound" },
  gateAssignments: resource("/gate-assignments"),
  optimizationRuns: resource("/optimization-runs"),
  operations: {
    rotations: resource("/operations/rotations"),
    turnarounds: {
      collection: "/operations/turnarounds",
      item: (rotationId: number | string) =>
        `/operations/turnarounds/${rotationId}`,
    },
    incidents: resource("/operations/incidents"),
    baggage: "/operations/baggage",
    baggageRaw: resource("/operations/baggage/raw"),
    baggageEvents: "/operations/baggage-events",
    staff: resource("/operations/staff"),
    shifts: resource("/operations/shifts"),
    staffAssignments: resource("/operations/staff-assignments"),
    charges: resource("/operations/charges"),
    roles: resource("/operations/roles"),
    passengers: resource("/operations/passengers"),
    bookings: resource("/operations/bookings"),
  },
} as const;

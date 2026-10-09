# 0001. Modular monolith

- Status: Accepted
- Date: 2026-10-09

## Context

The backend is one FastAPI application already divided into domain-oriented modules such as auth, flights, and gates. The project is being built by a solo developer on an eight-week timeline and needs a small deployment footprint.

## Decision

Keep the backend as a modular monolith: one FastAPI process with clear internal modules and shared database infrastructure.

## Alternatives considered

- Microservices: more deployment and operational overhead than the current scope requires.
- A single unstructured module: simpler initially, but it would make domain boundaries harder to maintain.

## Consequences

Local development and deployment stay straightforward, and module boundaries can evolve without network calls between services. The application remains coupled at process and database level, so independent scaling is not available yet. Revisit this if a domain develops separate scaling or reliability needs.

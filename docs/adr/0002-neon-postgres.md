# 0002. Neon Postgres and local Docker

- Status: Accepted
- Date: 2026-10-09

## Context

The deployed backend uses Postgres on Neon's free plan. Neon suspends after five minutes of idle time, while local development needs a repeatable database without depending on a hosted service.

## Decision

Use Neon Postgres for the deployed application and the `postgis/postgis:16-3.4` PostgreSQL container from Docker Compose locally. The database URL is the environment-specific configuration boundary.

## Alternatives considered

- A hosted database without an idle suspension: not chosen because the project targets the free Neon plan.
- A locally installed PostgreSQL server: less reproducible across developer machines than Docker.

## Consequences

The project can run locally with a disposable, reproducible database and deploy without changing application database code. The first query after Neon suspension can have a cold-start delay, and hosted free-tier limits remain a constraint. The API uses connection pre-pinging to handle connections dropped while Neon is suspended.

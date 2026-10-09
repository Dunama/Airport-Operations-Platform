# 0003. OR-Tools for gate allocation

- Status: Accepted
- Date: 2026-10-09

## Context

Gate allocation is a planned airport-operations capability. The repository already declares Google OR-Tools as an API dependency and contains a gates solver module, but the allocation workflow is not implemented yet.

## Decision

Use Google OR-Tools as the constraint-solving library when the gate-allocation module is implemented.

## Alternatives considered

- Hand-written greedy allocation: easier to start, but less suitable for expressing competing timing and gate constraints.
- An external optimization service: adds deployment and integration complexity to the current FastAPI application.

## Consequences

The allocation logic can model constraints in the backend and remain within the existing application boundary. The solver adds dependency and modeling complexity, and its effectiveness will depend on the constraints and objective function that are eventually defined. Revisit the choice if the real operational model does not require constraint optimization.

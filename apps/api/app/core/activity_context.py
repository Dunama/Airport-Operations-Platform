from contextvars import ContextVar

current_actor_id: ContextVar[int | None] = ContextVar("current_actor_id", default=None)

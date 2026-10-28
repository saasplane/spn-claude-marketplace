# Step: queue — the consuming side of async work

A queue entry is an entry like any other: it parses a message, calls a contract service method, and holds no business logic. What makes it its own step is that the producing side is authorization-checked and the consuming side is not, so the seam between them carries rules a controller never needs.

Read this when a module consumes an event. Publishing is in [service](service.md) — `_publishOnCommit`, the `request*` helpers, RequestKey idempotency.

## The listener class

- One class per topic, at `entry/queue/listeners/<MOD><Concern>EventListener.ts`. It extends a framework base and implements one method: parse nothing, delegate everything.
- **Pick the base by whether the message carries an actor.** `SPAuthenticatedQueueListener` rehydrates the emitter's auth passport and runs your handler as that principal, so the row's org and `created_by` are the real initiator's. `SPQueueListener` runs under an explicit system actor and is for messages that never had a user behind them.
- The handler is a one-liner onto the module singleton: `await <mod>Module.services.impl.<x>Service.handle<Event>(message);`

## Registration, and the one field that is a contract

Listeners are returned from the module manager's `getQueueListeners`, each with a provider, a topic and a `subscriberId`:

```ts
getQueueListeners(app: SPServiceApp, module: SPModule<MOD>): SPQueueListener[] {
  return [
    new <MOD>RequestEventListener({
      queueProvider: serviceApp.providers.queues.default,
      topic: QUEUE_<X>_REQUESTS,
      subscriberId: '<mod>-<x>-requests',
    }),
  ];
}
```

**`subscriberId` is part of the consumption contract.** It is the consumer group. Rename it and the broker treats you as a new consumer with no offset, so the entire retained backlog replays. Choose it once, at the shape `<mod>-<topic-noun>`, and never rename it to tidy anything up.

## Why the handler is deliberately ungated

The service method a listener calls is a public `handle<X>Event` carrying **no** `@SPAuthorize`. That is deliberate, and it is the one place an ungated public method is correct:

- The **producer** authorized the work at request time. Re-gating on consumption checks the wrong principal.
- The rehydrated actor is frequently a system principal holding none of this module's permissions, so a gate would refuse work that was already authorized.
- The handler therefore delegates to a private `_do<X>` that the gated public method also calls. One implementation, two doors, one of which is already checked.

Document the method as queue-only, and give it no route. An ungated method with an address is a hole; an ungated method reachable only from a listener is the design.

## Idempotency is the consumer's job

A broker redelivers. Assume every message arrives more than once.

- Short-circuit on `getByRequestKey` before doing anything. The producer set that key; you honour it.
- A **semantic** key (`org-123:invite-sent`) for a once-per-fact send. `ulid()` where each attempt is genuinely its own fact.
- Never make idempotency a unique index alone — you want the second delivery to succeed quietly, not to throw.

## Errors

Every declared topic has a paired error topic. A handler that throws lands the message there rather than blocking the partition. Do not swallow an exception to keep the consumer moving: a message you cannot process is evidence, and the error topic is where it belongs.

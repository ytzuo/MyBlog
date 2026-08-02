---
title: "A Hidden AFTER_COMMIT Event-Nesting Bug"
description: "A subtle transaction-event bug introduced during an AI-assisted refactor"
slug: "after-commit-event-nesting-ai-coding-bug"
pubDate: "2026-04-14"
heroImage: "../../../assets/BlogImg/EventListener.jpg"
heroImageAlt: "Spring transaction event-listener flow"
heroImageScale: 0.3
tags: ["Spring", "Java", "Transactions", "Databases"]
lang: "en"
translationKey: "after-commit-event-nesting"
---

## Notifications should not slow down the main request

A campus mental-health platform was nearly ready to launch, and we were integrating its general notification API with the university platform. Calling that third-party API inside the business flow could make requests noticeably slower, so we designed an event-driven flow:

```mermaid
sequenceDiagram
    autonumber
    participant U as User request
    participant M as Main business flow
    participant T as Spring transaction
    participant DB as Local database
    participant E as Post-transaction event
    participant N as Notification worker
    participant TP as Campus notification API

    U->>M: Submit form
    M->>T: Start transaction
    M->>DB: Update business data
    M->>T: Register post-transaction event
    T-->>M: Commit succeeds
    M-->>U: Return without waiting for third party
    T-->>E: Trigger event after commit
    E->>N: Start notification flow
    N->>DB: Read or write notification task
    N->>TP: Send notification
    TP-->>N: Return result
    N->>DB: Update delivery status
```

The flow worked in testing. After a late business change, we used AI-assisted coding to modify the implementation and then reviewed and tested the result manually.

## Messages became stuck in PENDING

Some notifications suddenly stopped being delivered. Their database records remained in `PENDING` and never entered `SENDING`, which meant they had been saved but never dispatched.

```mermaid
stateDiagram-v2
    direction LR
    Start --> PENDING: Stored, waiting for dispatch
    Start --> FAILED: Invalid recipient
    PENDING --> SENDING: Dispatch event received
    SENDING --> SENT: Third party accepts request
    SENDING --> FAILED: Submission fails
    SENT --> DELIVERING: Delivery is being polled
    DELIVERING --> SUCCESS: Delivery succeeds
    DELIVERING --> FAILED: Delivery fails
    FAILED --> PENDING: Retry is allowed
```

The most likely explanation was that the post-transaction event had never fired, so the handler could not find and send those records.

## A quick refresher on Spring transaction events

Spring application events decouple modules: one module publishes an event instead of calling every interested module directly.

A regular `@EventListener` runs synchronously when the event is published and does not care whether the surrounding transaction eventually commits. We therefore used:

```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
```

That listener runs after the business transaction has committed, when its data is safely stored.

## The AFTER_COMMIT event was nested

The full chain looked like this:

1. Business code published a domain event inside a transaction.
2. A domain-event listener received it and published a general notification event.
3. A second listener received the notification event and called the notification API.

The first listener correctly used `AFTER_COMMIT`. During an earlier structural refactor, however, the second listener had also been left as `AFTER_COMMIT`.

## The second listener must not wait for another transaction

By the time the first `AFTER_COMMIT` listener published the second event, the original transaction had already committed. There was no new transaction for the second listener to wait on, so it never ran.

Changing the second listener to a regular `@EventListener` fixed the problem. The useful rule is simple: only the event that truly depends on a successful commit should use `AFTER_COMMIT`; an event published from that callback should not blindly inherit the same phase.

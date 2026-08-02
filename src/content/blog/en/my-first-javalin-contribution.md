---
title: "My First Contribution to the Javalin Community"
description: "How an API design question became a proposal for nested route scopes"
slug: "my-first-javalin-contribution"
pubDate: "2026-06-08"
tags: ["Javalin", "Kotlin", "Notes"]
lang: "en"
translationKey: "javalin-contribution"
---

# From an issue to my first Javalin community discussion

I recently joined my first open-source design discussion in the Javalin community. What began as a question about API design gradually became a more structured proposal.

The discussion took place across two issues:

- [javalin/javalin#2601](https://github.com/javalin/javalin/issues/2601): Route-group-level middleware / handler chain API?
- [javalin/javalin-routing-extensions#64](https://github.com/javalin/javalin-routing-extensions/issues/64): Support multi-layered path operations in In-Place DSL

## The problem I encountered

How can a Javalin application attach the same middleware or handler chain to a group of routes?

Frameworks such as Gin and Hertz let developers create a route group and attach middleware to it:

```go
v1 := h.Group("/v1")
v1.Use(middleware1, middleware2)
v1.GET("/users", handler)
```

Every route under `/v1` inherits the middleware, producing an intuitive order:

```text
group middleware
  route middleware
    endpoint handler
```

With `next()`, middleware can form an onion-style call chain:

```text
requestLog before
  requireAuth before
    endpoint
  requireAuth after
requestLog after
```

I wanted to express the same idea in Javalin:

```kotlin
path("/admin") {
    use(requireAuth, audit)

    get("/me") { ctx ->
        // ...
    }

    get("/users", middlewares = listOf(requireRole("admin"))) { ctx ->
        // ...
    }
}
```

This pattern is common for admin areas, user centers, API versions, authorization, audit logging, and rate limiting. These are policies shared by a route group, not concerns of one endpoint.

## The first issue was a question, not a demand

In [#2601](https://github.com/javalin/javalin/issues/2601), I first documented Javalin's existing mechanisms:

- `ApiBuilder.path(...)` organizes paths;
- `RouteRole`, `routeRoles()`, and `beforeMatched(...)` support access control;
- `beforeMatched(...)` and `afterMatched(...)` provide post-match hooks;
- `config.router.handlerWrapper(...)` wraps endpoint handlers at the router level.

Those APIs cover many use cases, but none directly describes “this route group owns a middleware chain inherited by its child routes.”

The real questions were:

- Would Javalin consider route-group-level middleware or handler chains?
- Does such an API fit Javalin's design philosophy?
- If not, should applications continue composing wrappers themselves?

An application-level `RouteMiddleware` and `chain(...)` workaround solved the immediate problem, but route definitions and their middleware model remained separate.

## Maintainer feedback: interesting, but not for Javalin 7

Maintainer `tipsy` considered the model interesting and worth keeping open for Javalin 8, but not as a second routing approach in Javalin 7.

That distinction matters in open source: many decisions are not about whether something can be implemented, but when and where it belongs.

## Moving to javalin-routing-extensions

Maintainer `dzikoysk` suggested exploring the feature in the In-Place DSL of `javalin-routing-extensions`. That module currently adds relatively little, so a richer routing model could give it a distinctive purpose.

He then created [#64](https://github.com/javalin/javalin-routing-extensions/issues/64), initially focused on extending the flat In-Place DSL with nested path operations.

The problem had shifted from route-group middleware to nested paths.

## From nested paths to nested route scopes

A minimal starting point would simply compose paths:

```kotlin
config.routes(Dsl) {
    path("/api") {
        path("/admin") {
            get("/users") {
                result("users")
            }

            post("/users") {
                result("user created")
            }
        }
    }
}
```

This should register:

```text
GET  /api/admin/users
POST /api/admin/users
```

But once nested paths exist, they can also become a foundation for scoped interceptors and middleware-like handler composition. `dzikoysk` correctly noted that if middleware could affect the DSL's internal structure, the intended end state should be described before implementation—even if the work is later split across several pull requests.

That led to a better formulation: the core concept is not merely a nested `path(...)`, but a nested **route scope**.

A scope can carry:

- a path prefix;
- scoped middleware or handler composition;
- route metadata such as roles.

```kotlin
enum class Role : RouteRole {
    AUTHENTICATED,
    ADMIN
}

config.routes(Dsl) {
    path("/api") {
        use(requestLog)

        path("/admin") {
            use(requireAuth)

            path("/users", roles = setOf(Role.ADMIN)) {
                use(requireAudit("users"))

                get { result("users") }
                post { result("user created") }
            }
        }
    }
}
```

The code registers the same two routes, but also expresses a hierarchy:

```text
/api
  requestLog
    /admin
      requireAuth
        /users
          roles = [ADMIN]
          requireAudit("users")
            endpoint
```

That abstraction was the most important outcome of the discussion.

## The central design questions

First, is `path(...)` only a prefix or is it a scope? Prefix composition needs little more than a stack. Middleware, roles, and metadata require an inheritable context.

Second, inheritance order must be explicit. Outer middleware should wrap inner middleware, which in turn wraps the endpoint:

```text
requestLog
  requireAuth
    endpoint
```

Third, the DSL must have a clear relationship with Javalin's existing lifecycle APIs: `before(...)`, `beforeMatched(...)`, `after(...)`, `afterMatched(...)`, `routeRoles()`, and `handlerWrapper(...)`.

The goal is not to replace those APIs. It is to offer a more structured way to compose them.

## Afterword

This was a small but meaningful first step from being only a framework user toward becoming a participant in its community. If the design progresses, I plan to keep contributing examples, implementation ideas, and possibly a proof of concept.

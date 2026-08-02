---
title: 'Javalin 贡献记'
description: '人生第一次给开源项目做贡献'
slug: 'javalin贡献记'
translationKey: 'javalin-contribution'
pubDate: '2026-06-08'
tags: ['Javalin','Kotlin','记录']
---

# 从一个 Issue 开始：我第一次参与 Javalin 开源社区讨论

最近我在 Javalin 社区参与了第一次开源讨论，提了个 API 设计上的问题，然后跟着维护者的反馈一起慢慢梳理，最后把想法整理成了一个相对清晰的 proposal。

这次经历主要围绕两个 issue 展开：

- [javalin/javalin#2601](https://github.com/javalin/javalin/issues/2601): Route-group-level middleware / handler chain API?
- [javalin/javalin-routing-extensions#64](https://github.com/javalin/javalin-routing-extensions/issues/64): Support multi-layered path operations in In-Place DSL


## 我遇到的问题

我最初遇到的问题是：在 Javalin 中，如何优雅地给一组路由挂载统一的 middleware 或 handler chain？

在一些 Web 框架里，比如 Gin 或 Hertz，可以创建一个 route group，然后给这个 group 挂 middleware：

```go
v1 := h.Group("/v1")
v1.Use(middleware1, middleware2)
v1.GET("/users", handler)
```

这样 `/v1` 下面的所有路由都会继承这些 middleware。执行顺序也很直观：

```text
group middleware
  route middleware
    endpoint handler
```

如果 middleware 支持 `next()`，还可以形成类似 onion-style 的结构：

```text
requestLog before
  requireAuth before
    endpoint
  requireAuth after
requestLog after
```

**以上这些可以在我的这一篇博客中找到：[Spring Boot VS Hertz：框架托管复杂性 vs 开发者显式组织复杂性](/blog/spring_vs_hertz/)**

我希望在 Javalin 中也能表达类似的模型：

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

理想中的执行顺序是：

```text
requireAuth
  audit
    requireRole("admin")
      endpoint
```

我认为这类需求在实际项目里很常见，比如后台管理、用户中心、API 版本分组、鉴权、审计日志、限流等。它们通常不是单个 endpoint 的问题，而是一组路由的共同策略。天然适合这一类带有 `scope` 的模型。

## 提出第一个 issue：不是提需求，而是提问题

于是我在 `javalin/javalin` 中创建了 [#2601](https://github.com/javalin/javalin/issues/2601)，标题是：

> Route-group-level middleware / handler chain API?

我并不是直接说“请加一个 middleware API”，而是先整理了现有 Javalin 已经提供的相关机制：

- `ApiBuilder.path(...)` 可以组织路径；
- `RouteRole`、`routeRoles()` 和 `beforeMatched(...)` 可以做访问控制；
- `beforeMatched(...)` / `afterMatched(...)` 可以处理匹配后的请求 hook；
- `config.router.handlerWrapper(...)` 可以在 router 层包装 endpoint handler。

这些能力已经能覆盖很多场景，但它们并没有直接表达“某个 route group 自带一组 middleware，并且被内部 route 继承”的模型。

所以我在 issue 中提出的问题其实是：

- Javalin 是否会考虑支持 route-group-level middleware / handler chain？
- 这种 API 是否符合 Javalin 的设计哲学？
- 如果不适合进入框架本身，是否推荐用户继续使用现有机制，并在应用层自己组合？

我也补充了一个 application-level workaround：用 `RouteMiddleware` 和 `chain(...)` 在应用层手动组合 handler。这样做能解决问题，但 route definition 和 middleware model 并没有真正集成在一起。

## 维护者的反馈：方向可以讨论，但不属于 Javalin 7

维护者 `tipsy` 回复说，这是一个有意思的想法，他也思考过这种模型是否会更好。但这个方向更适合在 Javalin 8 中考虑，不会作为 Javalin 7 的另一套方案加入：

<p style="font-size: 0.85em; color: var(--gray);">
  “it's an interesting thought, I've wondered before if this would be a better model. It's something we can consider for Javalin 8, but we will not be adding this as a an alternative approach in Javalin 7. Let's keep the issue open though.”
</p>


所以我回复说，这个判断是合理的。我会继续在应用层使用 wrapper，如果未来进入 Javalin 8 规划，我也愿意提供更具体的例子或 PoC。

开源项目中的很多决定，不是“能不能实现”，而是“应该在什么时候、以什么方式实现”。

## 转向 javalin-routing-extensions

之后，另一位维护者 `dzikoysk` 提出了一个新方向：也许可以在 `javalin-routing-extensions` 的 In-Place DSL 中探索这个能力：

<p style="font-size: 0.85em; color: var(--gray);">
  <span>"I guess we could extend In-Place DSL routing module with something like that:</span>
  <span style="display: block; margin-left: 1.5em;"><a href="https://javalin.github.io/javalin-routing-extensions/dsl/in-place.html">https://javalin.github.io/javalin-routing-extensions/dsl/in-place.html</a></span>
  <span style="display: block; margin-left: 1.5em;">It'd be a cool exercise and something unique to it, because as of right now it doesn't offer that much."</span>
</p>

他认为，In-Place DSL 当前没有提供太多额外能力，如果在这里尝试 route-group middleware 或类似结构，可能会是一个有价值的扩展。

随后，`dzikoysk` 创建了 [#64](https://github.com/javalin/javalin-routing-extensions/issues/64)：

> Support multi-layered path operations in In-Place DSL


这个 issue 最初关注的是 In-Place DSL 当前只支持 flat routes，能否支持类似 Javalin API Builder 的 nested path operations。

也就是说，问题从最初的 route-group middleware，转移到了 nested path operations。

## 从 nested path 到 nested route scope

在 [#64](https://github.com/javalin/javalin-routing-extensions/issues/64) 中，我一开始提出一个最小起点：先支持路径组合。

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

它应该注册出：

```text
GET  /api/admin/users
POST /api/admin/users
```

但我同时指出，一旦有了嵌套 path 结构，它也可以成为 route-group-level behavior 的基础，比如 scoped interceptors 或 middleware-like handler composition。

`dzikoysk` 很快提醒我：如果 scoped middleware 会影响 DSL 的内部结构，最好现在就把完整目标形态描述清楚。即使后续实现可以拆成多个 PR，设计讨论中也应该先把最终用户视角写出来。

于是我把问题重新表述为：

> 这里的核心概念可能不只是嵌套 `path(...)`，而是嵌套的 route scopes。

一个 route scope 不只是 path prefix。它还可以承载：

- 路径前缀；
- scoped middleware / handler composition；
- route metadata，比如 roles。

例如：

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

它不仅注册出：

```text
GET  /api/admin/users
POST /api/admin/users
```

更重要的是表达出这样的结构：

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

这一步是整个讨论中最重要的变化：原始需求是 route-group middleware，维护者创建的 issue 是 nested path operations，而后续讨论把它进一步抽象成 nested route scopes。

## 技术讨论的核心

这两个 issue 背后的技术问题，其实不是某个具体函数名，而是一组设计问题。

首先，`path(...)` 到底只是 prefix，还是 scope？

如果它只是路径拼接，实现可以很简单：维护一个 path prefix stack，注册 route 时把路径拼起来。但如果未来要支持 middleware、roles、metadata，它就更像一个 route scope，需要携带一组可继承的上下文。

其次，`use(...)` 的继承和执行顺序要明确。

例如：

```kotlin
path("/api") {
    use(requestLog)

    path("/admin") {
        use(requireAuth)

        get("/users") { ... }
    }
}
```

最终顺序应该是：

```text
requestLog
  requireAuth
    endpoint
```

也就是说，外层 middleware 包裹内层 middleware，内层 middleware 再包裹 endpoint。

第三，它和 Javalin 现有生命周期机制的关系要讲清楚。

Javalin 已经有 `before(...)`、`beforeMatched(...)`、`after(...)`、`afterMatched(...)`、`routeRoles()`、`handlerWrapper(...)` 等能力。新的 DSL 不应该完全另起炉灶，而应该尽量建立在这些机制之上。

换句话说，它不是替代现有 API，而是给用户一个更结构化的方式来组合这些能力。


## 后话

对我来说，这是一次很好的开始。它让我从“使用者”稍微向“参与者”迈了一步。后续如果有跟进，我会继续更新。

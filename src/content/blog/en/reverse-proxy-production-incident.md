---
title: "A Slightly Embarrassing Reverse-Proxy Incident"
description: "A production incident that ended without serious damage"
slug: "reverse-proxy-production-incident"
pubDate: "2026-03-13"
tags: ["Java", "Linux Operations", "Notes"]
lang: "en"
translationKey: "reverse-proxy-incident"
---

## Three services on one server

A legacy campus system consists of an admin backend, a WeChat Mini Program backend, and a scheduled-task service. All three run on one machine as `java -jar` processes managed by PM2.

## Creating an activity suddenly returned 405

A user reported that activities could no longer be created. Creation calls the scheduled-task service through a RESTful API, so I checked the server logs and found:

```plain
java.io.IOException:
Server returned HTTP response code: 405 for URL: http://localhost/task/api/task/addActivityTask
```

Both caller and endpoint used `POST`, so the method itself looked correct. A quick request with `curl` returned HTML instead of the service's expected JSON error. Opening the same path in a browser redirected to the admin login page.

## `/task` was routed to the admin service

The Nginx configuration explicitly routed `/admin` and `/wx`, but I had forgotten `/task`. The default rule therefore sent scheduled-task traffic to the admin backend. After an unrelated static-resource proxy change, the entire task service had been incorrectly routed for a week.

## A lucky escape

Fortunately, that feature was used only once a week. Otherwise, this tiny missing location rule could easily have become a P0 incident.

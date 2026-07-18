+++
date = '2026-07-04T00:00:00+00:00'
draft = false
title = 'Capturing Claude Code Session Telemetry with a Local OTel Collector'
description = 'Claude Code exports OTLP traces, logs, and metrics if the env vars are set before the session starts, traces need one extra beta flag. A local otel-collector plus a polling CSV sidecar turns that into a self-updating log of cost, tokens, tool calls, and the span tree per session.'
excerpt = 'Claude Code speaks OTLP, but only if you tell it to before the session starts, and only to something already listening. Traces need a beta flag the other exporters do not. A local collector plus a CSV sidecar turns all of it into a self-updating usage log, no manual export step.'
tags = ['claude-code', 'ai', 'tooling', 'observability', 'otel']
image = 'images/claude-otel-architecture.svg'
+++

> **TL;DR**: Claude Code exports OTLP logs, metrics, and traces if a handful of
> env vars are set before a session starts, traces need one extra beta flag
> on top of the others, easy to miss since nothing errors if you skip it. A
> local `otel-collector` writes the raw export to JSONL, and a small polling
> sidecar turns that into `claude_usage.csv` (model, cost, tokens, tool calls)
> and `claude_spans.csv` (the call tree: interaction -> tool -> llm_request),
> with nothing to trigger by hand. [Repo here](https://github.com/sudopower/claude-otel-capture).

# The Goal

I wanted a running log of what my Claude Code sessions actually cost: tokens
per model, dollars, which tools got called and how often they succeeded.
Claude Code doesn't have a built-in dashboard for this, but it does speak
OpenTelemetry, so the plan was to catch that export locally and turn it into
something I could open in a spreadsheet.

# Telemetry Has to Be on Before You Start

The first thing I tried was turning on export mid-session. That doesn't
work: Claude Code reads its telemetry configuration once, at startup. There
is no way to retroactively enable export for a session that's already
running, and no built-in buffer-and-replay-later feature either. If you want
a session's traces, the env vars have to be set in the shell **before**
`claude` launches:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_LOGS_EXPORTER=otlp
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

The second thing that has to be true: something has to actually be
listening on that endpoint when Claude Code starts. If nothing's there, the
exporter just fails quietly and you get nothing. So the env vars alone
aren't the setup, they're the last step.

That's the setup for logs and metrics. Traces are a separate beta feature,
gated behind a flag that isn't mentioned anywhere near the other telemetry
docs, so it's easy to wire up a collector with a `traces` pipeline (like the
one below) and never notice it's receiving nothing. `OTEL_TRACES_EXPORTER=otlp`
by itself does nothing; Claude Code silently skips span creation unless
`CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1` is also set:

```bash
export CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1
export OTEL_TRACES_EXPORTER=otlp
```

I originally shipped this repo without that flag. The collector's traces
pipeline was live and listening, `claude_spans.csv` existed, and it just
stayed empty forever with no error on either side. Confirmed it two ways:
`OTEL_TRACES_EXPORTER=console` prints real spans to stdout once the beta
flag is set, and pointing a throwaway collector at the OTLP endpoint with
the flag on shows an actual `resourceSpans` payload arrive over gRPC.
Without it, neither ever produces a trace.

# Architecture

```
claude (OTLP) -> otel-collector -> data/claude-events.jsonl -> csv-writer -> claude_usage.csv, claude_spans.csv
```

![Pipeline: claude exports OTLP to otel-collector, which writes claude-events.jsonl, polled by csv-writer into claude_usage.csv](../../images/claude-otel-architecture.svg)

Two containers. `otel-collector` receives OTLP over gRPC/HTTP and writes the
raw export straight to a JSONL file, nothing parsed or dropped. `csv-writer`
polls that file every five seconds and regenerates both CSVs, so there's no
command to remember after the fact, the files just stay current while the
stack is up.

# The Collector Config

`otelcol-contrib` needs a receiver and an exporter; the `file` exporter is
enough for this, no backend required yet:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

exporters:
  file:
    path: /var/log/otel/claude-events.jsonl

service:
  pipelines:
    logs:
      receivers: [otlp]
      exporters: [file]
    metrics:
      receivers: [otlp]
      exporters: [file]
    traces:
      receivers: [otlp]
      exporters: [file]
```

The `docker-compose.yml` binds the OTLP ports to `127.0.0.1` on purpose.
This receiver has no auth and no TLS, so exposing it on `0.0.0.0` means
anyone on the LAN can inject fake telemetry into your collector:

```yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    restart: unless-stopped
    volumes:
      - ./otel-collector-config.yaml:/etc/otelcol-contrib/config.yaml
      - ./data:/var/log/otel
    ports:
      - "127.0.0.1:4317:4317" # OTLP gRPC, localhost-only
      - "127.0.0.1:4318:4318" # OTLP HTTP

  csv-writer:
    image: python:3.12-slim
    restart: unless-stopped
    volumes:
      - .:/app
    working_dir: /app
    command: >
      sh -c "while true; do python3 parse_to_csv.py --input-file data/claude-events.jsonl --output-file claude_usage.csv; sleep 5; done"
    depends_on:
      - otel-collector
```

# Turning JSONL into a CSV

The raw export is nested OTLP: `resourceLogs` -> `scopeLogs` -> `logRecords`,
each with an `attributes` array instead of a flat object. The script filters
to the three event types worth graphing, `api_request`, `tool_result`, and
`tool_decision`, and flattens their attributes into one row per event, keyed
by `session_id`:

```python
FIELDS = [
    "timestamp", "session_id", "event_type", "model", "tool_name", "decision",
    "source", "success", "error_type", "cost_usd", "duration_ms",
    "input_tokens", "output_tokens", "cache_read_tokens", "cache_creation_tokens",
    "tool_use_id",
]

TARGET_EVENTS = {"api_request", "tool_result", "tool_decision"}

def attr_value(v):
    for key in ("stringValue", "intValue", "doubleValue", "boolValue"):
        if key in v:
            return v[key]
    return ""

def record_to_row(record):
    attrs = {a["key"]: attr_value(a["value"]) for a in record.get("attributes", [])}
    event_type = attrs.get("event.name")
    if event_type not in TARGET_EVENTS:
        return None
    return {"timestamp": attrs.get("event.timestamp", ""), "session_id": attrs.get("session.id", ""), ...}
```

`api_request` rows carry model, cost, and token counts; `tool_result` and
`tool_decision` carry which tool ran, whether it succeeded, and whether it
was auto-accepted or needed a prompt. Group by `session_id` and you have a
per-session cost and tool-usage breakdown. A few rows from a real
`claude_usage.csv` (all 16 columns, scroll right on narrow screens):

| timestamp | session_id | event_type | model | tool_name | decision | source | success | error_type | cost_usd | duration_ms | input_tokens | output_tokens | cache_read_tokens | cache_creation_tokens | tool_use_id |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-07-04T19:41:05.216Z | 4255b08c… | tool_decision | | Read | accept | config | | | | | | | | | toolu_01LV… |
| 2026-07-04T19:41:05.218Z | 4255b08c… | api_request | claude-sonnet-5 | | | | | | 0.076066 | 2958 | 2 | 101 | 30342 | 10907 | |
| 2026-07-04T19:41:05.221Z | 4255b08c… | tool_result | | Read | | | true | | | 5 | | | | | toolu_01LV… |
| 2026-07-04T19:41:46.045Z | 4a4f71f6… | tool_decision | | Grep | accept | config | | | | | | | | | toolu_018W… |
| 2026-07-04T19:41:46.052Z | 4a4f71f6… | api_request | claude-opus-4-8 | | | | | | 0.26328 | 4415 | 9702 | 242 | 0 | 20872 | |

These are real rows, one `claude -p` call each, on Sonnet and Opus, one reading a
file and one grepping one. Grouped by model and by tool, the same session looks
like this:

![Bar chart: cost by model (claude-sonnet-5 $0.3368, claude-haiku-4-5 $0.0623, claude-opus-4-8 $0.4095) and tool calls by tool (Read 2, Grep 1, Glob 1)](../../images/claude-otel-usage-chart.svg)

# Spans Get Their Own CSV

Once the beta flag is on, `resourceSpans` shows up in the same JSONL, structurally
different enough from log records that it gets its own parser and its own
output file, `claude_spans.csv`, rather than trying to force it into the
`FIELDS` schema above:

```python
SPAN_FIELDS = [
    "timestamp", "trace_id", "span_id", "parent_span_id", "span_name",
    "session_id", "agent_id", "model", "duration_ms", "input_tokens", "output_tokens",
    "cache_read_tokens", "cache_creation_tokens", "ttft_ms", "success", "stop_reason",
]

def iter_spans(obj):
    for rs in obj.get("resourceSpans", []):
        for ss in rs.get("scopeSpans", []):
            for span in ss.get("spans", []):
                yield span

def span_to_row(span):
    attrs = {a["key"]: attr_value(a["value"]) for a in span.get("attributes", [])}
    duration_ms = attrs.get("duration_ms") or attrs.get("interaction.duration_ms")
    return {
        "trace_id": span.get("traceId", ""),
        "span_id": span.get("spanId", ""),
        "parent_span_id": span.get("parentSpanId", ""),
        "span_name": span.get("name", ""),
        "agent_id": attrs.get("agent_id", ""),  # empty on the main agent, set on subagents
        "duration_ms": duration_ms,
        ...
    }
```

`span.get("parentSpanId", "")` is the whole reason this is worth a second file:
it's how a flat list of spans turns back into a call tree. One real turn,
same `trace_id` on every row:

| span_id | parent_span_id | span_name | model | duration_ms | ttft_ms | stop_reason |
|---|---|---|---|---|---|---|
| b9627b1d… | *(root)* | claude_code.interaction | | 8437 | | |
| 51fa875b… | b9627b1d… | claude_code.llm_request | claude-sonnet-5 | 4694 | 2740 | tool_use |
| 7e062ead… | b9627b1d… | claude_code.tool | | 11 | | |
| 8bdf191c… | 7e062ead… | claude_code.tool.execution | | 3 | | |
| 3e556636… | b9627b1d… | claude_code.llm_request | claude-sonnet-5 | 3142 | 1984 | end_turn |

Read top to bottom, that's one turn: the model call decides to use a tool
(`stop_reason: tool_use`), the tool runs (`claude_code.tool` wraps
`claude_code.tool.execution`), and a second model call ends the turn
(`stop_reason: end_turn`), all three children of the one
`claude_code.interaction` root span. `claude_usage.csv` has the same
information flattened into log events; `claude_spans.csv` has the shape of
the turn.

# Subagents Stay in the Same Trace

The reason `agent_id` is in `SPAN_FIELDS` at all: I wanted to know what a
session looks like when the main agent dispatches subagents on a different
model. So I ran this session on Opus and had it spawn three Sonnet subagents
(each reading a file and summarizing it), telemetry and the beta flag on the
whole time. The trace answered three things I'd been guessing at.

First, it's all one trace and one session. Every span, the Opus main and all
three Sonnet subagents, carries the same `trace_id` and the same `session.id`.
A subagent does not open its own session or its own trace, so you cannot tell
them apart by `session.id`.

Second, `agent_id` is what tells them apart. The main agent's `llm_request`
spans have an empty `agent_id`; each subagent's spans carry a distinct one.
That single attribute is the only thing separating the Opus turns from the
Sonnet ones in the trace, which is exactly why it earns a column.

Third, a subagent's spans hang off the parent's tool span. When the main agent
calls the Task tool, that produces a `claude_code.tool` and a
`claude_code.tool.execution` span belonging to the main agent (no `agent_id`),
and everything the subagent then does nests underneath that execution span. One
real dispatch from this session, same `trace_id` on every row:

| span_id | parent_span_id | span_name | agent_id | model | stop_reason |
|---|---|---|---|---|---|
| aaf45133… | 3148a886… | claude_code.tool | | | |
| f253fecb… | aaf45133… | claude_code.tool.execution | | | |
| 8c8a24ce… | f253fecb… | claude_code.llm_request | a9f513d5… | claude-sonnet-5 | tool_use |
| c1cd61df… | f253fecb… | claude_code.tool | a9f513d5… | | |
| 780673bc… | f253fecb… | claude_code.llm_request | a9f513d5… | claude-sonnet-5 | end_turn |

The top two rows are the main Opus agent invoking the Task tool. The three
below them are the Sonnet subagent's own turn (two model calls wrapping its one
`Read`), all parented to the `tool.execution` span above and all stamped with
its `agent_id`. So `parent_span_id` gives you the nesting and `agent_id` gives
you attribution: which subagent, on which model, under which parent turn. The
`3148a886…` those top rows hang off is the session's `claude_code.interaction`
root, which is not in this capture: it stays open until the session ends, and
spans only export once they close (see Gotchas). Cost still comes from the log
side (spans carry tokens but not `cost_usd`), and in this run that split out to
$0.74 of Opus against $0.25 of Sonnet across the three subagents.

# Setup

```bash
git clone https://github.com/sudopower/claude-otel-capture.git
cd claude-otel-capture

# 1. Start the collector + csv-writer, leave this running
docker compose up -d

# 2. In the terminal where you'll run Claude Code:
source env.sh
claude
# ... use Claude Code normally ...
```

`claude_usage.csv` updates itself every five seconds while the stack is up,
nothing else to run. Here's what that actually looks like, both containers up
and a couple of real rows pulled straight out of the CSV:

![Terminal: docker compose ps showing both containers up, then real claude_usage.csv rows for claude-sonnet-5, claude-haiku-4-5, and claude-opus-4-8, plus Read/Grep/Glob tool decisions](../../images/claude-otel-terminal.svg)

# Gotchas

- **The file exporter holds an open handle.** Deleting
  `data/claude-events.jsonl` from the host while the collector is running
  leaves it writing into a deleted, invisible inode until the container
  restarts. If you need to reset it, `docker compose restart
  otel-collector`, don't `rm` the file while it's live. This one cost me an
  hour of "why is my CSV empty" before I noticed the container had never
  stopped writing, just to nowhere I could see.
- **`OTEL_TRACES_EXPORTER=otlp` alone gets you nothing.** The collector's
  `traces` pipeline receiver is listening fine, but Claude Code itself never
  creates a span unless `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1` is also set.
  There's no warning on either end, `claude_spans.csv` just stays an empty
  header row forever. This is the mistake the first version of this post
  and repo made.
- **`user.email` and account UUIDs are in the raw export.** Prompt and
  response text are redacted by default, but the JSONL still isn't something
  to commit. `data/` and `*.csv` are gitignored in the repo.
- **The root `claude_code.interaction` span is missing until the session
  ends.** A span is exported when it closes, not when it opens, so the
  collector only ever receives finished spans. The per-step spans
  (`llm_request`, `tool`, `tool.execution`) close as each step completes and
  arrive within seconds, but the interaction span that wraps the whole session
  stays open, and therefore unexported, until the session exits. In a one-shot
  `claude -p` run that happens immediately, so the root is present; in a
  long-running interactive session it is absent, and every captured span points
  at a `parent_span_id` that never arrives. Closing the session ends that root
  and flushes it on shutdown, so leave the collector up until then. And since
  restarting the collector truncates the JSONL (that's the reset above), don't
  bounce it right as you close a session or you lose that final root span.

# Phase 2

`data/claude-events.jsonl` is the full, untouched OTLP export, so nothing
needs to be replayed from Claude Code itself to backfill a different
backend later. A second collector with a `filelog`/`otlpjsonfile` receiver
pointed at that file and a `clickhouse` exporter would ingest the whole
history in one pass. Not wired up yet, but the reason the raw file is kept
around instead of just the derived CSV.

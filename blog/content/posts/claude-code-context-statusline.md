+++
date = '2026-07-01T00:00:00+00:00'
draft = false
title = 'A Context and Usage Meter for Claude Code'
description = 'A small Python status line for Claude Code that shows live context-window usage plus your account rate limits (the 5-hour session window and the weekly limit), all read from the session JSON Claude Code pipes on stdin, at zero API cost.'
excerpt = 'Anthropic dropped the context counter from Claude Code for a cleaner UI, but without it there is no telling how full the window is, so auto-compaction fires when you do not want it to. A tiny status line that always shows it, and now also surfaces the account rate limits (session and weekly) that decide when you get throttled, on the same line.'
tags = ['claude-code', 'ai', 'tooling', 'python']
image = 'images/claude-statusline-hero.png'
+++

> **TL;DR**: Anthropic dropped the visible context counter from Claude Code for a
> cleaner UI. Without it I can't tell how full the window is, so auto-compaction
> fires when I don't want it to. I built a status line that always shows it, and
> that now also surfaces my account rate limits (the 5-hour session window and the
> weekly limit) on the same line, read from the same stdin payload at zero API
> cost. ~120 lines of Python, no dependencies, [full script in a gist](https://gist.github.com/sudopower/29e885cfc51487a992628edebe24951a).

# The Goal

Claude Code shows a footer, but I wanted an always-on meter for the one number
that actually decides when a session falls apart: **how full the context window
is right now.** Percentage, a bar, and the last turn's output tokens, colour-coded
so I notice before auto-compaction hits.

![Claude Code status line: Opus 4.8 on a 1M-context window at 33%, plus a blue 5h session meter at 11% and a magenta weekly meter at 34%](../../images/claude-statusline-hero.png)

The same idea extends to the other numbers that decide whether I can keep working
at all: the account rate limits. Claude Code tucks them behind the `/usage`
screen, but they ride along on the same stdin payload, so the line now shows the
5-hour session window and the weekly limit right next to the context meter, each
with its own bar.

# How the status line wires into Claude Code

Claude Code has a **status line** hook: you point it at any command, and on every
render it pipes a JSON blob describing the session to that command's **stdin**.
Whatever the command prints becomes the status line.

```json
// ~/.claude/settings.json
{
  "statusLine": {
    "type": "command",
    "command": "python3 /Users/kiran/.claude/statusline-context.py",
    "padding": 0
  }
}
```

The JSON on stdin includes the model, workspace, and, since Claude Code
**v2.1.132**, a native `context_window` object with the numbers already computed:

```json
{
  "model": { "display_name": "Opus 4.8", "id": "claude-opus-4-8" },
  "workspace": { "current_dir": "/opt/glass0" },
  "context_window": {
    "total_input_tokens": 15500,
    "total_output_tokens": 1200,
    "context_window_size": 200000,
    "used_percentage": 8,
    "current_usage": { "input_tokens": 8500, "cache_read_input_tokens": 2000,
                       "cache_creation_input_tokens": 5000, "output_tokens": 1200 }
  },
  "rate_limits": {
    "five_hour": { "used_percentage": 23.5, "resets_at": 1738425600 },
    "seven_day": { "used_percentage": 41.2, "resets_at": 1738857600 }
  },
  "exceeds_200k_tokens": false
}
```

The key field is `context_window_size`: Claude Code reports the **real** window,
`200000`, or `1000000` for extended-context models, so the script never has to
guess a denominator per model. That single field is what makes the meter correct
across models instead of hardcoding 200k everywhere.

The `rate_limits` block is the other half: `five_hour.used_percentage` and
`seven_day.used_percentage` are the same numbers the `/usage` screen draws, now
handed to the status line for free. More on those below.

# The script

The whole thing is ~120 lines of dependency-free Python. Read `context_window`
and `rate_limits`, compute a colour and a bar for each, print one line. It falls
back to reading the transcript JSONL for older Claude Code that predates the
native context field, and it quietly skips any rate-limit window that is not
present. The full, copy-pasteable version lives in [this GitHub gist](https://gist.github.com/sudopower/29e885cfc51487a992628edebe24951a).

```python
#!/usr/bin/env python3
"""Claude Code status line: live context + account-usage meter."""
import sys, json, os

DEFAULT_LIMIT = 200_000  # fallback only; CC reports the true size on stdin

def c(code, s): return f"\033[{code}m{s}\033[0m"
DIM, CYAN, GREEN, YELLOW, RED, BLUE, MAGENTA = "2", "36", "32", "33", "31", "34", "35"

def human(n):
    if n >= 1_000_000: return f"{n/1_000_000:.1f}M"
    if n >= 1000:      return f"{n/1000:.1f}k"
    return str(n)

def bar(pct, width=10):
    filled = min(width, int(pct / 100 * width))
    return "█" * filled + "░" * (width - filled)

def limit_col(pct, accent):  # keep the accent until the limit fills, then escalate
    return RED if pct >= 80 else (YELLOW if pct >= 60 else accent)

def last_usage(path):
    """Most recent usage dict from the transcript (older CC fallback)."""
    try:
        with open(path) as f: lines = f.readlines()
    except Exception:
        return None
    for line in reversed(lines):
        if '"usage"' not in line: continue
        try: obj = json.loads(line)
        except Exception: continue
        usage = (obj.get("message") or {}).get("usage") or obj.get("usage")
        if isinstance(usage, dict) and usage.get("input_tokens") is not None:
            return usage
    return None

def main():
    try:
        d = json.load(sys.stdin)
    except Exception:
        print("🧠 ctx ?"); return

    parts = []
    model = (d.get("model") or {}).get("display_name") or "Claude"
    parts.append(c(CYAN, f"⏺ {model}"))

    cur = (d.get("workspace") or {}).get("current_dir") or d.get("cwd") or ""
    if cur:
        parts.append(c(DIM, f"📁 {os.path.basename(cur.rstrip('/')) or cur}"))

    # Prefer the native context_window object (CC v2.1.132+): it carries the
    # true window size (auto-detecting 1M models) and the current occupancy.
    cw = d.get("context_window") or {}
    ctx   = cw.get("total_input_tokens")
    limit = cw.get("context_window_size") or DEFAULT_LIMIT
    out   = cw.get("total_output_tokens")

    if ctx is None:  # fallback for older Claude Code
        usage = last_usage(d.get("transcript_path", ""))
        if usage:
            ctx = (usage.get("input_tokens", 0)
                   + usage.get("cache_read_input_tokens", 0)
                   + usage.get("cache_creation_input_tokens", 0))
            out = usage.get("output_tokens")

    if ctx:
        pct = cw.get("used_percentage")
        if pct is None: pct = ctx / limit * 100
        col = GREEN if pct < 50 else (YELLOW if pct < 80 else RED)
        parts.append(c(col, f"🧠 {human(ctx)}/{human(limit)} {pct:.0f}% {bar(pct)}"))
        if out:
            parts.append(c(DIM, f"↑{human(out)} out"))
    else:
        flag = d.get("exceeds_200k_tokens")
        parts.append(c(RED if flag else DIM, "🧠 200k+" if flag else "🧠 …"))

    # Account rate limits (Claude.ai Pro/Max, present after the first API call).
    # five_hour = rolling session window; seven_day = weekly limit. Any window may
    # be independently absent, so skip whatever is missing. Same stdin, zero cost.
    rl = d.get("rate_limits") or {}
    for key, icon, label, accent in (("five_hour", "⏳", "5h", BLUE),
                                     ("seven_day", "📆", "wk", MAGENTA)):
        pct = (rl.get(key) or {}).get("used_percentage")
        if pct is None: continue
        parts.append(c(limit_col(pct, accent), f"{icon} {label} {pct:.0f}% {bar(pct)}"))

    print(c(DIM, " · ").join(parts))

if __name__ == "__main__":
    main()
```

# Setup

```bash
# 1. Save the script (from the gist)
curl -L https://gist.githubusercontent.com/sudopower/29e885cfc51487a992628edebe24951a/raw/statusline-context.py \
  -o ~/.claude/statusline-context.py
chmod +x ~/.claude/statusline-context.py

# 2. Point Claude Code at it (settings.json snippet above)
# 3. Restart Claude Code; the meter appears on the next render
```

No dependencies beyond Python 3, and the status line runs locally, so it costs
zero API tokens.

# Features

- **Auto-detects the window.** The header shot above is a 325.2k session on a
  1M-context model, reading `325.2k/1.0M 33%`. The size comes straight from
  `context_window_size`, so there is no per-model table to maintain: switch to a
  200k model and the denominator follows.
- **Colour-coded urgency.** Green under 50%, yellow under 80%, red beyond, so a
  filling window is visible at a glance. Here a 200k session sits at 53%, yellow:

![Context meter at 53% on a 200k window, coloured yellow](../../images/claude-statusline-53pct.png)

- **Last turn's output** tokens (`↑… out`), and graceful states: `🧠 …` before
  the first API call or just after `/compact`, `🧠 ctx ?` on malformed input.
- **Account limits on the same line.** For Claude.ai Pro/Max, the `⏳ 5h` and
  `📆 wk` meters show the 5-hour session window and the weekly limit, each its own
  accent-coloured bar (blue and magenta) that escalates to yellow past 60% and
  red past 80%. Any window that is not present is skipped, so nothing changes for
  API-key sessions.

# Account limits, for free

The context meter answers "will this session compact?" The other question that
stops work is "have I hit my plan limit?", and until now that lived only behind
the `/usage` screen. Claude Code pipes a `rate_limits` object on the same stdin
payload, so the status line can show it with no extra call:

- `five_hour` is the rolling 5-hour session window (`⏳ 5h`).
- `seven_day` is the weekly account limit (`📆 wk`).

Each renders as its own bar with a distinct accent, blue for the session window
and magenta for the week, and both escalate to yellow past 60% and red past 80%,
so a nearly-spent limit is impossible to miss.

Two caveats are worth knowing. The object appears only for Claude.ai Pro and Max
accounts, and only after the session's first API response, so an API-key session
or a brand-new one shows just the context meter (the script skips any window that
is absent). And there is no separate Opus-only weekly field in the payload: the
status line exposes the overall session and weekly windows, not the per-model
breakdown that `/usage` draws.

# Why read the native field

The naive approach is to assume a 200k window and divide. That breaks the moment
you switch to an extended-context model. Reading `context_window_size` means the
meter is correct on any model without a per-model lookup table to keep in sync.
Claude Code already knows the real window, so let it tell you.

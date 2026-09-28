+++
date = '2026-09-28T12:26:41+02:00'
draft = false
title = 'My Mac Was Throttling and ps Said Everything Was Fine'
description = 'A background process was sitting on six cores and 8.9GB of RAM. ps reported it at 11% CPU. The tell was a column I never look at.'
excerpt = "I assumed it was Claude Code, because I had a dozen sessions open. It wasn't. It was something a tool I'd already uninstalled had quietly wired in months ago."
tags = ['macos', 'claude-code', 'ai', 'tooling', 'automation']
image = ''
+++

# The pain

Fans audible, everything a half second behind, the trackpad doing that thing where it acknowledges a click a beat after you make it. Classic thermal throttling. `kernel_task` was sitting at **84% CPU**, which is macOS's way of saying it is actively fighting the machine to keep it cool rather than letting whatever is running have what it wants.

I had a dozen Claude Code sessions open across a few projects, so I assumed that was it. A dozen agents, a dozen node processes, of course the laptop is hot.

It wasn't that.

# The first wrong turn

I did what I always do and reached for `ps`:

```sh
ps -eo pid,pcpu,pmem,rss,comm -r | head -6
```

```
  PID  %CPU %MEM    RSS COMM
 2399  11.2  2.9 480304 /Users/kiran/.local/bin/tokensave
88247 117.1 13.7 2298720 OrbStack Helper
 6151  11.9  1.4 239648 claude bg-spare
```

Nothing there says "I am the problem". Top entry is OrbStack at 117%, which is high but OrbStack runs my containers so it is allowed to be busy. The `tokensave` process at 11.2% and 480MB looked completely unremarkable. I nearly moved on.

The reason I didn't is that the numbers didn't add up. Free memory was at 32% and swap was nearly full, and nothing in that list accounted for it.

# ps was averaging away the entire problem

Here is the thing I had never internalised: **the `%CPU` that `ps` gives you on macOS is a decaying average over the process's lifetime, not what it is doing now.** A process that spent ten minutes pinned to every core and then wedged will show you a small, calm number. `RSS` has a matching problem, it is resident set size, so anything paged out to swap simply stops being counted.

So I asked `top` instead, which reports instantaneously:

```sh
top -l 2 -o cpu -n 5 -stats pid,cpu,mem,state,command
```

```
PID    %CPU  MEM    STATE    COMMAND
2399   530.1 7965M+ stuck    tokensave
88247  253.1 9701M+ running  OrbStack Helper
0      84.2  2321M- running  kernel_task
```

Same two processes, same moment, wildly different story. `tokensave` was not using 11% of one core, it was using **530% across six of them**, and it was not holding 480MB, it was holding **7.9GB**. OrbStack was at 253%, not 117%.

The column that actually mattered was the one I had never paid attention to: `STATE`. Not `running`. **`stuck`.** On macOS that means the process is blocked in an uninterruptible wait, which in practice here meant it had ballooned past what the machine had and was thrashing swap. It wasn't working. It was drowning, and dragging everything else down with it.

`footprint` confirmed the memory side, and it does not need sudo:

```sh
footprint -p 2399
# phys_footprint:      8801 MB
# phys_footprint_peak: 13 GB
```

**8.8GB**, having peaked at 13GB. `ps` told me 480MB.

# What it actually was

`tokensave` is a code graph indexer that runs as an MCP server. Claude Code spawns one per session, which is fine, eleven of them were sitting there idle at about 2MB each. Twelfth one was re-indexing a repo with roughly **631,000 nodes** behind a **6.7GB** database, fanned the symbol resolution out across every core, ate more RAM than the machine had spare, and got stuck.

The part I found genuinely annoying: I never installed it. It got registered into `~/.claude/mcp.json` months ago by a different tool I was trying out, and I had already uninstalled that tool. Uninstalling it removed the tool. It did not remove the MCP server it had registered on my behalf, which Claude Code then dutifully launched at every session start, forever.

That is worth sitting with for a second. Anything that writes itself into your agent's config is leaving behind wiring that outlives it, and the uninstall almost certainly does not clean it up.

# Killing it

It ignored `SIGTERM`, which tracks, because a stuck process is not in a position to handle a signal politely:

```sh
kill -TERM 2399   # nothing
kill -9 2399      # gone
```

|  | Before | After |
|---|---|---|
| Free memory | 32% | **52%** |
| Cores tied up | ~6 | 0 |
| tokensave RSS (12 procs) | 480MB + 21MB | 21MB |

Fans down within a minute.

# The commands worth keeping

None of these need sudo. This is now the order I go in:

```sh
# 1. The fast look, but know that it lies about spikes and swapped memory
ps -eo pid,pcpu,pmem,rss,comm -r | head

# 2. The truth, including the STATE column
top -l 2 -o cpu -n 5 -stats pid,cpu,mem,state,command

# 3. Real memory footprint, not RSS
footprint -p <pid>

# 4. Is the machine actually under pressure, or just busy
memory_pressure | tail -3
sysctl vm.swapusage

# 5. What is it actually executing right now
sample <pid> 3

# 6. Who started this thing
ps -o pid,ppid,command -p <pid>
```

Step 5 is the one that closed the case. `sample` dumps the call graph, and the hot frames were all `resolution::resolver::find_best_match`, so it was symbol resolution, so it was an index rebuild, so it was going to do this again. That is the difference between killing a process and understanding whether you need to kill it every Monday.

# Takeaway

Two things.

Reaching for `ps` to find what is eating your CPU is reaching for a lifetime average, and a lifetime average is exactly the wrong statistic for catching a spike. Use `top -l 2` and read the `STATE` column. `stuck` is not a slow process, it is a process that has already lost.

And check what your tools have registered on your behalf. The thing burning six cores was spawned automatically, by config written by software that was no longer on my machine. Nothing in Activity Monitor was ever going to tell me that part.

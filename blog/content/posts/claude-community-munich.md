+++
date = '2026-11-02T11:00:00+01:00'
draft = false
title = 'Building a Software Factory with the Claude Community in Munich'
description = '32 people, one evening at JetBrains München, and a crew of Claude Code sessions on every laptop.'
excerpt = "No slide marathon. Laptops open, a crew of Claude Code sessions on every machine, and a click counter taken from plan to main."
tags = ['munich', 'software-factory', 'claude-code', 'tares', 'community', 'workshop']
image = 'images/munich-workshop-opening.jpg'
+++

"Claudians, assemble. See you in Munich!" That was [my post](https://www.linkedin.com/posts/kiran-nambiar_claude-community-x-glassflow-build-a-software-activity-7518775460957425664-vWPD) a week before. On Thursday 29 October, 32 people did exactly that at JetBrains München.

![The opening at JetBrains München: the title slide, Build a software factory with Claude Code](../../images/munich-workshop-opening.jpg)

# The evening

The [Claude Code Community Munich](https://www.linkedin.com/company/claude-code-community-munich) invited us at GlassFlow to run a hands-on workshop: build a software factory with Claude Code. Dr. Florian Steiner, the Claude Community Ambassador for Munich, organised it. JetBrains opened its Munich office for us, and Anthropic supported the evening. Armend, our CEO, and I ran it.

It filled up days before, with a waitlist. The format was simple: pizza, a short intro from Armend and me, then everyone builds on their own laptop, on their own Claude plan. Show and tell at the end.

Hands on keyboards, not a slide marathon. That's my favourite way to learn something new, and judging by the room, I'm not the only one.

# What everyone built

Every person set up their own crew: an orchestrator, a builder and a reviewer, all Claude Code sessions running in the background. [Tares](https://github.com/glassflow/tares) held the plan, the tickets, the reviews and their answers.

Then they gave it a small test job: a click counter for a tiny link shortener. A short planning interview turned the idea into two tickets. The builder opened one pull request per ticket, the reviewer checked each one, and once CI was green, they merged. At the end, the orchestrator asks the best question in the whole flow: "Is it done?"

Watching a room full of people see their first crew-made PR land on main is a very good feeling.

![A full room at JetBrains München, everyone building on their laptops](../../images/munich-workshop-room.jpg)

# Five levels of a factory

The part people asked most about afterwards was the levels. A crew can run at five levels, depending on how much you want to hand over:

| Level | What the crew does |
|---|---|
| L1 | Writes code, no commit |
| L2 | Commits locally on a branch |
| L3 | Opens pull requests, you merge |
| L4 | Merges to main once review and CI pass |
| L5 | Ships to production: the "dark factory" |

At GlassFlow we run L4 day to day. L5 runs for bug triage, with a person in the loop over Slack. For hobby projects, go straight to L5 and enjoy waking up to shipped features.

I also shared one of our bigger runs: porting a Go and React web app to a native desktop app in TypeScript. About 270 tickets, worked through by a crew.

# Questions from the room

**How do builders not trip over each other?** Only builders write code, and each one works in its own git worktree. When parallel work conflicts, a helper agent works out the merge order.

**Where do the tests run?** Twice. The reviewer runs them itself, then CI runs them again.

**How does the crew remember things?** Tares holds the organisation's context and the rules for each project, shared or personal. We first tried a shared context repo for all sessions, and it went stale fast. A live record that the crew reads and writes works much better.

Florian put the core idea really well in [his recap](https://claudecode-muenchen.de/blog/claude-community-x-glassflow-rueckblick):

> In the factory, Tares and hooks enforce the order of steps, the handovers and the gates outside the model. In a single orchestrator session, they depend on the model keeping to them.

That's the whole point of a factory, in two sentences.

# Tips if you run it yourself

- **Approve the tools once, before you start.** Setup took longer than planned for many people, mostly because of Claude Code's permission prompts. Each station needs a few tools approved once; after that it runs on its own. Doing it at home saves you the wait on venue Wi-Fi.
- **Use a public copy of the starter repo.** Branch protection on private GitHub repos needs a paid plan.
- **One builder is plenty for the demo.** Two tickets don't need two builders, and it saves your plan's limits.

# Rius and the context window

We also showed Rius, our observability for agents. It has alerts for the silent failures every agent user has seen: a tool loop calling the same thing with the same arguments, swallowed errors, context rot. It also shows you what auto-compaction dropped.

![The slide Agents fail silently, and say done: 11% of about 10k runs ended with the agent confidently claiming success](../../images/munich-workshop-agents-say-done.jpg)

The bonus for early finishers was fun: give Claude Code a tool that answers every question with the whole company handbook, watch `/context` jump by about 60k tokens after one prompt, then watch Rius name the tool that did it.

![Presenting the Tares console from the podium](../../images/munich-workshop-console.jpg)

Everyone also went home with $50 in Claude API credits.

# Thank you

- **Dr. Florian Steiner**, for organising, and for the best recap of the evening.
- **JetBrains München** and Maria Mikheyshina, for the space and the drinks.
- **Anthropic**, for supporting community events like this one.
- **Armend**, for running it with me.
- **Everyone who came**, built, asked good questions and stayed for show and tell.

# Do it at home

Everything from the evening is online at [workshop-munich.glassflow.ai](https://workshop-munich.glassflow.ai/): the guides (local or in a hosted workspace), the slides as a PDF, the [starter repo](https://github.com/glassflow/factory-workshop-starter) and a ready-made spec if you want to skip the interview.

If you want the longer story of how the factory works and what I use it for, I wrote it up here: [My Software Factory](/posts/software-factory/). A week earlier we did the same build in Berlin: [Berlin recap](/posts/claude-community-berlin/).

What others posted about the night:

- [Claude Code Community Munich's recap](https://www.linkedin.com/posts/claude-code-community-munich_claude-community-x-glassflow-build-a-software-activity-7521983041838186496-YFsF)
- [GlassFlow's recap](https://www.linkedin.com/posts/glassflow-dev_claudecode-softwarefactory-aiagents-activity-7521859909437599744-825D)
- [Florian's 25-second preview of the build](https://www.linkedin.com/posts/floriansteiner_25-seconds-on-what-we-build-on-thursday-activity-7520167917229903872-Y0vm)

*Photos: GlassFlow and Claude Code Community Munich.*

> # Servus Munich, see you at the next one 🍺

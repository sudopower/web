+++
date = '2026-11-02T12:00:00+01:00'
draft = false
title = 'My Software Factory: One Session to Talk To, a Crew That Ships'
description = 'What a software factory is, how ours works on top of Tares, and the kind of work I hand it now.'
excerpt = "I used to keep a dozen Claude Code sessions open and spend my day being the router between them. Now I talk to one, and a crew does the rest."
tags = ['software-factory', 'claude-code', 'ai', 'tares', 'automation']
image = 'images/software-factory-crew.png'
+++

# The problem I had

By September I had a habit. A dozen Claude Code sessions open, sometimes close to thirty in a day, one per repo or per idea. Each one was fast. I was the slow part.

I carried context from one session to the next. I checked whether the tests really ran. I typed "yes, merge it" twenty times a day. The model was not the bottleneck. I was.

So I tried to take myself out of the middle.

![Claude Code by hand, what goes wrong: it forgets after a restart, goes quiet, two sessions collide, merges blind, stalls on a permission prompt](../../images/software-factory-by-hand.jpg)

# What a software factory is

A software factory is a crew of Claude Code sessions that takes a plan and turns it into merged pull requests. Each session has one job and a stable name. They run on your own machine, on your own Claude plan. No API keys.

Ours is built into [Tares](https://github.com/glassflow/tares), the open-source tool we build at GlassFlow. I started the factory part as a side repo in early October for a workshop demo, and a week later it became part of Tares.

The crew:

- **Orchestrator.** The only session you talk to. It hands out work, answers the others and brings you what needs you.
- **Builders.** One per repo for the current milestone. They write the code, the tests and the PR.
- **Reviewer.** Checks every PR before it can merge.
- **Releaser** (optional). Cuts a release when a milestone lands.

Everything the crew decides and everything you answer is written to Tares. If a session fills its context or stops, a fresh one picks up the same role with the same record. My favourite line from the slides: *sessions come and go; the record stays.*

![How it fits together: you talk to the orchestrator, which runs builders, a reviewer and an optional releaser; they open GitHub PRs and post a verdict, and everything goes through MCP into Tares](../../images/software-factory-architecture.jpg)

# How one piece of work flows

Say you want a click counter on a link shortener. That was our workshop demo.

1. **Plan together.** `tares factory spec "add a click counter"` reads the repo and interviews you, one question at a time, each with a recommended answer. A second model then pokes holes in the plan. You end up with a spec, milestones with acceptance checks, and tickets.
2. **Build.** The orchestrator starts a builder. The builder works in its own git worktree, writes the code and the tests, and proves each new test fails on broken code. Then it opens a PR.
3. **Review.** The reviewer runs the tests itself instead of trusting the PR text, looks past the diff for anything else the change might break, and posts a verdict.
4. **Merge.** Reviewer pass plus green CI is the gate. You choose how far the crew may go: every merge waits for your yes, or the crew merges on its own once the gate is green.
5. **Unknowns don't block.** When the crew hits something it doesn't know, it writes down an assumption and keeps going. You confirm those once per milestone, not once per ticket.
6. **"Is it done?"** At the end it asks you. You say yes.

From starting the crew to the last merge, the demo took about 30 minutes, 7 of them planning. It used about 5% of a 5-hour window on a Max plan.

![You answer three times, the crew does the rest: the interview, the hand-over, and "Is it done?"](../../images/software-factory-three-answers.jpg)

![A finished project in Tares: three milestones, eight tickets, every one merged with its review round](../../images/software-factory-tickets.png)

# What changed for me

The biggest change: I stopped juggling sessions. I type into one to three sessions a day now. Every question lands in the orchestrator, one at a time, with a recommendation attached, so most of my answers are "yes".

![The Crew page in Tares: orchestrator, reviewer and releaser working, builders per project, a question waiting for me and PRs waiting for review](../../images/software-factory-crew.png)

The second change: many projects at once. In October I had **12 projects** running through the factory, with up to **7 of them merging on the same day**. About a third of all merges landed between midnight and 8 in the morning, while I was asleep.

Some runs I'm happy about:

- A side project went through **202 PRs in four and a half days.**
- [lore](https://github.com/sudopower/lore), a public repo of mine, got **20 PRs in under a day.**
- A docs project: **8 merged PRs in about 3 hours**, and the crew needed only 5 answers from me.
- A refactor across repos: **17 PRs in half a day.**

Compared with driving sessions by hand in September, I now merge about **five times more PRs a day**, and less than half as many need a follow-up fix within a week. A PR costs about 0.4% of a weekly Max 20x plan, roughly 20 cents of the $200.

And every morning a standup is waiting for me:

![Crew standup: eight tickets merged across four projects, two waiting on an answer from me](../../images/software-factory-standup.webp)

# What I hand it

- **Planned feature work.** Anything you can describe with acceptance checks. The spec interview does most of the thinking with you.
- **Many small and medium projects in parallel.** This is where it shines. One person, several projects moving at once.
- **Changes across repos.** One feature I shipped touched seven repos. Each repo gets its own builder and the orchestrator keeps them in step.
- **The steady stream.** Bugs coming in from Linear, flaky tests from CI, backlog sweeps. These run on a loop and turn into PRs.
- **Tests, docs and refactors.** The important work that never quite gets prioritised.
- **Overnight work.** Plan before dinner, read the standup at breakfast.

# What I keep

The factory is great at work. People are great at decisions. So the human part is small, but it's the part that matters:

- The plan and the product calls.
- Confirming assumptions.
- Choosing how far the crew may go.
- Saying "done".
- Anything with real-world reach: production deploys, secrets, billing, talking to people.

The crew never messages people for you. When a permission gets refused, it lands on your desk, and one click turns it into a standing grant.

# Rules that came from real runs

What I like most is how it keeps getting better. Every time something went sideways in a real run, it became a rule. *Incidents become rules.* A few favourites:

- **Tests must fail on broken code.** A test that passes either way proves nothing.
- **Verify, don't read.** The reviewer runs things. It doesn't trust what the PR description says.
- **One owner per action.** Only one station does a given thing, so nobody steps on anybody.
- **Unknowns don't block.** Write the assumption down, keep moving, confirm later.

Claude Code changes its mechanics often. The method keeps working on top of them.

# Try it

- Get started: [docs.glassflow.ai/tares/software-factory](https://docs.glassflow.ai/tares/software-factory/get-started)
- Code: [glassflow/tares](https://github.com/glassflow/tares) (MIT)
- Run the workshop demo yourself: [glassflow/factory-workshop-starter](https://github.com/glassflow/factory-workshop-starter)
- The slides: [sudopower.com/tares-factory](https://sudopower.com/tares-factory/)
- A short video from GlassFlow: [What Is a Software Factory?](https://youtu.be/xn4r-9C4GB0)
- How we run it as a team at GlassFlow, by Ashish: [What is a software factory](https://www.glassflow.ai/blog/what-is-a-software-factory)

I showed all of this at the Claude Community workshops in [Berlin](/posts/claude-community-berlin/) and [Munich](/posts/claude-community-munich/). Those posts are about the evenings themselves.

> # Agents do the work. People make the decisions. 🏭

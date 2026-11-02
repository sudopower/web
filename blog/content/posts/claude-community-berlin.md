+++
date = '2026-11-02T10:00:00+01:00'
draft = false
title = 'Claude Community Berlin: An AI SRE and a Software Factory in One Evening'
description = 'The first Claude workshop in Berlin: a packed room at P.19 Studio, a service broken on purpose, and a crew of Claude Code sessions shipping a feature.'
excerpt = "65 seats, a waitlist, pizza, and two builds: an AI SRE that finds out why a service broke, and a software factory that takes a feature from plan to main."
tags = ['berlin', 'software-factory', 'claude-code', 'tares', 'community', 'workshop', 'ai-sre']
image = 'images/berlin-workshop-group.jpg'
+++

On Thursday 22 October we ran the first Claude workshop in Berlin. Mehul Patel and Markos Sfikas organised it with the Claude Community, Anthropic backed it, and we at GlassFlow opened up P.19 Studio for the evening.

The response was huge. 65 seats, a waitlist, and still people who couldn't get in.

![Group photo of the attendees and hosts at the Claude workshop in Berlin](../../images/berlin-workshop-group.jpg)

# The format

The title was "Build agents that debug and review with Claude Code". Hands-on, laptops open, no slide marathon. Ashish, our CTO, led the evening. We opened with Tares in ten minutes, then two builds, both running on [Tares](https://github.com/glassflow/tares), our open-source tool.

![The opening slide, Claude Workshop Berlin, next to the Welcome Berlin banner](../../images/berlin-workshop-opening.jpg)

And yes, there was pizza.

![Pizza, the fuel of every good workshop](../../images/berlin-workshop-pizza.jpg)

# Part 1: an AI SRE

Everyone started a small live service with steady traffic. Its Prometheus metrics, error logs and alerts all land on one timeline in Tares. Then they built two agents on top:

- **A watcher** on a small, cheap model. It looks every 2 minutes and says either "nothing to do" or "investigate".
- **A root-cause agent** on a bigger model. It only wakes up when the watcher escalates.

Then the fun part: break the service on purpose and wait. A finding shows up 2 to 4 minutes later: what's failing, since when, the likely cause and a next step. In our own test run, the model calls for the whole guide came to 7 cents.

![Cheap model always on. Big model only when it matters.](../../images/berlin-workshop-ai-sre.jpg)

The question that got the whole room going: why use an LLM as the watcher at all? Could a decision model do that job? Ashish had tested exactly that, running a decision model next to Claude Haiku on our own production logs for six days. As a filter in front of the LLM, it would cut about 80% of the calls. He wrote it up here: [Decision model vs LLM](https://www.glassflow.ai/blog/decision-model-vs-llm).

# Part 2: the software factory

The software factory part was mine. I built the kit everyone ran and walked the room through it.

Every person set up their own crew on their own laptop and their own Claude plan: an orchestrator, a builder and a reviewer, all Claude Code sessions in the background. The test job was a click counter for a tiny link shortener. A short planning interview turned it into two tickets. The builder opened one pull request per ticket, the reviewer checked each one, and once CI was green, they merged. Then the orchestrator asks: "Is it done?"

![Walking through the software factory guide: 13 steps in four stages](../../images/berlin-workshop-factory.jpg)

The factory questions went in two directions.

**Teams.** Everyone built a factory for themselves. What happens when a whole team shares one: one plan, one set of tickets, one review bar? That was the big one.

**Code understanding.** How can the crew know my codebase better: a code graph, embeddings, something else? Still an open question, and I'd love to hear what has worked for you.

One attendee, a tech lead, wrote afterwards that the workshops "were well prepared and gave me a lot to think about regarding the SDLC." That's exactly what I hoped for. A software factory is less about writing code faster and more about rethinking how work moves from an idea to main.

![Helping attendees at their table while their crews run](../../images/berlin-workshop-helping.jpg)

# The best part came after

Mehul put it perfectly in his recap:

> People stayed back to show me what they're building: side projects, startups, internal tools nobody outside their team has seen yet.

Same for me. Show and tell ran late, and the conversations ran later. I went home with a head full of other people's projects and a lot of new connections.

![The room at P.19 Studio, full of people building](../../images/berlin-workshop-room.jpg)

# Thank you

- **Mehul Patel** and **Markos Sfikas**, for organising and for being great people to build this with.
- **Anthropic** and the Claude Community team, Cassie Baquero Mayes and Chiara Massironi, for backing community events like this.
- **Rajesh Nai, Suchitra Swain and Pratik**, for volunteering and making the evening run smoothly.
- **Ashish**, for leading the evening.
- **Mitesh Pokar**, for the photos.
- **Everyone who came**, stayed late and asked hard questions.

# Do it at home

Everything from the evening is online at [workshop-berlin.glassflow.ai](https://workshop-berlin.glassflow.ai/): both guides (on your laptop or in a free hosted workspace), the slides and the [starter repo](https://github.com/glassflow/factory-workshop-starter).

If you want the longer story, I wrote up how the factory works and what I use it for: [My Software Factory](/posts/software-factory/). There's also a short video from GlassFlow: [What Is a Software Factory?](https://youtu.be/xn4r-9C4GB0). A week later we took the factory to Munich: [Munich recap](/posts/claude-community-munich/).

What others posted about the night:

- [Mehul's recap](https://www.linkedin.com/posts/nomadicmehul_claudecode-berlin-devops-activity-7521148292832092160-ii-T)
- [Ashish's recap](https://www.linkedin.com/posts/activity-7521518797795512322-tDTr)
- [GlassFlow's recap](https://www.linkedin.com/posts/glassflow-dev_claudecode-aiagents-devops-activity-7519336999053508608-lZAA)

*Photos: Mitesh Pokar (@picastry).*

> # Danke, Berlin. See you at the next one 🍕

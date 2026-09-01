+++
date = '2026-09-01T15:39:00+02:00'
draft = false
title = "My Disk Was 94% Full and Docker Desktop Wasn't Even Installed"
description = 'Turned a why-is-my-Mac-dying moment into a script, a Claude Code skill, and a scheduled weekly check. 151GB of it was a single ghost folder.'
excerpt = "Spinning beachballs, save dialogs hanging, the works. Turned out a big chunk of it was an app I uninstalled ages ago, still sitting on disk like nothing happened."
tags = ['claude-code', 'ai', 'macos', 'automation', 'tooling']
image = ''
+++

# The pain

My Mac had been acting up for a few days. Save dialogs taking a second too long to open, Xcode-adjacent stuff stuttering, that general feeling of a machine wading through mud. I finally checked and saw 30GB free out of 460GB. 94% full. No idea why, I hadn't downloaded anything huge recently.

So instead of manually poking through Finder folder by folder like some kind of animal, I had Claude Code do a full pass: process list, disk usage, biggest directories, what apps are actually worth keeping.

# The big one

Turns out `~/Library/Containers/com.docker.docker` was sitting at **151GB**.

Docker Desktop isn't even installed on this machine anymore, I switched to OrbStack a while back and forgot Docker Desktop leaves its whole VM disk image behind when you remove it. The app was gone, the 151GB ghost of it was not. Deleted it, and just like that: 30GB free became 180GB free.

# The rest of the mess

Once the big rock was out of the way, the gravel added up too:

- OrbStack itself had **21GB** of unused images, build cache, and volumes just sitting there (`docker image prune`, `docker builder prune`, `docker volume prune` cleared it out)
- `go build` cache, JetBrains cache, and a pile of app auto-updater junk (Linear, Lens, Loom, Slack) added another **~20GB**
- A fake "Numbers Creator Studio" app that is very much not Apple's Numbers
- **eqMac** and **Lens**, redundant with tools I actually use day to day (k9s instead of Lens, and honestly do I need three different audio routing utilities on one laptop? no)
- Two orphaned LaunchAgents from apps I don't have anymore (Red Hat CodeReady Containers, VirtualBox)

End state: **233GB free**, disk usage down to 5%.

| | Before | After |
|---|---|---|
| Free space | 30GB | 233GB |
| Disk usage | 94% | 5% |

# The side quest: Warp eating energy

While I was in there I also noticed macOS flagging Warp for high energy use. I've got 5 Claude Code sessions running in different tabs and figured that was probably it. It wasn't.

Turned out Warp had a process stuck mid auto-update, literally `--finish-update` sitting in the process args, chewing through CPU for almost 5 hours straight. Not a Claude Code problem, not even really a "Warp is bloated" problem, just a hung updater that a restart fixed. Worth knowing the difference before you go blaming the wrong thing.

# Turning it into something reusable

Doing this by hand once is fine. Doing it by hand every few months when the disk warning pops up again is not a plan. So the whole audit (the read-only, safe part, not the "delete stuff" part) is now:

- A **Claude Code skill** (`mac-health-check`) that runs the scan, walks through a checklist of what's usually safe to clean vs what needs a second look, and only touches anything with confirmation
- A standalone bash script that does the actual scanning: disk usage, biggest directories, dev tool caches, and the useful bit, **orphan detection**, it diffs everything sitting in `~/Library/Containers` against what's actually installed and flags anything over 100MB with no matching app. That's exactly how the Docker ghost would've shown up automatically instead of me stumbling into it.
- It also catches stuck long-running high-CPU processes, which is what would've caught the Warp thing without me having to notice a battery warning first

Script's up as a gist if you want to run it yourself, no Claude Code required, it's just bash: [gist.github.com/sudopower/68e85a0f8cdf52f3114c84ec2a905372](https://gist.github.com/sudopower/68e85a0f8cdf52f3114c84ec2a905372)

# Running it on a schedule

The scan is read-only so there's no harm in automating it. I set it up as a `launchd` agent that runs every Monday at 9am, logs to `~/Library/Logs/mac-health-check.log`, and fires a macOS notification only if disk usage crosses 85%. No need to open a log file every week if nothing's wrong.

```xml
<!-- ~/Library/LaunchAgents/dev.kiran.mac-health-check.plist -->
<key>StartCalendarInterval</key>
<dict>
  <key>Weekday</key><integer>1</integer>
  <key>Hour</key><integer>9</integer>
  <key>Minute</key><integer>0</integer>
</dict>
```

Load it with `launchctl load ~/Library/LaunchAgents/dev.kiran.mac-health-check.plist` and forget about it until it actually has something to tell you.

If you want more than a raw log dump, you can point Claude Code's scheduler at the skill instead and get an actual written summary with suggested cleanup steps, but honestly the plain script + notification is enough for a weekly nag.

# Takeaway

Disk space problems are rarely one obvious hog you can eyeball in Finder. It's usually one dead app that left a body behind, plus a dozen small things that never clean up after themselves. Worth having something that checks for both, instead of waiting for the "your disk is almost full" popup to go do it manually again.

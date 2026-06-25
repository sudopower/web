+++
date = '2026-05-30T00:00:00+00:00'
draft = true
title = 'Running OpenCode on My Homelab'
description = 'Setting up OpenCode as a web-accessible AI coding agent on a MacBook Air homelab, accessible from any machine on the LAN.'
excerpt = 'How I set up OpenCode on a MacBook Air homelab with a local LLM, and access it from my MacBook Pro over the network.'
tags = ['homelab', 'ai', 'opencode', 'ollama']
image = ''
+++

# The Goal

I have a MacBook Air running a `kind` Kubernetes cluster for homelab experiments. I wanted to run [OpenCode](https://opencode.ai) — a terminal-based AI coding agent — on it and access the web UI from my main MacBook Pro.

# Why Not Kubernetes?

The Air's `kind` cluster runs inside Docker on macOS, which adds an extra networking layer. OpenCode also needs direct filesystem access to read and write code — mounting host directories into pods via `hostPath` is fragile. Running on the host directly is simpler and more reliable.

# Setup

## Install OpenCode

```bash
brew install node
npm install -g opencode-ai
```

## Run as a persistent service

OpenCode has a `web` mode that starts an HTTP server with a browser UI. To bind it to the LAN and keep it running across reboots, I used a launchd plist at `~/Library/LaunchAgents/dev.opencode.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>dev.opencode</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/opencode</string>
    <string>web</string>
    <string>--hostname</string><string>0.0.0.0</string>
    <string>--port</string><string>4096</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>ANTHROPIC_API_KEY</key><string>sk-ant-...</string>
    <key>OPENCODE_SERVER_PASSWORD</key><string>yourpassword</string>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/opencode.log</string>
  <key>StandardErrorPath</key><string>/tmp/opencode.err</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/dev.opencode.plist
```

The UI is then accessible from any machine on the LAN at `http://192.168.x.x:4096`.

# Running a Local Model with Ollama

Rather than paying for API calls, I wanted to run a model locally on the Air (Apple M1, 8GB RAM). The best fit at that memory budget is `qwen3:8b` — good general coding ability, fits comfortably in 8GB.

```bash
brew install ollama
brew services start ollama
ollama pull qwen3:8b
```

OpenCode supports custom OpenAI-compatible providers via `~/.config/opencode/config.json`. Ollama exposes an OpenAI-compatible API at `localhost:11434/v1`:

```json
{
  "model": "ollama-local/qwen3:8b",
  "provider": {
    "ollama-local": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "http://localhost:11434/v1"
      },
      "models": {
        "qwen3:8b": {}
      }
    }
  }
}
```

Restart opencode and the model shows up in the UI. First response is slow while the model loads into memory — subsequent ones are fast.

# Accessing from the MacBook Pro

Two ways to use it from the Pro:

**Browser** — navigate to `http://<air-ip>:4096`, log in with `opencode` / your password.

**TUI** — install opencode on the Pro and attach to the remote server:

```bash
npm install -g opencode-ai
opencode attach http://192.168.x.x:4096 --password yourpassword
```

This gives the full terminal UI locally, backed by the Air's server and model.

# Notes

- Anthropic Claude Pro/Max subscriptions can't be used with third-party tools — you need a direct API key from [console.anthropic.com](https://console.anthropic.com).
- `qwen2.5-coder:7b` was tried first but had erratic tool-calling behaviour (responding to casual messages with raw JSON tool calls). `qwen3:8b` behaves much better.
- The `PATH` env var in the launchd plist is important — launchd doesn't inherit your shell's PATH and won't find Homebrew binaries otherwise.

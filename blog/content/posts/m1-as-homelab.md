+++
date = '2026-05-20T12:50:00+02:00'
draft = false
title = 'M1 as a Homelab'
description = 'Folding my unused MacBook Air under my work MacBook Pro and turning it into a small homelab running kind.'
excerpt = "Most devs barely touch their personal laptop. Mine is now a tiny homelab I never look at — kind cluster today, maybe Photos and Ollama later."
tags = []
image = '/images/m1-homelab-hero.jpg'
+++

# Why ?

I've had this M1 MacBook Air sitting on my desk for ages. 8GB RAM, perfectly fine little machine. Like most devs I barely touch it — the company laptop runs the show and the personal one mostly just exists.

Felt wasteful. So I plugged it into my work MacBook Pro over USB-C, folded both lids on a vertical stand, and turned the Air into a tiny homelab I never look at.

# Setup

Two Macs on a vertical stand, lids closed. The Pro is the one I actually use (external display + keyboard). The Air sits next to it in clamshell mode. Single USB-C cable between them.

I never touch the M1 physically. Screen Sharing if I want the GUI, SSH for everything else. The keyboard might as well not exist. There's something pleasing about a computer that just sits there and works.

![setup](/images/m1-homelab-setup.jpg)

Quick sanity check that both are actually on the network:

```sh
arp -a | grep -v incomplete | awk '{print $2, $1}' | column -t
# (192.168.178.23)   macbookair.fritz.box        ← the M1, over Wi-Fi
# (169.254.214.49)   kirans-macbook-pro.local    ← the MBP, over USB-C
# (192.168.178.1)    fritz.box
# ...
```

Two paths to the M1: Wi-Fi via the router and link-local over the USB-C cable. The cable is faster, the router is more stable across sleep. I use whichever responds.

How much faster is the cable? About 6×:

```sh
$ ping -c 10 169.254.165.143       # USB-C link-local
round-trip min/avg/max/stddev = 0.947/1.111/1.236/0.107 ms

$ ping -c 10 192.168.178.23        # Wi-Fi via the router
round-trip min/avg/max/stddev = 5.943/6.691/8.153/0.787 ms
```

Not life-changing for kubectl, but it matters when I'm pushing images or copying big files.

# Plan

Right now it runs a kind cluster. That's it. Maybe later:

- Move my Photos library onto it so my main disk stops crying.
- Run Ollama locally as a fallback in case Claude / Cursor decide to triple their pricing one Monday or have a bad outage day. A worse local model is still a model.
- Whatever else I think of. It's more hack than need.

# The cluster

`colima` + `kind`. Docker Desktop's idle footprint is rude on 8GB so I skipped it.

```sh
brew install colima kind
colima start --cpu 4 --memory 5 --disk 50 --vm-type vz --vz-rosetta
kind create cluster --config kind-dev.yaml
```

# Reaching it from the MBP

The fun bit. Kind binds the API server to `127.0.0.1` inside the VM, colima forwards it to `127.0.0.1` on the host. Cool. Useless if "the host" is a different laptop.

SSH tunnel works but you have to remember to start it. Skip. Instead: `socat` as a launchd agent on the M1, rebinding port 6443 onto `0.0.0.0`, starting at login, restarting if it dies. Add the M1's LAN IP to the kind cert SANs so the cert is happy.

```sh
# on the MBP
scp m1:~/kubeconfig-dev-for-mbp.yaml ~/.kube/kind-dev.yaml
kubectl --kubeconfig ~/.kube/kind-dev.yaml get nodes
# NAME                STATUS   ROLES           AGE   VERSION
# dev-control-plane   Ready    control-plane   2m    v1.35.0
```

Tradeoff: anyone on my home Wi-Fi who has my kubeconfig can hit the API. Risk: my apartment, my problem.

# What's actually running

I run [glassflow](https://github.com/glassflow/clickhouse-etl) — the thing I work on — without burning my MBP's memory. Local testing, debugging, and the cluster I'll throw at my Kubernetes exam prep all live here now.

From the MBP:

```sh
$ kubectl config current-context
kind-dev

$ kubectl get nodes -o wide
NAME                STATUS   ROLES           AGE   VERSION   INTERNAL-IP   OS-IMAGE                         KERNEL              CONTAINER-RUNTIME
dev-control-plane   Ready    control-plane   65m   v1.35.0   172.18.0.2    Debian GNU/Linux 12 (bookworm)   6.8.0-100-generic   containerd://2.2.0

$ helm list -n glassflow
NAME       NAMESPACE  REVISION  STATUS    CHART                 APP VERSION
glassflow  glassflow  1         deployed  glassflow-etl-0.5.18  3.1.0

$ kubectl get pods -n glassflow
NAME                                            READY   STATUS    RESTARTS   AGE
glassflow-api-6df5dd58cf-5dcns                  1/1     Running   0          26m
glassflow-controller-manager-5494bb5f7c-bcpsl   1/1     Running   0          26m
glassflow-nats-0                                2/2     Running   0          26m
glassflow-nats-box-7dbfc4f47f-w7ckt             1/1     Running   0          26m
glassflow-postgresql-0                          1/1     Running   0          26m
glassflow-ui-5db85889b9-zdwgt                   2/2     Running   0          34m
```

API, controller, NATS, Postgres, UI — six real pods doing real work on a laptop I can't see from where I'm sitting. Packets leave the MBP, cross the USB-C cable, get NAT'd into a Linux VM, land in containers on the Air, come back. A small Rube Goldberg and I love it.

> # Result: a kube cluster I never have to look at 🚀

# Next

1. Photos library on the M1, off my main disk.
2. Ollama, just in case.
3. Whatever else looks like fun.

Zero ROI, full nerd points. I'll take it.

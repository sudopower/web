+++
date = '2026-06-25T12:00:00+01:00'
draft = false
title = 'Shrink your Kubernetes init containers: swap curl for netcat'
description = 'How replacing curlimages/curl with alpine + netcat-openbsd cut our wait-probe image size by 65%'
excerpt = 'A small but satisfying change: replacing a curl-based TCP probe with netcat made our Kubernetes init container 65% smaller and the intent instantly obvious.'
tags = ['kubernetes', 'docker', 'devops', 'optimization']
image = 'images/wait-probe-size.svg'
+++

We run a [wait-probe](https://github.com/glassflow/wait-probe) init container in our Kubernetes deployments to gate service startup on Postgres and NATS being ready. It was present in two deployments (the API and the operator) each with two init containers (one for Postgres, one for NATS), so four instances in total per cluster.

The image was built on `curlimages/curl`. After switching to `alpine:3.20` + `netcat-openbsd` and measuring both published versions:

| Image | Uncompressed size | |
|---|---|---|
| `wait-probe:1.0.0` (curlimages/curl) | 25.7 MB | |
| `wait-probe:1.1.1` (alpine + netcat-openbsd) | **9.05 MB** | **65% smaller** |

Four instances × 16.7 MB saved = **~67 MB less to pull per node** on a cold start. The `netcat-openbsd` package itself is about 80 KB; `curlimages/curl` carries TLS libraries, certificate bundles, and everything else curl needs to speak HTTP/S. None of that is useful for a TCP port check.

## The original probe

```yaml
initContainers:
  - name: wait-for-postgres
    image: curlimages/curl:latest
    command:
      - sh
      - -c
      - |
        until (curl --silent --connect-timeout 2 --max-time 3 \
          "http://postgres-host:5432" >/dev/null 2>&1; [ $? -ne 7 ]); do
          sleep 2
        done
```

This works. But every time I read it I have to stop and reconstruct the logic: curl to a raw TCP port, check if the exit code is **not** 7 (connection refused), loop until it isn't. It's exit-code archaeology.

## What exit code 7 means (and why you shouldn't have to know)

curl exit code 7 is `CURLE_COULDNT_CONNECT`: the host refused the connection. So the idiom above is: "keep looping while the port is refusing connections; stop when anything else happens." That anything else includes curl successfully connecting, timing out, or hitting a different error. In practice it works for TCP readiness checks, but it's a roundabout way to say "is this port open."

## netcat does exactly one thing here

`nc -z` opens a TCP connection to a host and port, exits 0 on success, non-zero on failure. That's the whole API. The probe becomes:

```yaml
initContainers:
  - name: wait-for-postgres
    image: ghcr.io/glassflow/wait-probe:latest
    command:
      - sh
      - -c
      - |
        until nc -z postgres-host 5432; do
          sleep 2
        done
```

The intent is in the flag name. `-z` = zero I/O mode = just check if the port is open. No exit code lookup required. The same pattern works identically for NATS:

```sh
until nc -z nats-host 4222; do sleep 2; done
```

## The Dockerfile

```dockerfile
FROM alpine:3.20
RUN apk add --no-cache netcat-openbsd
USER 100
```

The `USER 100` matters for Kubernetes: without a numeric UID, `runAsNonRoot: true` fails because the kubelet can't verify a string username like `curl_user` is non-root. A numeric UID it can check directly. This also plays nicely with OpenShift's `restricted-v2` SCC; no `runAsUser` in the pod spec means OpenShift injects a UID from the namespace range without conflict.

## When this matters more than you'd think

Init containers run on every pod restart. A leaner image:

- Pulls faster on a cold node
- Evicts less useful layers from the node's image cache
- Gives the security scanner less surface area to flag

None of this is a crisis at small scale. But it's also a five-minute change with no downside, and the probe is easier to read afterwards.

---

The image is published at `ghcr.io/glassflow/wait-probe` if you want to use it directly. Source and Dockerfile are on [GitHub](https://github.com/glassflow/wait-probe).

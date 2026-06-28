+++
date = '2026-06-23T12:00:00+01:00'
draft = false
title = "JSON vs Protobuf vs Avro"
description = 'Benchmarking why binary, schema-based serialization decodes far faster than JSON, and what survives end-to-end in a resource-capped Kafka consumer.'
excerpt = 'Protobuf and Avro decode ~20x faster than JSON in a microbenchmark and ~7x faster in a real pipeline. The popular explanation ("no keys in the payload") is only half the story.'
tags = ["go", "kafka", "serialization", "performance", "protobuf", "avro"]
image = 'images/serde-characters.png'
+++

# The claim I wanted to test

There's a piece of folklore that goes: *Protobuf pipelines are much faster than
JSON pipelines because the keys aren't in the payload; they're defined and
ordered in the schema, so you don't ship `"temperature"` a million times.*

That sounds obviously true. It's also incomplete, and I wanted to find out by how
much. So I built a small harness comparing **JSON, Protobuf, and Avro** on the
same record, first as a pure serialization microbenchmark, then end-to-end
through a resource-capped Kafka consumer.

Spoiler: dropping the keys is real and it matters, but roughly *half* the speedup
has nothing to do with keys at all.

> 📦 **Code:** [`sudopower/playground/serde-pipeline-bench`](https://github.com/sudopower/playground/tree/master/serde-pipeline-bench)
> codecs, microbenchmarks, and the Kafka pipeline harness.

# What each format puts on the wire

Take one field, `temperature: 23.5`:

| Format   | On the wire                       | Field identity      |
| -------- | --------------------------------- | ------------------- |
| json     | `"temperature":23.5` (text)       | full field name     |
| protobuf | `[tag][8 bytes]` (binary)         | a numeric tag       |
| avro     | `[8 bytes]` (binary)              | nothing: position   |

JSON ships the field name as text every single time. Protobuf replaces the name
with a one-byte tag that packs the field number *and* wire type
(`field_number << 3 | wire_type`). Avro ships nothing to identify the field; the
schema fixes the order, so the payload is just values back to back.

So it's a spectrum of "how much per-field identification travels with the data":

```
full names  →  numeric tags  →  nothing
  json           protobuf        avro
 (biggest)                     (smallest)
```

# The setup

One canonical record: a 12-field telemetry event with a realistic mix of
strings, floats and ints, and *normal-length* field names (no cheating with short
keys). Every format serializes the same struct; only the encoding changes.

A few rules to keep it honest:

- **Correctness gate first.** Every codec must round-trip the record exactly
  before any timing is trusted.
- **Protobuf via `protowire`.** I hand-rolled the encode/decode over the official
  low-level `protowire` package instead of generating code with `protoc`. The
  bytes are identical to generated code, and it keeps the repo buildable with
  plain `go build`.
- **Deterministic data**, rotated over 256 distinct records so I'm not measuring
  one cache-hot payload.

The whole thing runs with three commands:

```sh
go test ./internal/codec -run TestRoundTrip   # correctness gate
go run ./cmd/sizes                            # wire sizes
go test ./bench -run x -bench . -benchmem     # speed + allocs
```

# Microbenchmark: size and speed

First the wire size:

```sh
$ go run ./cmd/sizes
FORMAT     BYTES/MSG (avg)  VS JSON
avro       92.6             30%
protobuf   104.1            34%
json       309.8            100%
```

Then speed and allocations (`-benchmem`), on an Apple M2 Pro:

```sh
$ go test ./bench -run x -bench . -benchmem
BenchmarkUnmarshal/avro-10       8649637    138.0 ns/op     36 B/op   0 allocs/op
BenchmarkUnmarshal/protobuf-10   9685346    123.7 ns/op     46 B/op   4 allocs/op
BenchmarkUnmarshal/json-10        489176   2416   ns/op    264 B/op   8 allocs/op
```

Pulling out the decode numbers (the half a pipeline does most; you read far more
than you write):

| Format   |  decode ns/op | allocs/op | vs JSON |
| -------- | ------------: | --------: | ------: |
| protobuf |           124 |         4 |   ~20x  |
| avro     |           138 |        0\* |   ~18x  |
| json     |          2416 |         8 |     1x  |

…and the sizes:

| Format   | Bytes | vs JSON |
| -------- | ----: | ------: |
| avro     |  92.6 |    30%  |
| protobuf | 104.1 |    34%  |
| json     | 309.8 |   100%  |

About **3x smaller** and **~20x faster to decode**. Case closed?

Not quite, and the interesting part is *why*.

## Why is Avro smaller than Protobuf?

Both drop the field names, but Protobuf still spends ~1 tag byte per field. Twelve
fields ≈ 12 bytes, which is almost exactly the gap (104.1 − 92.6 ≈ 11.5). Avro
spends zero.

That extra byte isn't waste; it's what buys Protobuf **schema evolution**. Tags
mean you can add, remove, or reorder fields and old readers still work. Avro's
purely positional layout has none of that safety: rename or reorder a field and
old data silently misreads. Avro trades robustness for a few bytes.

# The part the folklore gets wrong

"No keys" is *one* reason binary formats decode faster. There are **two**, and
they're independent:

1. **Text vs binary parsing.** JSON is text. Decoding `23.5` means scanning
   characters, handling escapes, and converting ASCII digits to a float with
   something like `strconv`. Binary formats read the raw bytes directly: no
   parsing.
2. **How the decoder fills the result.** Generic JSON decoding builds maps and
   leans on reflection, spraying small heap allocations (look at that
   `allocs/op` column: JSON 8, Protobuf 4, Avro ~0). A schema/keyless decoder
   writes values *positionally, straight into fixed struct fields*: no key-string
   matching, near-zero allocation.

Dropping the keys enables reason #2. But reason #1, simply not being text, is a
big chunk of the win on its own, and it has nothing to do with keys.

How do I know it's roughly half-and-half? In an earlier version of this harness I
included **MessagePack and CBOR**, formats that are *binary but still carry field
names*. They landed squarely in the middle: ~3.8x faster than JSON (the "binary"
win) but ~5x slower than Protobuf (the "no keys + positional" win). Binary and
keyless are two separate multipliers, and they stack. With just JSON/Protobuf/Avro
you can only see the *combined* ~20x, not the split; both binary formats flip
both variables at once.

So the honest headline isn't "Protobuf is fast because no keys." It's:

> **Protobuf/Avro decode fast because they're binary *and* keyless: about half
> from skipping text parsing, half from filling structs positionally instead of
> matching key strings.**

# Does any of this survive a real pipeline?

A microbenchmark runs in a tight loop with everything in cache. A real consumer
fetches from Kafka, iterates records, and does framing work on every message,
fixed overhead that doesn't care about your codec. So I ran it end-to-end.

**Holding lag constant.** Lag (unconsumed backlog) is a confound; if it varied per
run, a faster-*looking* format might just have had less to do. So I fixed it: a
producer fills a fresh topic with *exactly* 2,000,000 messages and exits. Every
scenario starts from the same backlog. Then a consumer, **capped at 1 CPU /
512MB**, drains from offset 0 and reports throughput. Same backlog, same cap,
same data; only the wire format changes.

```sh
$ N=2000000 ./run-pipeline.sh json protobuf avro
RESULT format=json     n=2000000 elapsed=6.222s rps=321424  ns/msg=3111
RESULT format=protobuf n=2000000 elapsed=0.891s rps=2244503 ns/msg=446
RESULT format=avro     n=2000000 elapsed=0.880s rps=2272889 ns/msg=440
```

| Format   |   RPS | ns/msg | vs JSON |
| -------- | ----: | -----: | ------: |
| avro     | 2.27M |    440 |   7.1x  |
| protobuf | 2.24M |    446 |   7.0x  |
| json     |  321k |   3111 |     1x  |

The ~20x became **~7x**.

That compression *is* the result, not noise. Per-record Kafka overhead (fetch,
iteration, framing) is ~300 ns that every format pays:

- Protobuf: 446 ns/msg ≈ 124 ns decode **+ ~320 ns fixed overhead**. Decode is the
  minority, so the overhead dilutes its advantage.
- JSON: 3111 ns/msg ≈ 2416 ns decode + the same ~320 ns. Decode still dominates,
  so the overhead barely moves it.

**The lesson:** quote the *end-to-end* number when you talk about pipeline impact,
not the microbench. Serialization was worth ~7x of consumer throughput here, not
20x. And it scales with how decode-bound the consumer is; bolt a heavy sink
(ClickHouse, say) onto the end and the same fixed-cost logic compresses the gap
further, because the sink adds the same work to every format. Conversely, the gap
*widens* back toward 20x when the codec is the dominant cost: a pure decode loop,
a bandwidth-bound link where JSON's 3x size bites, or sustained throughput where
JSON's allocation pressure turns into GC stalls.

# Being honest about the numbers

A couple of caveats I'd rather state than have a sharp reader catch:

- **Avro's `0 allocs/op` is string aliasing, not magic.** The library points string
  fields *into the read buffer* instead of copying. Fast, but a hazard if that
  buffer gets reused (as Kafka client buffers do). My Protobuf decoder copies
  strings (the 4 allocs), which is safe. Not quite apples-to-apples; pick a policy
  and say which.
- **My Protobuf *encode* allocates more than it should** because I append to a
  growing slice instead of pre-sizing it. That's my code, not the format;
  generated Protobuf sizes the buffer once.
- **Library quality ≠ format.** A slow JSON or Avro library would shift these
  numbers. And in production, Avro/Protobuf assume the schema is already in hand;
  a schema registry adds its own lookup cost this harness ignores.

# Takeaways

- Binary, schema-based serialization is **~3x smaller** and decodes **~20x faster**
  than JSON in isolation, but **~7x** is the number that matters for a pipeline.
- The speedup is **binary parsing + positional struct-fill**, not just "no keys."
  Keys are about half of it.
- **Avro** is the leanest on the wire; **Protobuf** spends a tag byte per field to
  buy schema evolution. That byte is usually worth it.
- Always measure end-to-end. Microbenchmark ratios are an upper bound a real
  system rarely reaches.

The full harness (codecs, microbenchmarks, and the constant-lag Kafka pipeline)
is on GitHub at [`sudopower/playground/serde-pipeline-bench`](https://github.com/sudopower/playground/tree/master/serde-pipeline-bench).
Clone it and run `go test ./bench -bench .` to reproduce.

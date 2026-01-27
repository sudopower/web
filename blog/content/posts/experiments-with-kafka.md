+++
date = '2025-10-26T11:32:31+01:00'
draft = false
title = 'Experiments With Kafka'
description = 'Experiments with Kafka and Go '
excerpt = 'Experiments with Kafka and Go to check performance and required configurations'
tags = []
image = 'images/kafka-logo.png'
+++

# Why ?
To find the best configuration for Kafka and Go consumers/ optimize the application.

# Setup
1. Create a simple Go consumer and log metrics.
2. Setup observability for the application (later)
3. Iterate and test different configurations.

# Iteration 1
- Config
    - Local kafka broker on host machine, single partition topic
    - Static test (Topic has 1Million messages)
    - Single consumer starts reading from the beginning of the topic

```sh
 % go run main.go --topic=test-topic --consumers=1 --auto-offset-reset=earliest --group=t1        
2025/10/26 15:22:38 Consumer 0 started, consuming from topic: test-topic
2025/10/26 15:22:39 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 15:22:40 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 15:22:41 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 15:22:42 Messages/sec: 208461, Total: 208384, Avg: 52087 msg/sec, Errors: 0
2025/10/26 15:22:43 Messages/sec: 189116, Total: 397824, Avg: 79527 msg/sec, Errors: 0
2025/10/26 15:22:44 Messages/sec: 132855, Total: 530432, Avg: 88397 msg/sec, Errors: 0
2025/10/26 15:22:45 Messages/sec: 132618, Total: 663040, Avg: 94714 msg/sec, Errors: 0
2025/10/26 15:22:46 Messages/sec: 132625, Total: 795648, Avg: 99452 msg/sec, Errors: 0
2025/10/26 15:22:47 Messages/sec: 132583, Total: 928256, Avg: 103134 msg/sec, Errors: 0
2025/10/26 15:22:48 Messages/sec: 71769, Total: 1000000, Avg: 99998 msg/sec, Errors: 0
2025/10/26 15:22:49 Messages/sec: 0, Total: 1000000, Avg: 90908 msg/sec, Errors: 0
2025/10/26 15:22:50 Messages/sec: 0, Total: 1000000, Avg: 83326 msg/sec, Errors: 0
2025/10/26 15:22:51 Messages/sec: 0, Total: 1000000, Avg: 76917 msg/sec, Errors: 0
2025/10/26 15:22:52 Messages/sec: 0, Total: 1000000, Avg: 71423 msg/sec, Errors: 0
2025/10/26 15:22:53 Messages/sec: 0, Total: 1000000, Avg: 66664 msg/sec, Errors: 0
^C2025/10/26 15:22:53 Received signal interrupt, shutting down gracefully...
2025/10/26 15:22:53 Consumer 0 received shutdown signal
2025/10/26 15:22:53 Consumer 0 cleaning up...
2025/10/26 15:22:53 Consumer 0 cleanup completed
2025/10/26 15:22:53 Final Statistics:
2025/10/26 15:22:53   Total messages consumed: 1000000
2025/10/26 15:22:53   Total errors: 0
2025/10/26 15:22:53   Consumer group: t1
```

```sh
% kafka-consumer-groups --bootstrap-server $BS --describe --group t1-0                  
Consumer group 't1-0' has no active members.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
t1-0            test-topic      0          1000000         1000000         0               -               -               -
```

> # Result: Avg 125k messages / second 

# Iteration 2
- Changes 
    - Add 8 partitions, 8 consumers
    - 10 Million messages static test

```sh
% kafka-topics --bootstrap-server $BS --delete --topic  test-topic 
% kafka-topics --bootstrap-server $BS --create --topic test-topic --partitions 8
Created topic test-topic.
```

### Produce 10M messages
```sh
% make produce COUNT=10000000                                                            
chmod +x scripts/fast-producer.sh
./scripts/fast-producer.sh 100 10000000 4
Fast Kafka Producer
==================
  Topic: test-topic
  Message size: 100 bytes
  Message count: 10000000
  Threads: 4
  Broker: localhost:9092

Starting fast message production...
9984679 records sent, 1996935.8 records/sec (190.44 MB/sec), 0.4 ms avg latency, 137.0 ms max latency.
10000000 records sent, 1995211.5 records/sec (190.28 MB/sec), 0.36 ms avg latency, 137.00 ms max latency, 0 ms 50th, 1 ms 95th, 7 ms 99th, 11 ms 99.9th.

Fast production completed!
  Total messages: 10000000
  Time taken: 6s
  Production rate: 1666666 msg/sec
```

### Run 8 consumers
```sh
% go run main.go --topic=test-topic --consumers=8 --auto-offset-reset=earliest --group=t4
2025/10/26 16:16:05 Consumer 3 started, consuming from topic: test-topic
2025/10/26 16:16:05 Consumer 7 started, consuming from topic: test-topic
2025/10/26 16:16:05 Consumer 2 started, consuming from topic: test-topic
2025/10/26 16:16:05 Consumer 4 started, consuming from topic: test-topic
2025/10/26 16:16:05 Consumer 6 started, consuming from topic: test-topic
2025/10/26 16:16:05 Consumer 0 started, consuming from topic: test-topic
2025/10/26 16:16:05 Consumer 5 started, consuming from topic: test-topic
2025/10/26 16:16:05 Consumer 1 started, consuming from topic: test-topic
2025/10/26 16:16:06 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:16:07 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:16:08 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:16:09 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:16:10 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:16:11 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:16:12 Messages/sec: 1106975, Total: 1106937, Avg: 158110 msg/sec, Errors: 0
2025/10/26 16:16:13 Messages/sec: 1077641, Total: 2184596, Avg: 273038 msg/sec, Errors: 0
2025/10/26 16:16:14 Messages/sec: 984189, Total: 3168807, Avg: 352047 msg/sec, Errors: 0
2025/10/26 16:16:15 Messages/sec: 975073, Total: 4143841, Avg: 414341 msg/sec, Errors: 0
2025/10/26 16:16:16 Messages/sec: 945768, Total: 5089588, Avg: 462647 msg/sec, Errors: 0
2025/10/26 16:16:17 Messages/sec: 936322, Total: 6025923, Avg: 502117 msg/sec, Errors: 0
2025/10/26 16:16:18 Messages/sec: 964732, Total: 6990162, Avg: 537683 msg/sec, Errors: 0
2025/10/26 16:16:19 Messages/sec: 964213, Total: 7954853, Avg: 568163 msg/sec, Errors: 0
2025/10/26 16:16:20 Messages/sec: 1006074, Total: 8960930, Avg: 597355 msg/sec, Errors: 0
2025/10/26 16:16:21 Messages/sec: 832630, Total: 9792718, Avg: 612045 msg/sec, Errors: 0
2025/10/26 16:16:22 Messages/sec: 207274, Total: 10000000, Avg: 588234 msg/sec, Errors: 0
```

```sh
 % kafka-consumer-groups --bootstrap-server $BS --describe --group t4            

Consumer group 't4' has no active members.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
t4              test-topic      4          1242759         1242759         0               -               -               -
t4              test-topic      5          1221469         1221469         0               -               -               -
t4              test-topic      2          1254067         1254067         0               -               -               -
t4              test-topic      3          1257844         1257844         0               -               -               -
t4              test-topic      0          1253637         1253637         0               -               -               -
t4              test-topic      1          1249810         1249810         0               -               -               -
t4              test-topic      6          1260448         1260448         0               -               -               -
t4              test-topic      7          1259966         1259966         0               -               -               -
```

> # Result: Avg 909k messages / second 


Next steps:
1. Try different message sizes (obv. perf will vary)
2. Try adding brokers and see if we can achieve higher throughput per consumer.
2. Run dynamic test with producer and consumer running together (kafka performance test)
3. Containerize the application and run in isolated CPU, Mem environment and check usage.

To be continued...

[Known limits from other tests](https://developer.confluent.io/learn/kafka-performance/)
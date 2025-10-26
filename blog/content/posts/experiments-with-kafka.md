+++
date = '2025-10-26T11:32:31+01:00'
draft = false
title = 'Experiments With Kafka'
description = 'Experiments with Kafka and Go to find the principle limits of processing and configurations required to achieve them.'
excerpt = 'Experiments with Kafka and Go to find the principle limits of processing and configurations required to achieve them.'
tags = []
image = 'images/kafka-logo.png'
+++

# Why ?
When working on glassflow I wanted to find the principle limits of processing that we can achieve.

# Situation
To find this limit I need a kafka consumer that can read and report metrics.
I need to monitor resource usage to find bottlnecks and optimize the application, use different configurations, client parameters and kafka broker parameters to achieve the maximum throughput.

# Solution
1. Create a simple Go consumer and report metrics that I can observe.
2. Setup observability for the application (when required)
3. Iterate and test different configurations.

# Iteration 1

- Config
    - Local kafka broker on host machine, single partition topic    
    - Static test (Topic has 1Million messages)
    - Single consumer starts reading from the beginning of the topic

### Producing messages to kafka and building up lag

```sh
 kafka-consumer % make produce COUNT=1000000
chmod +x scripts/fast-producer.sh
./scripts/fast-producer.sh 100 1000000 4
Fast Kafka Producer
==================
  Topic: test-topic
  Message size: 100 bytes
  Message count: 1000000
  Threads: 4
  Broker: localhost:9092

Starting fast message production...
1000000 records sent, 849617.7 records/sec (81.03 MB/sec), 189.72 ms avg latency, 272.00 ms max latency, 200 ms 50th, 241 ms 95th, 245 ms 99th, 246 ms 99.9th.

Fast production completed!
  Total messages: 1000000
  Time taken: 3s
  Production rate: 333333 msg/sec
```

### Running consumer

```sh
$ go run main.go --topic=test-topic --consumers=1 --auto-offset-reset=earliest
2025/10/26 14:49:50 Messages/sec: 55, Total: 144, Avg: 23 msg/sec, Errors: 0
2025/10/26 14:49:51 Messages/sec: 51, Total: 195, Avg: 27 msg/sec, Errors: 0
2025/10/26 14:49:52 Messages/sec: 50, Total: 245, Avg: 30 msg/sec, Errors: 0
2025/10/26 14:49:53 Messages/sec: 49, Total: 295, Avg: 32 msg/sec, Errors: 0
2025/10/26 14:49:54 Messages/sec: 52, Total: 347, Avg: 34 msg/sec, Errors: 0
2025/10/26 14:49:55 Messages/sec: 53, Total: 400, Avg: 36 msg/sec, Errors: 0
2025/10/26 14:49:56 Messages/sec: 49, Total: 450, Avg: 37 msg/sec, Errors: 0
2025/10/26 14:49:57 Messages/sec: 45, Total: 495, Avg: 38 msg/sec, Errors: 0
2025/10/26 14:49:58 Messages/sec: 49, Total: 544, Avg: 38 msg/sec, Errors: 0
2025/10/26 14:49:59 Messages/sec: 47, Total: 592, Avg: 39 msg/sec, Errors: 0
2025/10/26 14:50:00 Messages/sec: 45, Total: 638, Avg: 39 msg/sec, Errors: 0
2025/10/26 14:50:01 Messages/sec: 50, Total: 688, Avg: 40 msg/sec, Errors: 0
```

```sh
% kafka-consumer-groups --bootstrap-server $BS --describe --group perf-test-consumer-0

GROUP                TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID                                  HOST             CLIENT-ID
perf-test-consumer-0 test-topic      0          3844            1000000         996156          rdkafka-c5974b0d-788e-4274-b709-55ceb382db44 /0:0:0:0:0:0:0:1 rdkafka
```

> # Result: 50 messages / second 💩

# Iteration 2
Changes 
 - Removed LLM crap from the code. Used default confluent-kafka-go client settings.

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

> # Result: Avg 125k messages / second 🚀

# Iteration 3
- Changes 
    - Add 2 partitions and run 2 consumers

```sh
% kafka-topics --bootstrap-server $BS --delete --topic  test-topic 
% kafka-topics --bootstrap-server $BS --create --topic test-topic --partitions 2
Created topic test-topic.
% kafka-topics --bootstrap-server $BS --describe --topic test-topic
Topic: test-topic	TopicId: 3TnhoizdRO-a8jJpRaWTFg	PartitionCount: 2	ReplicationFactor: 1	Configs: segment.bytes=1073741824
	Topic: test-topic	Partition: 0	Leader: 1	Replicas: 1	Isr: 1	Elr: 	LastKnownElr: 
	Topic: test-topic	Partition: 1	Leader: 1	Replicas: 1	Isr: 1	Elr: 	LastKnownElr: 
```

```sh
 % go run main.go --topic=test-topic --consumers=2 --auto-offset-reset=earliest --group=t3
2025/10/26 16:01:46 Consumer 0 started, consuming from topic: test-topic
2025/10/26 16:01:46 Consumer 1 started, consuming from topic: test-topic
2025/10/26 16:01:47 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:01:48 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:01:49 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:01:50 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:01:51 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:01:52 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:01:53 Messages/sec: 246186, Total: 246272, Avg: 35176 msg/sec, Errors: 0
2025/10/26 16:01:54 Messages/sec: 246438, Total: 492544, Avg: 61565 msg/sec, Errors: 0
2025/10/26 16:01:55 Messages/sec: 246108, Total: 738816, Avg: 82081 msg/sec, Errors: 0
2025/10/26 16:01:56 Messages/sec: 246274, Total: 985088, Avg: 98498 msg/sec, Errors: 0
2025/10/26 16:01:57 Messages/sec: 14924, Total: 1000000, Avg: 90907 msg/sec, Errors: 0
```

```sh
% kafka-consumer-groups --bootstrap-server $BS --describe --group t3                        

Consumer group 't3' has no active members.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
t3              test-topic      0          500056          500056          0               -               -               -
t3              test-topic      1          499944          499944          0               -               -               -
```

> # Result: Avg 240k messages / second 🚀

# Iteration 4
- Changes 
    - Add 4 partitions and run 4 consumers

```sh
% kafka-topics --bootstrap-server $BS --delete --topic  test-topic 
% kafka-topics --bootstrap-server $BS --create --topic test-topic --partitions 4
Created topic test-topic.
%  % kafka-topics --bootstrap-server $BS --describe --topic test-topic
Topic: test-topic	TopicId: otlk-IfFQu6VsvIa-XFIrQ	PartitionCount: 4	ReplicationFactor: 1	Configs: segment.bytes=1073741824
	Topic: test-topic	Partition: 0	Leader: 1	Replicas: 1	Isr: 1	Elr: 	LastKnownElr: 
	Topic: test-topic	Partition: 1	Leader: 1	Replicas: 1	Isr: 1	Elr: 	LastKnownElr: 
	Topic: test-topic	Partition: 2	Leader: 1	Replicas: 1	Isr: 1	Elr: 	LastKnownElr: 
	Topic: test-topic	Partition: 3	Leader: 1	Replicas: 1	Isr: 1	Elr: 	LastKnownElr: 
```

Since we've hit close to 250k/sec we need more than 1 million messages when running 4 consumers.

### Produce 3M messages
```sh
% make produce COUNT=3000000                                                             
chmod +x scripts/fast-producer.sh
./scripts/fast-producer.sh 100 3000000 4
Fast Kafka Producer
==================
  Topic: test-topic
  Message size: 100 bytes
  Message count: 3000000
  Threads: 4
  Broker: localhost:9092

Starting fast message production...
3000000 records sent, 1567398.1 records/sec (149.48 MB/sec), 0.39 ms avg latency, 146.00 ms max latency, 0 ms 50th, 1 ms 95th, 4 ms 99th, 13 ms 99.9th.

Fast production completed!
  Total messages: 3000000
  Time taken: 3s
  Production rate: 1000000 msg/sec
```

### Run 4 consumers
```sh
 % go run main.go --topic=test-topic --consumers=4 --auto-offset-reset=earliest --group=t4
2025/10/26 16:10:20 Consumer 3 started, consuming from topic: test-topic
2025/10/26 16:10:20 Consumer 2 started, consuming from topic: test-topic
2025/10/26 16:10:20 Consumer 0 started, consuming from topic: test-topic
2025/10/26 16:10:20 Consumer 1 started, consuming from topic: test-topic
2025/10/26 16:10:21 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:10:22 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:10:23 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:10:24 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:10:25 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:10:26 Messages/sec: 0, Total: 0, Avg: 0 msg/sec, Errors: 0
2025/10/26 16:10:27 Messages/sec: 548951, Total: 548956, Avg: 78415 msg/sec, Errors: 0
2025/10/26 16:10:28 Messages/sec: 519499, Total: 1068665, Avg: 133565 msg/sec, Errors: 0
2025/10/26 16:10:29 Messages/sec: 511076, Total: 1579501, Avg: 175489 msg/sec, Errors: 0
2025/10/26 16:10:30 Messages/sec: 491610, Total: 2071081, Avg: 207097 msg/sec, Errors: 0
2025/10/26 16:10:31 Messages/sec: 491703, Total: 2562835, Avg: 232972 msg/sec, Errors: 0
2025/10/26 16:10:32 Messages/sec: 436122, Total: 2998786, Avg: 249894 msg/sec, Errors: 0
2025/10/26 16:10:33 Messages/sec: 1213, Total: 3000000, Avg: 230758 msg/sec, Errors: 0
```

```sh
% kafka-consumer-groups --bootstrap-server $BS --describe --group t4            

Consumer group 't4' has no active members.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
t4              test-topic      2          757779          757779          0               -               -               -
t4              test-topic      3          742309          742309          0               -               -               -
t4              test-topic      0          748918          748918          0               -               -               -
t4              test-topic      1          750994          750994          0               -               -               -
```

> # Result: Avg 430k messages / second 🚀

# Iteration 5
- Changes 
    - Add 8 partitions and run 8 consumers
    - Produce 4M messages

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

> # Result: Avg 909k messages / second 🚀


Next steps:
1. Try adding brokers and see if we can achieve higher throughput per consumer.
2. Run dynamic test with producer and consumer running together (kafka performance test)
3. Containerize the application and run in isolated CPU, Mem environment and check usage.

To be continued...
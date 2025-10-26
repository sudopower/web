+++
date = '2025-10-26T10:23:07+01:00'
draft = true
title = 'Visualizing K8 Metrics'
description = 'Visualizing K8 metrics with Grafana and Prometheus.'
excerpt = 'Visualizing CPU, memory, network, disk usage, resource requests, limits, restarts, failures, and other metrics.'
tags = []
image = ''
+++

# Why ?
1. Observability - We need to know what's happening in our cluster.
2. Alerting - We need to be able to alert on metrics.
3. Performance - We need to be able to optimize our cluster, identify bottlenecks, and improve efficiency.
4. Capacity Planning - We need to be able to identify and allocate resources appropriately.
There are many more reasons like security, disaster recovery, compliance, etc.

# Situation 
While working on glassflow I wanted to find the principle limits of processing that we can achieve.
I want to be able to see for a given resouce what's the maximum throughput that we can achieve.

1. How fast can we read from kafka ?
2. How fast can we write to clickhouse ?

There are official numbers published by both but we need to be able achieve these limits in practice.
These are the bounds that glassflow can achieve theoretically, so knowing these limits is important.
There are additional parameters on both kafka and clickhouse configuration that need to be tuned to achieve these limits.

Then there is the resource usage of glassflow components themselves, which should be quantifiable.

> Pre-requisite: We need to be able to see the metrics of the cluster to calculate this.

# Solution 
1. Create a simple application that can read from kafka and determine the max throughput and required tuning parameters on kafka broker and client side.
2. Setup observability for the application and the cluster.

# Implementation
I started with writing a simple application that can read from kafka and log a metric for each message read.
I can scale this horizontally and see how addition partitions affects the throughput.
Once I see the throughput is stable, I can start tuning the kafka broker and client side parameters to achieve the maximum throughput.
To make sure the application is performing at max capacity, I will use k8 metrics to monitor the application and the cluster.

[Skip to k8 metrics](#k8-metrics)

## Application

## K8 metrics
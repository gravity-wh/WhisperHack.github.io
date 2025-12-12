# Infra Garden Log

这篇日志把 WhisperHack 的加速集群当作「园艺实验」，因为它们每天都在被修剪、浇水、重新组合。

## 设计原则

- **低功耗**：节点平均功耗 80W，确保可以通过便携电源运行。
- **自治**：节点故障后可以自愈，必要时切换到备用的 Jetson Orin。
- **可观察**：所有指标都通过 InfluxDB 汇聚，然后在主页的 Timeline 中摘要展示。

## 关键模块

1. **Root Keeper**：Rust 编写的调度守护程序，接收 LLDB 风格命令并执行拓扑变更。
2. **Soil Metrics**：针对温度与噪音做的双重采样器，结合热像仪校准。
3. **Pollination Bus**：在节点之间传递模型权重的高速链路，基于 QUIC。

## 收获

- 在 28 度的室温下，推理稳定性提升 17%。
- 通过限定 Batch Size + KV Cache 复用，把延迟控制在 35 ms。

## TODO

- 整理一个“移植指南”，帮助朋友们复刻集群。
- 将 Root Keeper 的 CLI + API 一并发布。

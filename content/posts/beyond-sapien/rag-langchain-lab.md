# LLM 在垂直领域的落地：RAG 架构实战

这篇文章记录了我如何在芯片设计知识库上部署 RAG：

## 管线拆分

1. **抽取**：使用 `docling` 将 PDF/Word/Markdown 统一抽象成带语义块的 JSON。
2. **向量化**：`text-embedding-3-large` + Faiss，按章节 + 图表标签进行分层索引。
3. **生成**：LangChain Runnable 序列，先检索，再经过 Guardrail（RuleQL），最后交给 GPT-4.1 完成答案。

## 监控指标

- **命中率**：每次对话都会记录召回的 chunk id，统计命中 Top-k 的次数。
- **幻觉率**：人工抽样 + 自动对比原文，生成 hallucination score。
- **延迟**：在 JSON schema 中保留 `latency_ms` 字段，写入本站的 `posts.json` 以追踪多次实验的差异。

## 下一步

- 将 LangSmith trace 同步到 GitHub Actions，生成日常报告。
- 为广播站主页加上“信号频段”可视化（已在当前版本预留 `frequency` 字段）。

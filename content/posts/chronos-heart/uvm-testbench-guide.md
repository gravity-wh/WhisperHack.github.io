# UVM 环境搭建：从 Hello World 到 完整 Testbench

搭建流程可以拆成三层：

1. **Hello World**：只有 Sequencer、Driver、Monitor，确保 TLM 通道和虚接口打通。
2. **可复用 Agent**：加入配置对象 + Analysis Port，让 Scoreboard 能订阅事务流。
3. **系统级 Testbench**：封装为 Environment，引入 Phase Jump 与 objection 机制管理收敛。

## 调试心得

- `uvm_config_db` 用宏包一层封装，可以避免重复敲 key。
- 在 Monitor 层使用 `uvm_analysis_imp` 推送两份事务，分别供 Coverage 与 Scoreboard 使用。
- 使用 `uvm_component_utils_begin` 自定义字段时，记得为 `uvm_field_enum` 指定默认值，否则复制配置对象会翻车。

## 资源

- 示例代码同步在仓库 `gravity-wh/uvm-lab`。
- 本站 `content/posts.json` 中的 `category` 字段与此文章关联，更新 JSON 即可刷新首页。

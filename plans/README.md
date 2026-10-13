# 动效改进计划（improve-animations）

- 写入时 commit：`b63bf908`
- 审查 bar：Emil Kowalski / AUDIT.md（transform+opacity only、UI <300ms、强 ease-out、reduce-motion 随动画交付）

| # | 计划 | 严重度 | 状态 | 依赖 |
| --- | --- | --- | --- | --- |
| 001 | float-panel 基类过渡（搜索/快捷面板瞬移） | HIGH | TODO | 无 |
| 002 | 详情模态背板淡入 + 进出场 | MEDIUM | TODO | 无 |
| 003 | 公告栏关闭折叠淡出 | MEDIUM | TODO | 无 |
| 004 | 六处翻页网格 opacity 桥接 | MEDIUM | TODO | 无 |
| 005 | TabGroup 切标签 opacity 桥接 | LOW | TODO | 无 |

**推荐执行顺序**：001 → 002 → 003 → 004 → 005（按杠杆排序；各计划互不触碰同一文件，无硬依赖）。

**执行方式**：每份计划自包含，执行者逐条照做；遇到与摘录不符（漂移）按计划内 STOP 条款报告，不即兴发挥。完成后把 Status 改为 DONE 并在下方追加执行记录（commit、验证命令结果）。

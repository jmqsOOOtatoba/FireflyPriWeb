# 动效改进计划（improve-animations）

- 写入时 commit：`b63bf908`
- 审查 bar：Emil Kowalski / AUDIT.md（transform+opacity only、UI <300ms、强 ease-out、reduce-motion 随动画交付）

| # | 计划 | 严重度 | 状态 | 落地 commit | 依赖 |
| --- | --- | --- | --- | --- | --- |
| 001 | float-panel 基类过渡（搜索/快捷面板瞬移） | HIGH | DONE | `b63bf908` | 无 |
| 002 | 详情模态背板淡入 + 进出场 | MEDIUM | DONE | `b63bf908` | 无 |
| 003 | 公告栏关闭折叠淡出 | MEDIUM | DONE | `b63bf908` | 无 |
| 004 | 六处翻页网格 opacity 桥接 | MEDIUM | DONE | `b63bf908` | 无 |
| 005 | TabGroup 切标签 opacity 桥接 | LOW | DONE | `b63bf908` | 无 |

**执行顺序**：001 → 002 → 003 → 004 → 005（按杠杆排序；各计划互不触碰同一文件，无硬依赖）。

五份计划统一在 `b63bf908` 一次落地，落地位置（已逐条核对）：

| # | 落地位置 |
| --- | --- |
| 001 | `src/styles/main.css:539-546`（`.float-panel` 过渡补 `opacity`/`translate` + `--ease-decelerate`），`548-556` 为 `prefers-reduced-motion` 回退 |
| 002 | `src/components/pages/anime/AnimeDetailModal.svelte:79-85`、`src/components/pages/bilibili/BilibiliDetailModal.svelte:79-84`（svelte `fade`/`fly` + `prefersReducedMotion()`） |
| 003 | `src/components/widget/Announcement.astro:56`（折叠改 `max-height`） |
| 004 | `AnimeGrid` / `BilibiliGrid` / `VndbSection` / `MalSection` / `BangumiSection` / `DynamicFeed` 六处 `gridFading` |
| 005 | `src/components/common/TabGroup.svelte`（`tabFading`） |

**归档说明**：五份计划已全部落地并通过代码锚点核对，本目录归档到 `docs/archive/plans/`，仅作历史留档，不再作为待办清单使用。

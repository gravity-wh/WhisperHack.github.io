# WhisperHack.github.io

一个围绕“科技 × 前沿 × 审美”构建的静态博客壳。所有组件使用原生 HTML/CSS/JS，无构建依赖，直接推送到 `WhisperHack.github.io` 仓库即可通过 GitHub Pages 发布。

## 结构总览

```text
├─ index.html               # 博客主页，数据驱动的卡片式布局
├─ posts/post.html          # 单篇文章模板（slug 参数加载 Markdown）
├─ assets/
│  ├─ css/main.css          # 玻璃质感 + 霓虹网格主题
│  └─ js/
│     ├─ main.js            # 主页渲染逻辑（posts.json → UI）
│     └─ post.js            # Markdown 渲染逻辑（依赖 marked）
└─ content/
   ├─ posts.json            # 所有文章的元数据（唯一需要维护的结构化文件）
   └─ posts/*.md            # 对应 slug 的 Markdown 正文
```

## 写作流程

1. 在 `content/posts/` 中复制一份 Markdown，命名为 `your-slug.md`。
2. 在 `content/posts.json` 里新增一条记录：
   - `slug`：和 Markdown 文件名一致。
   - `title/date/summary/tags/readingTime`：用于主页展示。
   - `status`：`shipped`、`building` 等，将驱动主页上的计数与路线图。
   - 可选 `roadmap`：`phase/eta/focus/order`，用于“路线图”时间线。
3. 提交并推送后，主页、列表、路线图、指标会自动更新，无需改动 HTML。

> 主页上的 hero metrics、精选卡片、最新信号、Timeline 等全部来自 `posts.json`，因此后续维护只涉及内容文件。

## 部署到 GitHub Pages

1. 在 GitHub 上创建仓库 `WhisperHack/WhisperHack.github.io`（必须与用户名一致）。
2. 将本目录的所有文件复制到仓库根目录。
3. 运行：

   ```powershell
   git init
   git add .
   git commit -m "feat: bootstrap WhisperHack blog"
   git remote add origin git@github.com:WhisperHack/WhisperHack.github.io.git
   git push -u origin main
   ```

4. 打开仓库的 **Settings → Pages**，确认 Source 已指向 `main / (root)`。几分钟后即可通过 `https://WhisperHack.github.io` 访问。

## 自定义方向

- **配色 / 字体**：在 `assets/css/main.css` 中的 `:root` 即可全局调整。
- **导航 / 模块**：`index.html` 采用语义化结构，增删 Section 即可；如需滚动定位，更新 nav 锚点。
- **文章渲染**：`posts/post.html` 使用 `marked` CDN，可替换为其他 Markdown 渲染器或部署自托管版本。
- **RSS / API**：`content/posts.json` 的 schema 已稳定，后续可用同一份数据生成 RSS、feed 或 API。

## 建议的后续 Roadmap

1. 为 `content/posts.json` 增加 `series` 字段，实现专题聚合。
2. 加入 `feed.xml` 生成脚本（如需，可通过 GitHub Action 将 `posts.json` 转换成 RSS）。
3. 若文章量增加，可引入简易搜索（Lunr.js / Fuse.js）。

欢迎继续在此框架上快速写作，只需编辑 Markdown 与 JSON，即可维持一致的视觉与信息架构。

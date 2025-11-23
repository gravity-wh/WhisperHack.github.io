# WhisperHack.github.io

Sunset Radio（落日电台）的前端已经完全重构为“频率广播”视觉：主页使用语义化 HTML + 原生 CSS/JS，依旧保持零构建依赖，只需推送到 `gravity-wh/WhisperHack.github.io` 即可上线。

## 结构总览

```text
├─ index.html               # 博客主页，数据驱动的卡片式布局
├─ posts/post.html          # 单篇文章模板（slug 参数加载 Markdown）
├─ assets/
│  ├─ css/main.css          # Sunset Radio 视觉、导航、文章、播放器样式
│  └─ js/
│     ├─ main.js            # 主页渲染逻辑（分类 / 搜索 / 播放器）
│     └─ post.js            # Markdown 渲染逻辑（依赖 marked）
└─ content/
   ├─ posts.json            # 信号目录（slug、分类、频段、摘要、状态）
   ├─ audio.json            # 背景音乐播放列表
   └─ posts/*.md            # 对应 slug 的 Markdown 正文
```

## 写作流程

1. 在 `content/posts/` 中复制一份 Markdown，命名为 `your-slug.md`。
2. 在 `content/posts.json` 里新增或更新一条记录，字段说明：
   - `slug`：和 Markdown 文件名一致。
   - `title/date/summary/readingTime`：卡片内容。
   - `category`：从 `ic-design/dig-verification/ai/reading/travel/guitar` 中选择，用于分类筛选。
   - `frequency`：任意字符串（如 `98.5 FM`），会显示在卡片右上角。
   - `status/phase`：用于文章页的“阶段”徽章，可随时扩展。
   - `tags`：数组，可供搜索或文章页标签显示。
3. Markdown 写完后推送即可，主页的分类、搜索、统计会自动刷新，无需修改 HTML。

> 主页的所有模块（导航搜索、分类胶囊、卡片内容、浮动播放器文案）都由 `posts.json` 与 `audio.json` 驱动，只需编辑数据即可发布。

## 部署到 GitHub Pages

1. 在 GitHub 上创建仓库 `gravity-wh/WhisperHack.github.io`（与用户名一致）。
2. 将本目录的所有文件复制到仓库根目录。
3. 运行：

   ```powershell
   git init
   git add .
   git commit -m "feat: sunset radio"
   git remote add origin git@github.com:gravity-wh/WhisperHack.github.io.git
   git push -u origin main
   ```

4. 打开仓库的 **Settings → Pages**，确认 Source 已指向 `main / (root)`。几分钟后即可通过 `https://WhisperHack.github.io` 访问。

## 自定义方向

- **配色 / 字体**：在 `assets/css/main.css` 的 `:root` 里调整主色与字体。
- **布局模块**：`index.html` 采用语义化结构（Nav/Hero/Categories/Cards/Footer），可直接增删 section。
- **文章渲染**：`posts/post.html` + `assets/js/post.js` 继续使用 `marked`，Markdown 中可添加代码块、Mermaid 等内容。
- **数据扩展**：`content/posts.json` 与 `content/audio.json` 可扩展自定义字段（例如 hero 副本、标签颜色），只需在 `main.js` 中读取即可。

## 背景音乐 / 播放器

浮动播放器会在加载时请求 `content/audio.json`，字段包括：

- `title` / `subtitle` / `artist`：显示在播放器卡片上。
- `url`：音频文件地址（可使用公网的无版权 Lo-Fi 音频）。
- `cover`：正方形封面图 URL，将自动套用到圆形唱片。
- `mood`：显示在播放器右侧的标签文字。

新增或替换音频时只需更新 JSON，不需要改动 JS。播放器支持播放 / 暂停、下一首、进度拖拽，并在曲目结束后自动切歌。

## 建议的后续 Roadmap

1. 结合 `posts.json` 的 `category` 字段生成 RSS 或 JSON Feed。
2. 通过 GitHub Actions 定期构建 `feed.xml` / `sitemap.xml`。
3. 若文章量持续增加，可在 `main.js` 中引入 μ 搜索库（Fuse.js/Lunr.js）以替代当前的前端过滤。

欢迎继续在此框架上快速写作：更新 Markdown 与 JSON，即可完成一次“信号播报”。

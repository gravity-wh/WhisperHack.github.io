const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

const titleEl = document.getElementById("post-title");
const dateEl = document.getElementById("post-date");
const tagsEl = document.getElementById("post-tags");
const readingEl = document.getElementById("post-reading");
const phaseEl = document.getElementById("post-phase");
const contentEl = document.getElementById("post-content");

init();

async function init() {
	if (!slug) {
		renderFallback("缺少 slug 参数。请从主页进入文章。");
		return;
	}

	try {
		const meta = await fetch(`../content/posts.json?v=${Date.now()}`).then((res) => res.json());
		const postMeta = meta.find((item) => item.slug === slug);

		if (!postMeta) {
			renderFallback("没有找到对应的文章元数据。");
			return;
		}

		hydrateMeta(postMeta);
		await renderMarkdown(slug);
	} catch (error) {
		console.error(error);
		renderFallback("加载文章内容失败，请稍后再试。");
	}
}

function hydrateMeta(postMeta) {
	document.title = `${postMeta.title} · WhisperHack`;
	titleEl.textContent = postMeta.title;
	dateEl.textContent = formatDate(postMeta.date);
	tagsEl.textContent = (postMeta.tags || []).join(" · ") || "Untitled";
	readingEl.textContent = postMeta.readingTime || "--";
	phaseEl.textContent = postMeta.phase || postMeta.status || "draft";
}

async function renderMarkdown(slugValue) {
	const response = await fetch(`../content/posts/${slugValue}.md?v=${Date.now()}`);
	if (!response.ok) {
		throw new Error("无法加载 Markdown 正文");
	}
	const markdown = await response.text();
	const html = window.marked.parse(markdown);
	contentEl.innerHTML = html;
}

function renderFallback(message) {
	contentEl.innerHTML = `<p>${message}</p>`;
}

function formatDate(value) {
	if (!value) return "--";
	return new Date(value).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

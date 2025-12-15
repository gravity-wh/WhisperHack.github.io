const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

const titleEl = document.getElementById("post-title");
const dateEl = document.getElementById("post-date");
const tagsEl = document.getElementById("post-tags");
const readingEl = document.getElementById("post-reading");
const phaseEl = document.getElementById("post-phase");
const contentEl = document.getElementById("post-content");
const MATH_RENDER_OPTIONS = {
	delimiters: [
		{ left: "$$", right: "$$", display: true },
		{ left: "\\[", right: "\\]", display: true },
		{ left: "\\(", right: "\\)", display: false },
		{ left: "$", right: "$", display: false }
	],
	throwOnError: false,
	strict: "ignore"
};

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
		await renderMarkdown(postMeta);
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
	phaseEl.textContent = postMeta.status || "draft";
}

async function renderMarkdown(postMeta) {
	// Support new column-based folder structure: content/posts/{column}/{slug}.md
	// Falls back to flat structure: content/posts/{slug}.md
	const column = postMeta.column;
	const slugValue = postMeta.slug;
	const basePath = column
		? `../content/posts/${column}/${slugValue}.md`
		: `../content/posts/${slugValue}.md`;
	
	let response = await fetch(`${basePath}?v=${Date.now()}`);
	
	// Fallback to flat structure if column path fails
	if (!response.ok && column) {
		response = await fetch(`../content/posts/${slugValue}.md?v=${Date.now()}`);
	}
	
	if (!response.ok) {
		throw new Error("无法加载 Markdown 正文");
	}
	const markdown = await response.text();
	const html = window.marked.parse(markdown);
	contentEl.innerHTML = html;
	queueMathRender();
	// attempt to render ABC notation blocks (abcjs)
	renderAbcBlocks();
}

function renderFallback(message) {
	contentEl.innerHTML = `<p>${message}</p>`;
}

function formatDate(value) {
	if (!value) return "--";
	return new Date(value).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

function queueMathRender(attempt = 0) {
	if (!contentEl) return;
	if (typeof window.renderMathInElement === "function") {
		renderMathInElement(contentEl, MATH_RENDER_OPTIONS);
		return;
	}
	if (attempt > 20) return;
	setTimeout(() => queueMathRender(attempt + 1), 100);
}

function renderAbcBlocks(attempt = 0) {
	if (!contentEl) return;
	const selector = 'pre code.language-abc, pre code.language-abcjs, code.language-abc, code.language-abcjs';
	const nodes = Array.from(contentEl.querySelectorAll(selector));
	if (!nodes.length) return;
	const ready = typeof window.ABCJS !== "undefined" && typeof window.ABCJS.renderAbc === "function";
	if (!ready) {
		if (attempt > 30) return;
		setTimeout(() => renderAbcBlocks(attempt + 1), 200);
		return;
	}
	nodes.forEach((code) => {
		const abcText = code.textContent || code.innerText || "";
		const pre = code.closest("pre");
		const container = document.createElement("div");
		container.className = "abcjs-score";
		if (pre && pre.parentNode) {
			pre.parentNode.replaceChild(container, pre);
		} else if (code.parentNode) {
			code.parentNode.replaceChild(container, code);
		}
		try {
			window.ABCJS.renderAbc(container, abcText, { responsive: "resize" });
		} catch (err) {
			container.textContent = abcText;
		}
	});
}

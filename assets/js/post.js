const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const isDebug = params.get("debug") === "1";

const titleEl = document.getElementById("post-title");
const dateEl = document.getElementById("post-date");
const tagsEl = document.getElementById("post-tags");
const readingEl = document.getElementById("post-reading");
const statusEl = document.getElementById("post-phase"); // Reusing phase element for status
const contentEl = document.getElementById("post-content");

/**
 * Error Codes:
 * E001: Missing slug parameter
 * E002: Failed to fetch posts.json
 * E003: Post metadata not found
 * E004: Failed to fetch Markdown file
 * E005: Markdown content empty
 */

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
	if (isDebug) console.group("Post Initialization Debug");
	
	if (!slug) {
		renderFallback("缺少 slug 参数。请从主页进入文章。", "E001");
		return;
	}

	try {
		const metaUrl = buildAssetUrl("../content/posts.json", { v: Date.now() });
		if (isDebug) console.log("Fetching metadata from:", metaUrl);
		
		const metaRes = await fetch(metaUrl, { cache: "no-store" });
		if (!metaRes.ok) {
			throw new Error(`无法加载 posts.json (HTTP ${metaRes.status})`, { cause: "E002" });
		}
		
		const meta = await metaRes.json();
		const postMeta = meta.find((item) => item.slug === slug);

		if (!postMeta) {
			throw new Error(`未找到 slug 为 "${slug}" 的文章元数据`, { cause: "E003" });
		}

		if (isDebug) console.log("Post metadata found:", postMeta);

		hydrateMeta(postMeta);
		await renderMarkdown(postMeta);
		
	} catch (error) {
		console.error("Post Load Error:", error);
		const errorCode = error.cause || "E999";
		renderFallback(`加载文章内容失败: ${error.message}`, errorCode);
	} finally {
		if (isDebug) console.groupEnd();
	}
}

function buildAssetUrl(pathname, query = {}) {
	const url = new URL(pathname, document.baseURI);
	Object.entries(query).forEach(([key, value]) => {
		if (value === undefined || value === null) return;
		url.searchParams.set(key, String(value));
	});
	return url.toString();
}

function hydrateMeta(postMeta) {
	document.title = `${postMeta.title} · WhisperHack`;
	titleEl.textContent = postMeta.title;
	dateEl.textContent = formatDate(postMeta.date);
	tagsEl.textContent = (postMeta.tags || []).join(" · ") || "Untitled";
	readingEl.textContent = postMeta.readingTime || "--";
	
	if (statusEl) {
		statusEl.textContent = postMeta.status || "draft";
		statusEl.className = `badge status-${postMeta.status || "draft"}`;
	}
}

async function renderMarkdown(postMeta) {
	const column = postMeta.column;
	const slugValue = postMeta.slug;
	
	// Try column-based path first
	const paths = [];
	if (column) {
		paths.push(`../content/posts/${column}/${slugValue}.md`);
	}
	paths.push(`../content/posts/${slugValue}.md`);

	let response = null;
	let lastError = null;
	let successfulPath = null;

	for (const path of paths) {
		const url = buildAssetUrl(path, { v: Date.now() });
		if (isDebug) console.log("Attempting to fetch Markdown from:", url);
		
		try {
			const res = await fetch(url, { cache: "no-store" });
			if (res.ok) {
				response = res;
				successfulPath = path;
				break;
			}
			lastError = `HTTP ${res.status}`;
		} catch (e) {
			lastError = e.message;
		}
	}

	if (!response) {
		throw new Error(`无法加载 Markdown 正文 (尝试了 ${paths.length} 个路径, 最后错误: ${lastError})`, { cause: "E004" });
	}

	if (isDebug) console.log("Successfully loaded Markdown from:", successfulPath);

	const markdown = await response.text();
	if (!markdown || markdown.trim().length === 0) {
		throw new Error("文章内容为空", { cause: "E005" });
	}

	if (typeof window.marked === "undefined") {
		throw new Error("Markdown 解析器 (marked.js) 未加载", { cause: "E006" });
	}

	const html = typeof window.marked.parse === "function" 
		? window.marked.parse(markdown) 
		: window.marked(markdown);
		
	contentEl.innerHTML = html;
	
	queueMathRender();
	renderAbcBlocks();
}

function renderFallback(message, code = "") {
	const codeHtml = code ? `<div class="error-code">Error Code: ${code}</div>` : "";
	contentEl.innerHTML = `
		<div class="error-container">
			<p class="error-message">${message}</p>
			${codeHtml}
			<p class="error-hint">您可以尝试刷新页面，或返回主页重新进入。如果问题持续，请检查网络连接或联系管理员。</p>
			<a href="../" class="error-back-btn">返回主页</a>
		</div>
	`;
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

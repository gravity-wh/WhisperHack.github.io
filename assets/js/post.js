const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const isDebug = params.get("debug") === "1";
const columnFromQuery = params.get("column");

const titleEl = document.getElementById("post-title");
const dateEl = document.getElementById("post-date");
const tagsEl = document.getElementById("post-tags");
const readingEl = document.getElementById("post-reading");
const statusEl = document.getElementById("post-phase"); // Reusing phase element for status
const contentEl = document.getElementById("post-content");

let markedApi = null;

/**
 * Error Codes:
 * E001: Missing slug parameter
 * E004: Failed to fetch Markdown file
 * E005: Markdown content empty
 */

init();

async function init() {
	if (isDebug) console.group("Post Initialization Debug");
	
	if (!slug) {
		renderFallback("缺少 slug 参数。请从主页进入文章。", "E001");
		return;
	}

	try {
		await ensureMarkedReady();

		const postMeta = readMetaFromQuery();
		if (postMeta.title) {
			hydrateMeta(postMeta);
		} else {
			document.title = `${slug} · WhisperHack`;
			titleEl.textContent = slug;
			tagsEl.textContent = "";
			readingEl.textContent = "--";
			dateEl.textContent = "--";
			if (statusEl) {
				statusEl.textContent = "";
			}
		}

		await renderMarkdown({ slug, column: postMeta.column || columnFromQuery });
		
	} catch (error) {
		console.error("Post Load Error:", error);
		const errorCode = error.cause || "E999";
		renderFallback(`加载文章内容失败: ${error.message}`, errorCode);
	} finally {
		if (isDebug) console.groupEnd();
	}
}

function readMetaFromQuery() {
	const title = params.get("title") || "";
	const date = params.get("date") || "";
	const tagsRaw = params.get("tags") || "";
	const readingTime = params.get("readingTime") || "";
	const status = params.get("status") || "";
	const column = params.get("column") || "";
	const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
	return { slug, column, title, date, tags, readingTime, status };
}

async function ensureMarkedReady() {
	if (markedApi) return markedApi;

	if (!window.marked) {
		throw new Error("Markdown 解析器 (marked.js) 未加载", { cause: "E006" });
	}
	markedApi = window.marked;
	configureMarked(markedApi);
	return markedApi;
}

function configureMarked(api) {
	// Some builds expose functions directly; others expose an object
	const hasUse = typeof api?.use === "function";
	const hasSetOptions = typeof api?.setOptions === "function";

	if (hasSetOptions) {
		api.setOptions({
			gfm: true,
			breaks: false,
			mangle: false,
			headerIds: false
		});
	}

	if (hasUse) {
		api.use({ extensions: buildLatexExtensions() });
	}
}

function buildLatexExtensions() {
	// Goal: preserve LaTeX content so Markdown emphasis doesn't break things like $a_b$.
	// Render with KaTeX if available; otherwise keep raw delimiters for auto-render.

	return [
		{
			name: "latexBlockDollar",
			level: "block",
			start(src) {
				return src.match(/(^|\n)\s*\$\$/)?.index;
			},
			tokenizer(src) {
				const match = src.match(/^\s*\$\$([\s\S]+?)\$\$\s*(\n+|$)/);
				if (!match) return;
				return {
					type: "latexBlockDollar",
					raw: match[0],
					text: match[1]
				};
			},
			renderer(token) {
				return renderLatex(token.text, true);
			}
		},
		{
			name: "latexBlockBracket",
			level: "block",
			start(src) {
				return src.indexOf("\\[");
			},
			tokenizer(src) {
				const match = src.match(/^\s*\\\[([\s\S]+?)\\\]\s*(\n+|$)/);
				if (!match) return;
				return {
					type: "latexBlockBracket",
					raw: match[0],
					text: match[1]
				};
			},
			renderer(token) {
				return renderLatex(token.text, true);
			}
		},
		{
			name: "latexInlineParen",
			level: "inline",
			start(src) {
				return src.indexOf("\\(");
			},
			tokenizer(src) {
				if (!src.startsWith("\\(")) return;
				const end = src.indexOf("\\)", 2);
				if (end === -1) return;
				const raw = src.slice(0, end + 2);
				const text = src.slice(2, end);
				return { type: "latexInlineParen", raw, text };
			},
			renderer(token) {
				return renderLatex(token.text, false);
			}
		},
		{
			name: "latexInlineDollar",
			level: "inline",
			start(src) {
				return src.indexOf("$");
			},
			tokenizer(src) {
				if (!src.startsWith("$")) return;
				if (src.startsWith("$$")) return;
				// Scan for the next unescaped '$'
				let i = 1;
				while (i < src.length) {
					const ch = src[i];
					if (ch === "\n") return;
					if (ch === "$") {
						// treat '\\$' as escaped
						let backslashes = 0;
						let k = i - 1;
						while (k >= 0 && src[k] === "\\") {
							backslashes++;
							k--;
						}
						if (backslashes % 2 === 0) {
							const raw = src.slice(0, i + 1);
							const text = src.slice(1, i);
							if (!text.trim()) return;
							return { type: "latexInlineDollar", raw, text };
						}
					}
					i++;
				}
				return;
			},
			renderer(token) {
				return renderLatex(token.text, false);
			}
		}
	];
}

function renderLatex(latex, displayMode) {
	const text = (latex || "").trim();
	if (!text) return "";
	if (window.katex && typeof window.katex.renderToString === "function") {
		try {
			return window.katex.renderToString(text, {
				displayMode,
				throwOnError: false,
				strict: "ignore"
			});
		} catch (e) {
			// Fall through to raw delimiters
		}
	}
	const raw = displayMode ? `$$${text}$$` : `$${text}$`;
	return `<span class="katex-math">${escapeHtml(raw)}</span>`;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
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
	
	// Minimal: use explicit column path when available; fallback to legacy flat path.
	const paths = column
		? [`../content/posts/${column}/${slugValue}.md`, `../content/posts/${slugValue}.md`]
		: [`../content/posts/${slugValue}.md`];

	let response = null;
	let lastError = null;
	let successfulPath = null;

	for (const path of paths) {
		const url = new URL(path, document.baseURI).toString();
		if (isDebug) console.log("Attempting to fetch Markdown from:", url);
		
		try {
			const res = await fetch(url);
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

	const api = await ensureMarkedReady();
	const html = typeof api?.parse === "function" ? api.parse(markdown) : api(markdown);
		
	contentEl.innerHTML = html;
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


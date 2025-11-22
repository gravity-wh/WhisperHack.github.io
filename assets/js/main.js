const postsEndpoint = "content/posts.json";
const featuredGrid = document.getElementById("featured-grid");
const latestList = document.getElementById("latest-list");
const timeline = document.getElementById("timeline");
const pills = document.querySelectorAll(".pill");
const metricPublished = document.getElementById("metric-published");
const metricBuilding = document.getElementById("metric-building");
const metricMonthly = document.getElementById("metric-monthly");
const state = { posts: [], filter: "all" };

document.getElementById("year").textContent = new Date().getFullYear();

init();

async function init() {
  try {
    const response = await fetch(`${postsEndpoint}?v=${Date.now()}`);
    if (!response.ok) throw new Error("无法加载内容数据");
    const data = await response.json();
    state.posts = data;
    renderFeatured();
    renderLatest();
    renderTimeline();
    updateMetrics();
  } catch (error) {
    console.error(error);
    featuredGrid.innerHTML = renderErrorCard();
    latestList.innerHTML = renderErrorCard();
    timeline.innerHTML = renderErrorCard();
  }
}

pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    pills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    state.filter = pill.dataset.filter;
    renderLatest();
  });
});

function renderFeatured() {
  const featured = state.posts.filter((post) => post.featured);
  if (!featured.length) {
    featuredGrid.innerHTML = renderEmptyState("暂无精选内容，勾选 featured 即可展示。");
    return;
  }
  featuredGrid.innerHTML = featured
    .map((post) => {
      const tags = (post.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("");
      return `
        <article class="card">
          <div class="meta">${post.date} · ${post.readingTime || "--"}</div>
          <h3>${post.title}</h3>
          <p>${post.summary || ""}</p>
          <div class="tag-list">${tags}</div>
          <a class="cta secondary" href="posts/post.html?slug=${post.slug}">继续阅读</a>
        </article>
      `;
    })
    .join("");
}

function renderLatest() {
  const filtered = state.posts
    .filter((post) => {
      if (state.filter === "all") return true;
      const tags = (post.tags || []).map((tag) => tag.toLowerCase());
      return tags.includes(state.filter);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!filtered.length) {
    latestList.innerHTML = renderEmptyState("暂无匹配的内容标签。尝试切换 Tag。");
    return;
  }

  latestList.innerHTML = filtered
    .map((post) => {
      const tags = (post.tags || [])
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join("");
      return `
        <article class="latest-item">
          <time datetime="${post.date}">${formatDate(post.date)}</time>
          <div>
            <h4>${post.title}</h4>
            <p>${post.summary || ""}</p>
            <div class="tag-list">${tags}</div>
          </div>
          <div>
            <a class="cta secondary" href="posts/post.html?slug=${post.slug}">阅读</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTimeline() {
  const timelinePosts = state.posts
    .filter((post) => Boolean(post.roadmap))
    .sort((a, b) => (a.roadmap?.order || 0) - (b.roadmap?.order || 0));

  if (!timelinePosts.length) {
    timeline.innerHTML = renderEmptyState("暂无路线图节点，可在 posts.json 内为内容添加 roadmap 字段。");
    return;
  }

  timeline.innerHTML = timelinePosts
    .map((post) => {
      const { roadmap } = post;
      return `
        <article class="timeline-item">
          <h4>${roadmap.phase || "探索"} · ${post.title}</h4>
          <small>${roadmap.eta || "待定"} · ${roadmap.focus || ""}</small>
          <p>${roadmap.note || post.summary || ""}</p>
        </article>
      `;
    })
    .join("");
}

function updateMetrics() {
  const published = state.posts.filter((post) => post.status === "shipped" || post.status === "published");
  const building = state.posts.filter((post) => post.status === "building");
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthly = published.filter((post) => (post.date || "").startsWith(currentMonth));

  if (metricPublished) metricPublished.textContent = published.length.toString();
  if (metricBuilding) metricBuilding.textContent = building.length.toString();
  if (metricMonthly) metricMonthly.textContent = `+${monthly.length}`;
}

function renderEmptyState(text) {
  return `<div class="card">${text}</div>`;
}

function renderErrorCard() {
  return `<div class="card">⚠️ 内容数据暂时不可用，请检查 content/posts.json。</div>`;
}

function formatDate(dateString) {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

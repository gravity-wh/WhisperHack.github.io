const POSTS_ENDPOINT = "content/posts.json";
const AUDIO_ENDPOINT = "content/audio.json";

const CATEGORY_CONFIG = [
  { id: "all", label: "全部信号", icon: "📡" },
  { id: "ic-design", label: "模拟 IC 设计", icon: "⚡" },
  { id: "dig-verification", label: "数字 IC 验证", icon: "🧪" },
  { id: "ai", label: "生成式 AI", icon: "🧠" },
  { id: "reading", label: "书海拾贝", icon: "📖" },
  { id: "travel", label: "飞行日记", icon: "✈️" },
  { id: "guitar", label: "吉他与乐理", icon: "🎸" }
];

const state = {
  posts: [],
  activeCategory: "all",
  searchQuery: ""
};

const dom = {
  categoryBar: document.getElementById("category-bar"),
  postsHeading: document.getElementById("posts-heading"),
  postsCount: document.getElementById("posts-count"),
  postGrid: document.getElementById("post-grid"),
  emptyState: document.getElementById("empty-state"),
  resetButton: document.getElementById("reset-filters"),
  searchInput: document.getElementById("search-input"),
  mobileSearchInput: document.getElementById("mobile-search-input"),
  signalCounter: document.getElementById("signal-counter"),
  navToggle: document.querySelector("[data-mobile-toggle]"),
  navMenu: document.querySelector("[data-mobile-menu]"),
  logoButton: document.querySelector("[data-logo]")
};

const audioElements = {
  audio: document.getElementById("bg-audio"),
  cover: document.getElementById("player-cover"),
  title: document.getElementById("player-title"),
  subtitle: document.getElementById("player-subtitle"),
  toggle: document.getElementById("player-toggle"),
  next: document.getElementById("player-next"),
  progress: document.getElementById("player-progress"),
  mood: document.getElementById("player-mood")
};

const audioState = {
  playlist: [],
  currentIndex: 0,
  isPlaying: false,
  isSeeking: false
};

init();

async function init() {
  renderCategories();
  bindEventListeners();

  await Promise.allSettled([loadPosts(), loadPlaylist()]);
}

function renderCategories() {
  dom.categoryBar.innerHTML = CATEGORY_CONFIG.map((cat) => {
    return `
      <button class="sr-category" data-category="${cat.id}" data-active="${state.activeCategory === cat.id}">
        <span aria-hidden="true">${cat.icon}</span>
        ${cat.label}
      </button>
    `;
  }).join("");
}

function bindEventListeners() {
  dom.categoryBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    const category = button.dataset.category;
    if (category === state.activeCategory) return;
    state.activeCategory = category;
    renderCategories();
    renderPosts();
  });

  const handleSearch = (value) => {
    state.searchQuery = value.trim().toLowerCase();
    if (dom.searchInput && document.activeElement !== dom.searchInput) {
      dom.searchInput.value = value;
    }
    if (dom.mobileSearchInput && document.activeElement !== dom.mobileSearchInput) {
      dom.mobileSearchInput.value = value;
    }
    renderPosts();
  };

  dom.searchInput?.addEventListener("input", (e) => handleSearch(e.target.value));
  dom.mobileSearchInput?.addEventListener("input", (e) => handleSearch(e.target.value));

  dom.resetButton?.addEventListener("click", () => {
    state.activeCategory = "all";
    state.searchQuery = "";
    if (dom.searchInput) dom.searchInput.value = "";
    if (dom.mobileSearchInput) dom.mobileSearchInput.value = "";
    renderCategories();
    renderPosts();
  });

  dom.logoButton?.addEventListener("click", () => {
    state.activeCategory = "all";
    state.searchQuery = "";
    if (dom.searchInput) dom.searchInput.value = "";
    if (dom.mobileSearchInput) dom.mobileSearchInput.value = "";
    renderCategories();
    renderPosts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (dom.navToggle && dom.navMenu) {
    dom.navToggle.addEventListener("click", () => {
      const expanded = dom.navToggle.getAttribute("aria-expanded") === "true";
      dom.navToggle.setAttribute("aria-expanded", String(!expanded));
      dom.navMenu.setAttribute("aria-expanded", String(!expanded));
      dom.navMenu.style.display = !expanded ? "flex" : "none";
    });

    dom.navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        dom.navToggle.setAttribute("aria-expanded", "false");
        dom.navMenu.setAttribute("aria-expanded", "false");
        dom.navMenu.style.display = "none";
      });
    });
  }

  audioElements.toggle?.addEventListener("click", togglePlayback);
  audioElements.next?.addEventListener("click", playNextTrack);
  audioElements.progress?.addEventListener("input", () => {
    audioState.isSeeking = true;
  });
  audioElements.progress?.addEventListener("change", () => {
    if (!audioElements.audio.duration) return;
    const percentage = Number(audioElements.progress.value) / 100;
    audioElements.audio.currentTime = percentage * audioElements.audio.duration;
    audioState.isSeeking = false;
  });

  audioElements.audio?.addEventListener("timeupdate", () => {
    if (audioState.isSeeking || !audioElements.audio.duration) return;
    const progress = (audioElements.audio.currentTime / audioElements.audio.duration) * 100;
    audioElements.progress.value = progress.toString();
  });

  audioElements.audio?.addEventListener("ended", playNextTrack);
}

async function loadPosts() {
  try {
    const response = await fetch(`${POSTS_ENDPOINT}?v=${Date.now()}`);
    if (!response.ok) throw new Error("无法加载内容数据");
    const posts = await response.json();
    state.posts = posts;
    updateHeroCounter(posts.length);
    renderPosts();
  } catch (error) {
    console.error(error);
    dom.postGrid.innerHTML = renderErrorCard("内容数据暂时不可用");
  }
}

function renderPosts() {
  if (!state.posts.length) return;
  const heading = state.activeCategory === "all"
    ? "最新广播"
    : `${getCategoryLabel(state.activeCategory)} · 信号`;
  dom.postsHeading.textContent = heading;

  const filtered = state.posts
    .filter((post) => {
      const matchesCategory = state.activeCategory === "all" || post.category === state.activeCategory;
      if (!matchesCategory) return false;
      if (!state.searchQuery) return true;
      const haystack = `${post.title} ${post.summary || ""} ${(post.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(state.searchQuery);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  dom.postsCount.textContent = `${filtered.length} 条信号记录`;
  dom.emptyState.hidden = filtered.length > 0;
  dom.postGrid.hidden = !filtered.length;

  if (!filtered.length) {
    dom.postGrid.innerHTML = "";
    return;
  }

  dom.postGrid.innerHTML = filtered
    .map((post) => createCard(post))
    .join("");
}

function createCard(post) {
  const category = getCategoryLabel(post.category);
  const categoryIcon = getCategoryIcon(post.category);
  const frequency = post.frequency || "--";
  return `
    <article class="sr-card">
      <div class="sr-card__top">
        <span class="sr-chip"><span aria-hidden="true">${categoryIcon}</span>${category}</span>
        <span class="sr-card__frequency">${frequency}</span>
      </div>
      <div>
        <h3>${post.title}</h3>
        <p>${post.summary || ""}</p>
      </div>
      <div class="sr-card__meta">
        <span>${formatDate(post.date)} · ${post.readingTime || "--"}</span>
        <a class="sr-card__link" href="posts/post.html?slug=${post.slug}">阅读全文 →</a>
      </div>
    </article>
  `;
}

function renderErrorCard(message) {
  return `<div class="sr-empty">${message}</div>`;
}

function updateHeroCounter(total) {
  if (!dom.signalCounter) return;
  dom.signalCounter.textContent = total.toString().padStart(2, "0");
}

function getCategoryLabel(id) {
  return CATEGORY_CONFIG.find((cat) => cat.id === id)?.label || "未分类";
}

function getCategoryIcon(id) {
  return CATEGORY_CONFIG.find((cat) => cat.id === id)?.icon || "📡";
}

function formatDate(value) {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
}

async function loadPlaylist() {
  if (!audioElements.audio) return;
  try {
    const response = await fetch(`${AUDIO_ENDPOINT}?v=${Date.now()}`);
    if (!response.ok) throw new Error("无法加载播放列表");
    const playlist = await response.json();
    if (!Array.isArray(playlist) || !playlist.length) {
      throw new Error("播放列表为空");
    }
    audioState.playlist = playlist;
    setTrack(0);
  } catch (error) {
    console.error(error);
    audioElements.subtitle.textContent = "播放列表不可用";
    audioElements.toggle.disabled = true;
    audioElements.next.disabled = true;
  }
}

function setTrack(index) {
  if (!audioState.playlist.length) return;
  audioState.currentIndex = (index + audioState.playlist.length) % audioState.playlist.length;
  const track = audioState.playlist[audioState.currentIndex];
  audioElements.audio.src = track.url;
  audioElements.title.textContent = track.title;
  audioElements.subtitle.textContent = track.subtitle || track.artist || "Sunset Radio";
  audioElements.mood.textContent = track.mood || "Lo-Fi";
  audioElements.cover.style.backgroundImage = track.cover ? `url(${track.cover})` : "";
  audioElements.progress.value = "0";
  if (audioState.isPlaying) {
    playAudio();
  }
}

function togglePlayback() {
  if (!audioState.playlist.length) return;
  audioState.isPlaying = !audioState.isPlaying;
  if (audioState.isPlaying) {
    playAudio();
  } else {
    audioElements.audio.pause();
  }
  updatePlayerButton();
}

function playAudio() {
  audioElements.audio
    .play()
    .then(() => {
      audioState.isPlaying = true;
      updatePlayerButton();
    })
    .catch((error) => {
      console.error("无法播放音频", error);
      audioState.isPlaying = false;
      updatePlayerButton();
    });
}

function updatePlayerButton() {
  if (!audioElements.toggle) return;
  audioElements.toggle.textContent = audioState.isPlaying ? "⏸" : "▶";
}

function playNextTrack() {
  if (!audioState.playlist.length) return;
  setTrack(audioState.currentIndex + 1);
  if (audioState.isPlaying) {
    playAudio();
  }
}

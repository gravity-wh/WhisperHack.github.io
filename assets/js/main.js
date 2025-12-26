const POSTS_ENDPOINT = "content/posts.json";
const AUDIO_ENDPOINT = "content/audio.json";
const COLUMNS_ENDPOINT = "content/columns.json";
const LOCAL_AUDIO_BASE = "content/audio/";
const RADIO_DEFAULT_FREQUENCY = "102.4 MHz";
const INITIAL_DIAL_FREQUENCY = 102.4;
const RADIO_DEFAULT_SEGMENT = "Sunset Radio";
const RADIO_DEFAULT_HOST = "DJ Whisper";

const FALLBACK_PROGRAM_SCHEDULE = [
  {
    id: "chronos-heart",
    name: "时序之心",
    englishTag: "TIMING-CORE",
    frequency: 102.4,
    categories: ["ic-design", "dig-verification"],
    emoji: "⏱️",
    description: "聚焦模拟与数字 IC 设计的前沿与落地，让架构与波形保持时序一致。",
    tagline: "当电路与代码同频"
  },
  {
    id: "endless-steps",
    name: "步履不停",
    englishTag: "WANDERLUST",
    frequency: 88.0,
    categories: ["travel"],
    emoji: "🌿",
    description: "把旅途中的自然与人文温度，变成随风起伏的短波。",
    tagline: "携风出走，向山海问路"
  },
  {
    id: "beyond-sapien",
    name: "智人之上",
    englishTag: "SAPIEN-PLUS",
    frequency: 108.0,
    categories: ["ai"],
    emoji: "🤖",
    description: "记录人类与人工智能共生的每一次范式跃迁。",
    tagline: "在更高维度思考智能"
  },
  {
    id: "sonic-fragments",
    name: "声音碎片",
    englishTag: "SONIC-FRAGMENTS",
    frequency: 92.7,
    categories: ["guitar"],
    emoji: "🎧",
    description: "分享音乐创作与吉他实验，把旋律拆成可重复的模组。",
    tagline: "在频谱里拼出情绪"
  },
  {
    id: "between-lines",
    name: "字里行间",
    englishTag: "BETWEEN-LINES",
    frequency: 96.3,
    categories: ["reading"],
    emoji: "📚",
    description: "以阅读拆解世界，在纸页与现实间来回校准。",
    tagline: "在文字旁注记人生"
  },
  {
    id: "all-counterpoise",
    name: "万象对冲",
    englishTag: "ALL-COUNTERPOISE",
    frequency: 97.3,
    categories: ["fin-tech"],
    emoji: "💹",
    description: "记录金融科技、资本市场与加密叙事的波动，推演长期技术周期。",
    tagline: "在市场噪声里校准信号"
  },
  {
    id: "zero-to-infinity",
    name: "零到无穷",
    englishTag: "ZERO-TO-INFINITY",
    frequency: 95.6,
    categories: ["science"],
    emoji: "🪐",
    description: "聚焦自然科学的灵感瞬间——从数学到天文的思想跃迁。",
    tagline: "让万物规律跃迁成波"
  }
].map((program) => ({
  ...program,
  dialLabel: program.dialLabel || `FM ${program.frequency.toFixed(1)}`
}));

let PROGRAM_SCHEDULE = FALLBACK_PROGRAM_SCHEDULE.slice();
let PROGRAM_LOOKUP = buildProgramLookup(PROGRAM_SCHEDULE);
const PROGRAM_INTENT_STORAGE_KEY = "sr-program-intent";

let CATEGORY_CONFIG = buildCategoryConfig(PROGRAM_SCHEDULE);

const LEGACY_CATEGORY_FALLBACK = {
  "ic-design": { label: "模拟 IC 设计", icon: "⚡" },
  "dig-verification": { label: "数字 IC 验证", icon: "🧪" },
  ai: { label: "生成式 AI", icon: "🧠" },
  reading: { label: "书海拾贝", icon: "📖" },
  travel: { label: "飞行日记", icon: "✈️" },
  guitar: { label: "吉他与乐理", icon: "🎸" },
  "fin-tech": { label: "金融科技", icon: "💹" },
  science: { label: "零到无穷", icon: "🪐" },
  food: { label: "鲈鱼堪脍", icon: "🍽️" }
};

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
  logoButton: document.querySelector("[data-logo]"),
  currentFrequency: document.getElementById("current-frequency"),
  stationTag: document.getElementById("station-tag"),
  dialStatus: document.getElementById("dial-status"),
  dialStatusLead: document.getElementById("dial-status-lead"),
  dialStatusHighlight: document.getElementById("dial-status-highlight"),
  dialStatusDetail: document.getElementById("dial-status-detail"),
  dialTrack: document.getElementById("dial-track")
};

const audioElements = {
  audio: document.getElementById("bg-audio"),
  player: document.getElementById("player"),
  cover: document.getElementById("player-cover"),
  title: document.getElementById("player-title"),
  subtitle: document.getElementById("player-subtitle"),
  toggle: document.getElementById("player-toggle"),
  next: document.getElementById("player-next"),
  progress: document.getElementById("player-progress"),
  mood: document.getElementById("player-mood")
};

const audioState = {
  masterPlaylist: [],
  playlist: [],
  currentIndex: 0,
  isPlaying: false,
  isSeeking: false,
  introTimers: [],
  filterFrequency: null,
  coverToken: 0
};

const dialState = {
  min: 88,
  max: 108,
  step: 0.1,
  frequency: INITIAL_DIAL_FREQUENCY,
  postsByFrequency: new Map(),
  programsByFrequency: new Map(),
  availableFrequencies: [],
  hasSnapped: false,
  activeProgram: null
};

const inputTuning = {
  dialDragPixelsPerStep: 20,
  categoryWheelMultiplier: 0.9,
  playerAutoCollapseDelayMs: 5200
};

const dialGestureState = {
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  startFrequency: INITIAL_DIAL_FREQUENCY,
  hasHorizontalIntent: false
};

const playerUIState = {
  collapseTimer: null,
  lastInteractionAt: 0
};

init();

async function init() {
  await initPrograms();

  const initialProgramIntent = dom.categoryBar ? detectInitialProgramIntent() : null;
  if (initialProgramIntent && PROGRAM_LOOKUP.byId.has(initialProgramIntent)) {
    state.activeCategory = initialProgramIntent;
  }

  if (dom.categoryBar) {
    renderCategories();
  }
  bindEventListeners();
  setupDial();
  syncAudioWithCategory();

  const tasks = [];
  if (dom.postGrid) {
    tasks.push(loadPosts());
  }
  if (audioElements.audio) {
    tasks.push(loadPlaylist());
  }
  if (tasks.length) {
    await Promise.allSettled(tasks);
  }
}

async function initPrograms() {
  try {
    const response = await fetch(`${COLUMNS_ENDPOINT}?v=${Date.now()}`);
    if (!response.ok) throw new Error("无法加载栏目配置");
    const columns = await response.json();
    const schedule = buildProgramScheduleFromColumns(columns);
    if (!schedule.length) throw new Error("栏目配置为空");
    PROGRAM_SCHEDULE = schedule;
  } catch (error) {
    console.warn("Falling back to built-in program schedule", error);
    PROGRAM_SCHEDULE = FALLBACK_PROGRAM_SCHEDULE.slice();
  }

  PROGRAM_LOOKUP = buildProgramLookup(PROGRAM_SCHEDULE);
  CATEGORY_CONFIG = buildCategoryConfig(PROGRAM_SCHEDULE);
  refreshDialPrograms();
  updateDialUI();
}

function refreshDialPrograms() {
  dialState.programsByFrequency = new Map(PROGRAM_LOOKUP.byFrequency);
  dialState.activeProgram = PROGRAM_LOOKUP.byFrequency.get(dialState.frequency.toFixed(1)) || null;
}

function buildCategoryConfig(schedule) {
  return [
    { id: "all", label: "全部节目", icon: "📡" },
    ...schedule.map((program) => ({
      id: program.id,
      label: program.name,
      icon: program.emoji
    }))
  ];
}

function buildProgramScheduleFromColumns(columns) {
  if (!Array.isArray(columns)) return [];
  return columns
    .map((column) => normalizeColumnProgram(column))
    .filter(Boolean)
    .map((program) => ({
      ...program,
      dialLabel: program.dialLabel || `FM ${program.frequency.toFixed(1)}`
    }));
}

function normalizeColumnProgram(column) {
  if (!column || typeof column !== "object") return null;
  if (!column.id || !column.name) return null;
  const frequency = typeof column.frequency === "number" ? column.frequency : parseFrequency(column.frequency);
  if (!Number.isFinite(frequency)) return null;
  const category = column.category || (Array.isArray(column.categories) ? column.categories[0] : null) || null;
  const categories = Array.isArray(column.categories) && column.categories.length
    ? column.categories
    : (category ? [category] : []);
  return {
    id: String(column.id),
    name: String(column.name),
    englishTag: column.englishTag ? String(column.englishTag) : "",
    frequency: Number(frequency.toFixed(1)),
    category,
    categories,
    emoji: column.emoji ? String(column.emoji) : "📡",
    description: column.description ? String(column.description) : "",
    tagline: column.tagline ? String(column.tagline) : "",
    folder: column.folder ? String(column.folder) : String(column.id)
  };
}

function renderCategories() {
  if (!dom.categoryBar) return;
  dom.categoryBar.innerHTML = CATEGORY_CONFIG.map((cat) => {
    return `
      <button class="sr-category" data-category="${cat.id}" data-active="${state.activeCategory === cat.id}">
        <span aria-hidden="true">${cat.icon}</span>
        ${cat.label}
      </button>
    `;
  }).join("");
}

function setActiveCategory(nextCategory, options = {}) {
  const target = nextCategory || "all";
  const changed = target !== state.activeCategory || options.force;
  state.activeCategory = target;
  if (!changed) {
    if (options.scrollToPosts) {
      scrollToPostsSection();
    }
    return false;
  }
  if (dom.categoryBar) {
    renderCategories();
  }
  if (dom.postGrid) {
    renderPosts();
  }
  syncAudioWithCategory();
  if (options.alignDial) {
    const program = resolveProgramFromCategory(target);
    if (program) {
      setDialFrequency(program.frequency, { force: true });
    }
  }
  if (options.scrollToPosts) {
    scrollToPostsSection();
  }
  return changed;
}

function bindEventListeners() {
  if (dom.categoryBar) {
    dom.categoryBar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      const category = button.dataset.category;
      setActiveCategory(category, { alignDial: true });
    });

    dom.categoryBar.addEventListener("wheel", handleCategoryWheel, { passive: false });
  }

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
    state.searchQuery = "";
    if (dom.searchInput) dom.searchInput.value = "";
    if (dom.mobileSearchInput) dom.mobileSearchInput.value = "";
    setActiveCategory("all", { force: true, alignDial: true });
  });

  dom.logoButton?.addEventListener("click", () => {
    if (!dom.categoryBar) {
      window.location.href = "index.html";
      return;
    }
    state.searchQuery = "";
    if (dom.searchInput) dom.searchInput.value = "";
    if (dom.mobileSearchInput) dom.mobileSearchInput.value = "";
    setActiveCategory("all", { force: true, alignDial: true });
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

  bindProgramTriggerLinks();

  audioElements.toggle?.addEventListener("click", togglePlayback);
  audioElements.next?.addEventListener("click", playNextTrack);

  audioElements.player?.addEventListener("pointerdown", () => markPlayerInteraction());
  audioElements.player?.addEventListener("focusin", () => markPlayerInteraction());
  audioElements.player?.addEventListener("click", (event) => {
    if (!audioElements.player) return;
    if (!audioElements.player.classList.contains("is-collapsed")) return;
    // Restore when collapsed; ignore clicks when expanded.
    event.preventDefault();
    expandPlayer();
    schedulePlayerAutoCollapse();
  });

  audioElements.progress?.addEventListener("input", () => {
    audioState.isSeeking = true;
    markPlayerInteraction();
  });
  audioElements.progress?.addEventListener("change", () => {
    markPlayerInteraction();
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

  audioElements.audio?.addEventListener("playing", () => {
    if (!audioElements.player) return;
    audioElements.player.classList.add("is-playing");
    expandPlayer();
    schedulePlayerAutoCollapse();
  });

  audioElements.audio?.addEventListener("pause", () => {
    if (!audioElements.player) return;
    audioElements.player.classList.remove("is-playing");
    expandPlayer();
  });

  audioElements.audio?.addEventListener("ended", playNextTrack);
}

function setupDial() {
  if (!dom.dialTrack) return;
  dom.dialTrack.addEventListener("wheel", handleDialScroll, { passive: false });
  dom.dialTrack.addEventListener("pointerdown", handleDialPointerDown);
  dom.dialTrack.addEventListener("pointermove", handleDialPointerMove);
  dom.dialTrack.addEventListener("pointerup", handleDialPointerEnd);
  dom.dialTrack.addEventListener("pointercancel", handleDialPointerEnd);
  dom.dialTrack.addEventListener("keydown", handleDialKeydown);
  updateDialUI();
}

function handleDialPointerDown(event) {
  if (!dom.dialTrack) return;
  if (dialGestureState.active) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  dialGestureState.active = true;
  dialGestureState.pointerId = event.pointerId;
  dialGestureState.startX = event.clientX;
  dialGestureState.startY = event.clientY;
  dialGestureState.startFrequency = dialState.frequency;
  dialGestureState.hasHorizontalIntent = false;
  dom.dialTrack.setPointerCapture?.(event.pointerId);
}

function handleDialPointerMove(event) {
  if (!dialGestureState.active) return;
  if (dialGestureState.pointerId !== event.pointerId) return;
  const dx = event.clientX - dialGestureState.startX;
  const dy = event.clientY - dialGestureState.startY;

  if (!dialGestureState.hasHorizontalIntent) {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 6 && absY < 6) return;
    if (absX <= absY) return;
    dialGestureState.hasHorizontalIntent = true;
  }

  event.preventDefault();
  const deltaSteps = dx / inputTuning.dialDragPixelsPerStep;
  const next = dialGestureState.startFrequency + deltaSteps * dialState.step;
  setDialFrequency(next);
}

function handleDialPointerEnd(event) {
  if (!dialGestureState.active) return;
  if (dialGestureState.pointerId !== event.pointerId) return;
  dialGestureState.active = false;
  dialGestureState.pointerId = null;
  dialGestureState.hasHorizontalIntent = false;
}

function handleCategoryWheel(event) {
  if (!dom.categoryBar) return;
  const el = dom.categoryBar;
  if (el.scrollWidth <= el.clientWidth) return;

  const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
    ? event.deltaX
    : event.deltaY;
  if (!rawDelta) return;

  // Normalize wheel delta across browsers.
  let delta = rawDelta;
  if (event.deltaMode === 1) {
    delta *= 16;
  } else if (event.deltaMode === 2) {
    delta *= el.clientWidth;
  }

  event.preventDefault();
  el.scrollLeft += delta * inputTuning.categoryWheelMultiplier;
}

function markPlayerInteraction() {
  playerUIState.lastInteractionAt = Date.now();
  if (audioElements.player?.classList.contains("is-collapsed")) {
    expandPlayer();
  }
  schedulePlayerAutoCollapse();
}

function schedulePlayerAutoCollapse() {
  if (!audioElements.player) return;
  if (!audioState.isPlaying) return;
  if (playerUIState.collapseTimer) {
    clearTimeout(playerUIState.collapseTimer);
  }
  const scheduledAt = Date.now();
  playerUIState.collapseTimer = setTimeout(() => {
    if (!audioState.isPlaying) return;
    const last = playerUIState.lastInteractionAt || scheduledAt;
    if (Date.now() - last < inputTuning.playerAutoCollapseDelayMs) {
      schedulePlayerAutoCollapse();
      return;
    }
    collapsePlayer();
  }, inputTuning.playerAutoCollapseDelayMs);
}

function collapsePlayer() {
  if (!audioElements.player) return;
  audioElements.player.classList.add("is-collapsed");
}

function expandPlayer() {
  if (!audioElements.player) return;
  audioElements.player.classList.remove("is-collapsed");
}

function handleDialScroll(event) {
  event.preventDefault();
  const delta = event.deltaY || event.deltaX || 0;
  if (!delta) return;
  const direction = delta > 0 ? -1 : 1;
  const multiplier = event.shiftKey ? 5 : 1;
  setDialFrequency(dialState.frequency + direction * dialState.step * multiplier);
}

function handleDialKeydown(event) {
  const keyMap = {
    ArrowRight: dialState.step,
    ArrowUp: dialState.step,
    ArrowLeft: -dialState.step,
    ArrowDown: -dialState.step,
    PageUp: dialState.step * 5,
    PageDown: -dialState.step * 5
  };

  if (event.key === "Home") {
    event.preventDefault();
    setDialFrequency(dialState.min);
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    setDialFrequency(dialState.max);
    return;
  }

  const increment = keyMap[event.key];
  if (increment) {
    event.preventDefault();
    setDialFrequency(dialState.frequency + increment);
  }
}

function setDialFrequency(value, options = {}) {
  const clamped = clamp(value, dialState.min, dialState.max);
  const rounded = Number(clamped.toFixed(1));
  const frequencyChanged = rounded !== dialState.frequency;
  const freqString = rounded.toFixed(1);
  dialState.frequency = rounded;
  if (!options.silent && (frequencyChanged || options.force)) {
    updateDialUI();
  } else if (!options.silent && !frequencyChanged) {
    const program = dialState.programsByFrequency.get(freqString) || dialState.activeProgram;
    updateStationMeta(program);
    updateDialStatus(freqString, program);
  }
}

function updateDialUI() {
  const freqString = dialState.frequency.toFixed(1);
  const program = dialState.programsByFrequency.get(freqString) || null;
  dialState.activeProgram = program;
  if (dom.currentFrequency) {
    dom.currentFrequency.textContent = `${freqString} MHz`;
  }
  if (dom.dialTrack) {
    const percent = (dialState.frequency - dialState.min) / (dialState.max - dialState.min);
    dom.dialTrack.style.setProperty("--needle-position", `${percent * 100}%`);
    dom.dialTrack.style.setProperty("--dial-shift", `${(0.5 - percent) * 60}%`);
  }
  updateStationMeta(program);
  updateDialStatus(freqString, program);
}

function updateDialStatus(freqString, program = dialState.activeProgram) {
  if (!dom.dialStatus) return;
  const posts = dialState.postsByFrequency.get(freqString) || [];
  if (program) {
    const descriptor = `${program.dialLabel} · ${program.name}`;
    const [latest] = posts;
    const highlight = latest?.title || program.tagline || program.name;
    const summarySource = latest?.summary || latest?.title || program.description || program.tagline;
    const summary = truncateText(summarySource || "等待下一束信号", 80);
    setDialStatusContent({ lead: descriptor, highlight, summary });
    dom.dialStatus.dataset.state = latest ? "program" : "program-idle";
    return;
  }

  setDialStatusContent({
    lead: `搜寻中 · ${freqString} MHz`,
    highlight: "捕捉下一束信号",
    summary: "轻触调频拨轮以捕捉下一档节目"
  });
  dom.dialStatus.dataset.state = "scanning";
}

function setDialStatusContent({ lead, highlight, summary }) {
  if (!dom.dialStatus) return;
  dom.dialStatus.classList.add("is-dimmed");
  if (dom.dialStatusLead) {
    dom.dialStatusLead.textContent = lead;
  }
  if (dom.dialStatusHighlight) {
    dom.dialStatusHighlight.textContent = highlight || "";
    dom.dialStatusHighlight.hidden = !highlight;
  }
  if (dom.dialStatusDetail) {
    dom.dialStatusDetail.textContent = summary || "";
    dom.dialStatusDetail.hidden = !summary;
  }
  if (!dom.dialStatusLead || (!dom.dialStatusHighlight && !dom.dialStatusDetail)) {
    const fallback = [lead, highlight, summary].filter(Boolean).join(" ｜ ");
    dom.dialStatus.textContent = fallback;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dom.dialStatus.classList.remove("is-dimmed");
    });
  });
}

function updateStationMeta(program) {
  if (dom.signalCounter) {
    dom.signalCounter.textContent = program?.englishTag || "SUNSET";
  }
  if (dom.stationTag) {
    dom.stationTag.textContent = program?.name || "待定节目";
  }
}

async function loadPosts() {
  if (!dom.postGrid) return;
  try {
    const response = await fetch(`${POSTS_ENDPOINT}?v=${Date.now()}`);
    if (!response.ok) throw new Error("无法加载内容数据");
    const rawPosts = await response.json();
    // 默认只展示已发布/已投放的文章（status === 'shipped')。
    // 这样你可以通过把条目状态改为 'building'/'draft' 等来达到“注释掉”的效果。
    const visible = Array.isArray(rawPosts)
      ? rawPosts.filter((p) => String(p.status || "").toLowerCase() === "shipped")
      : [];
    const decoratedPosts = decoratePostsWithPrograms(visible);
    state.posts = decoratedPosts;
    renderPosts();
    syncAudioWithCategory();
    buildFrequencyMap(decoratedPosts);
    const activeProgram = resolveProgramFromCategory(state.activeCategory);
    if (activeProgram) {
      setDialFrequency(activeProgram.frequency, { force: true });
      dialState.hasSnapped = true;
    } else if (!dialState.hasSnapped) {
      snapDialToClosestStation();
      dialState.hasSnapped = true;
    } else {
      updateDialUI();
    }
  } catch (error) {
    console.error(error);
    dom.postGrid.innerHTML = renderErrorCard("内容数据暂时不可用");
  }
}

function renderPosts() {
  if (!dom.postGrid || !state.posts.length) return;
  const activeProgram = resolveProgramFromCategory(state.activeCategory);
  if (dom.postsHeading) {
    dom.postsHeading.textContent = activeProgram
      ? `${activeProgram.name} · 节目`
      : "最新节目";
  }

  const filtered = state.posts
    .filter((post) => {
      if (activeProgram) {
        if (post.program?.id !== activeProgram.id) return false;
      } else if (state.activeCategory !== "all" && post.category !== state.activeCategory) {
        return false;
      }
      if (!state.searchQuery) return true;
      const haystack = `${post.title} ${post.summary || ""} ${(post.tags || []).join(" ")}`
        .concat(` ${post.program?.name || ""} ${post.program?.tagline || ""}`)
        .toLowerCase();
      return haystack.includes(state.searchQuery);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (dom.postsCount) {
    dom.postsCount.textContent = `${filtered.length} 条节目记录`;
  }
  if (dom.emptyState) {
    dom.emptyState.hidden = filtered.length > 0;
  }
  dom.postGrid.hidden = !filtered.length;

  if (!filtered.length) {
    dom.postGrid.innerHTML = "";
    return;
  }

  dom.postGrid.innerHTML = filtered
    .map((post) => createCard(post))
    .join("");
}

function syncAudioWithCategory() {
  const program = resolveProgramFromCategory(state.activeCategory);
  const targetFrequency = program?.frequency ?? null;
  setPlaylistByFrequency(targetFrequency);
}

function setPlaylistByFrequency(frequencyValue) {
  const normalized = normalizeFrequencyValue(frequencyValue);
  audioState.filterFrequency = normalized;
  if (!audioState.masterPlaylist.length) {
    return;
  }
  const filtered = normalized == null
    ? audioState.masterPlaylist.slice()
    : audioState.masterPlaylist.filter((track) => track.frequencyValue === normalized);
  if (!filtered.length) {
    audioState.playlist = [];
    audioState.currentIndex = 0;
    setPlayerAvailability(false, "该栏目暂无音轨");
    return;
  }
  audioState.playlist = filtered;
  audioState.currentIndex = 0;
  setPlayerAvailability(true);
  setTrack(0);
}

function setPlayerAvailability(canPlay, message) {
  if (audioElements.toggle) {
    audioElements.toggle.disabled = !canPlay;
  }
  if (audioElements.next) {
    audioElements.next.disabled = !canPlay;
  }
  if (!canPlay) {
    if (audioElements.audio) {
      audioElements.audio.pause();
      audioElements.audio.removeAttribute("src");
      audioElements.audio.load();
    }
    audioState.isPlaying = false;
    updatePlayerButton();
    if (audioElements.progress) {
      audioElements.progress.value = "0";
    }
    if (message && audioElements.subtitle) {
      audioElements.subtitle.textContent = message;
    }
  }
}

function buildFrequencyMap(posts) {
  dialState.postsByFrequency = posts.reduce((map, post) => {
    const freqValue = parseFrequency(post.frequency);
    if (!Number.isFinite(freqValue)) return map;
    const key = freqValue.toFixed(1);
    const stack = map.get(key) || [];
    stack.push(post);
    map.set(key, stack);
    return map;
  }, new Map());
  dialState.postsByFrequency.forEach((stack) => {
    stack.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  const unionKeys = new Set([
    ...PROGRAM_LOOKUP.byFrequency.keys(),
    ...dialState.postsByFrequency.keys()
  ]);

  dialState.availableFrequencies = Array.from(unionKeys)
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
}

function snapDialToClosestStation() {
  if (!dialState.availableFrequencies.length) {
    updateDialUI();
    return;
  }
  const current = dialState.frequency;
  const closest = dialState.availableFrequencies.reduce((prev, freq) => {
    const prevDiff = Math.abs(prev - current);
    const nextDiff = Math.abs(freq - current);
    return nextDiff < prevDiff ? freq : prev;
  }, dialState.availableFrequencies[0]);
  setDialFrequency(closest, { force: true });
}

function createCard(post) {
  const category = getCategoryLabel(post.category);
  const categoryIcon = getCategoryIcon(post.category);
  const program = post.program;
  const badgeLabel = program?.name || category;
  const badgeIcon = program?.emoji || categoryIcon;
  const frequency = program?.dialLabel || post.frequency || "--";
  const programSuffix = program?.englishTag ? `<span class="sr-card__tag">${program.englishTag}</span>` : "";

  const postUrl = buildPostUrl(post);
  return `
    <article class="sr-card">
      <div class="sr-card__top">
        <span class="sr-chip"><span aria-hidden="true">${badgeIcon}</span>${badgeLabel}</span>
        <span class="sr-card__frequency">${frequency}${programSuffix}</span>
      </div>
      <div class="sr-card__body">
        <h3>${post.title}</h3>
        <p>${post.summary || ""}</p>
      </div>
      <div class="sr-card__meta">
        <span>${formatDate(post.date)} · ${post.readingTime || "--"}</span>
        <a class="sr-card__link" href="${postUrl}">阅读全文 →</a>
      </div>
    </article>
  `;
}

function buildPostUrl(post) {
  const url = new URL("http://local.invalid/posts/post.html");
  url.searchParams.set("slug", post.slug);
  if (post.column) url.searchParams.set("column", post.column);
  if (post.title) url.searchParams.set("title", post.title);
  if (post.date) url.searchParams.set("date", post.date);
  if (Array.isArray(post.tags) && post.tags.length) url.searchParams.set("tags", post.tags.join(","));
  if (post.readingTime) url.searchParams.set("readingTime", post.readingTime);
  if (post.status) url.searchParams.set("status", post.status);
  return `posts/post.html?${url.searchParams.toString()}`;
}

function decoratePostsWithPrograms(posts) {
  return posts.map((post) => {
    // If post has a column field, resolve program from column ID
    const program = post.column
      ? PROGRAM_LOOKUP.byId.get(post.column) || resolveProgramForPost(post)
      : resolveProgramForPost(post);
    // Derive category and frequency from program if not explicitly set
    const category = post.category || program?.category || program?.categories?.[0] || null;
    const frequency = post.frequency || (program ? `${program.frequency.toFixed(1)} FM` : null);
    const programId = post.programId || program?.id || null;
    return { ...post, program, category, frequency, programId };
  });
}

function resolveProgramForPost(post) {
  if (!post) return null;
  // First check column field (new structure)
  if (post.column && PROGRAM_LOOKUP.byId.has(post.column)) {
    return PROGRAM_LOOKUP.byId.get(post.column);
  }
  if (post.programId && PROGRAM_LOOKUP.byId.has(post.programId)) {
    return PROGRAM_LOOKUP.byId.get(post.programId);
  }
  const freqValue = parseFrequency(post.frequency);
  if (Number.isFinite(freqValue)) {
    const freqKey = freqValue.toFixed(1);
    if (PROGRAM_LOOKUP.byFrequency.has(freqKey)) {
      return PROGRAM_LOOKUP.byFrequency.get(freqKey);
    }
  }
  if (post.category && PROGRAM_LOOKUP.byCategory.has(post.category)) {
    return PROGRAM_LOOKUP.byCategory.get(post.category)[0];
  }
  return null;
}

function resolveProgramFromCategory(categoryId) {
  if (!categoryId || categoryId === "all") return null;
  if (PROGRAM_LOOKUP.byId.has(categoryId)) {
    return PROGRAM_LOOKUP.byId.get(categoryId);
  }
  if (PROGRAM_LOOKUP.byCategory.has(categoryId)) {
    const [firstProgram] = PROGRAM_LOOKUP.byCategory.get(categoryId);
    return firstProgram || null;
  }
  return null;
}

function resolveTrackProgram(track) {
  if (!track) return null;
  if (track.programId && PROGRAM_LOOKUP.byId.has(track.programId)) {
    return PROGRAM_LOOKUP.byId.get(track.programId);
  }
  const numericFreq = Number.isFinite(track.frequencyValue)
    ? track.frequencyValue
    : parseFrequency(track.frequency);
  if (Number.isFinite(numericFreq)) {
    const freqKey = numericFreq.toFixed(1);
    if (PROGRAM_LOOKUP.byFrequency.has(freqKey)) {
      return PROGRAM_LOOKUP.byFrequency.get(freqKey);
    }
  }
  return null;
}

function normalizeTrackMetadata(track) {
  if (!track || !track.file) return null;
  const freqValue = parseFrequency(track.frequency);
  const freqKey = Number.isFinite(freqValue) ? freqValue.toFixed(1) : null;
  const normalizedFrequency = freqKey ? Number(freqKey) : null;
  const program = freqKey ? PROGRAM_LOOKUP.byFrequency.get(freqKey) : null;
  return {
    ...track,
    frequencyValue: normalizedFrequency,
    programId: program?.id || track.programId || null,
    coverSource: track.cover || deriveCoverFromFile(track.file)
  };
}

function renderErrorCard(message) {
  return `<div class="sr-empty">${message}</div>`;
}

function getCategoryLabel(id) {
  if (!id) return "未分类";
  const modern = CATEGORY_CONFIG.find((cat) => cat.id === id)?.label;
  if (modern) return modern;
  return LEGACY_CATEGORY_FALLBACK[id]?.label || "未分类";
}

function getCategoryIcon(id) {
  if (!id) return "📡";
  const modern = CATEGORY_CONFIG.find((cat) => cat.id === id)?.icon;
  if (modern) return modern;
  return LEGACY_CATEGORY_FALLBACK[id]?.icon || "📡";
}

function scrollToPostsSection() {
  const postsSection = document.getElementById("posts");
  if (postsSection) {
    postsSection.scrollIntoView({ behavior: "smooth" });
  }
}

function formatDate(value) {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
}

function parseFrequency(value) {
  if (!value) return NaN;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : NaN;
}

function truncateText(text, limit) {
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeFrequencyValue(value) {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === "number" ? value : parseFrequency(value);
  if (!Number.isFinite(numeric)) return null;
  return Number(numeric.toFixed(1));
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
    const normalized = playlist
      .map(normalizeTrackMetadata)
      .filter((track) => Boolean(track && track.file));
    audioState.masterPlaylist = normalized;
    if (!normalized.length) {
      audioState.playlist = [];
      setPlayerAvailability(false, "播放列表为空");
      return;
    }
    setPlaylistByFrequency(audioState.filterFrequency);
    if (!audioState.playlist.length && audioState.filterFrequency == null) {
      audioState.playlist = normalized.slice();
      audioState.currentIndex = 0;
      setPlayerAvailability(true);
      setTrack(0);
    }
  } catch (error) {
    console.error(error);
    setPlayerAvailability(false, "播放列表不可用");
  }
}

function setTrack(index) {
  if (!audioState.playlist.length) {
    setPlayerAvailability(false, "暂无可播音轨");
    return;
  }
  audioState.currentIndex = (index + audioState.playlist.length) % audioState.playlist.length;
  const track = audioState.playlist[audioState.currentIndex];
  const source = resolveTrackSource(track);
  if (!source) {
    console.warn("Track is missing a playable source", track);
    setPlayerAvailability(false, "音频资源缺失");
    return;
  }
  audioElements.audio.src = source;
  audioElements.title.textContent = track.title;
  const program = resolveTrackProgram(track);
  audioElements.mood.textContent = program?.name || "Sunset Radio";
  announceTrack(track, program);
  updateCoverArtwork(track, program);
  audioElements.progress.value = "0";
  if (audioState.isPlaying) {
    playAudio();
  }
}

function togglePlayback() {
  if (!audioState.playlist.length) {
    setPlayerAvailability(false, "暂无可播音轨");
    return;
  }
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
  if (!audioState.playlist.length) {
    setPlayerAvailability(false, "暂无可播音轨");
    return;
  }
  setTrack(audioState.currentIndex + 1);
  if (audioState.isPlaying) {
    playAudio();
  }
}

function resolveTrackSource(track) {
  if (track?.url) return track.url;
  if (track?.file) {
    return `${LOCAL_AUDIO_BASE}${encodeFilePath(track.file)}`;
  }
  return "";
}

function encodeFilePath(path) {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function announceTrack(track, program) {
  if (!audioElements.subtitle) return;
  clearIntroTimers();
  const segment = program?.name || RADIO_DEFAULT_SEGMENT;
  const frequencyLabel = program?.dialLabel || track.frequency || RADIO_DEFAULT_FREQUENCY;
  const introScript = `Now cueing ${track.title}`;
  const sequence = [
    `${segment} · ${frequencyLabel}`,
    `${RADIO_DEFAULT_HOST}: ${introScript}`,
    formatNowPlaying(track, program)
  ];
  audioElements.subtitle.textContent = sequence[0];
  audioState.introTimers = sequence.slice(1).map((line, index) => {
    return setTimeout(() => {
      audioElements.subtitle.textContent = line;
    }, 3200 * (index + 1));
  });
}

function formatNowPlaying(track, program) {
  const artist = track.artist ? ` — ${track.artist}` : "";
  const programSuffix = program ? ` ｜ ${program.name}` : "";
  return `Now Playing · ${track.title}${artist}${programSuffix}`;
}

function clearIntroTimers() {
  if (!audioState.introTimers?.length) return;
  audioState.introTimers.forEach((timerId) => clearTimeout(timerId));
  audioState.introTimers = [];
}

function updateCoverArtwork(track, program) {
  if (!audioElements.cover) return;
  audioState.coverToken += 1;
  const token = audioState.coverToken;
  const coverSource = track.coverSource || deriveCoverFromFile(track.file);
  if (coverSource) {
    preloadImage(coverSource)
      .then((src) => {
        if (audioState.coverToken === token) {
          setCoverImage(src);
        }
      })
      .catch(() => {
        if (audioState.coverToken === token) {
          applyCoverFallback(program);
        }
      });
    return;
  }
  if (audioState.coverToken === token) {
    applyCoverFallback(program);
  }
}

function getMoodGradient(label) {
  const mood = (label || "").toLowerCase();
  if (mood.includes("时序") || mood.includes("timing")) {
    return ["#0f2027", "#203a43"];
  }
  if (mood.includes("步履") || mood.includes("travel")) {
    return ["#134e5e", "#71b280"];
  }
  if (mood.includes("智人") || mood.includes("sapien")) {
    return ["#1a2a6c", "#5d26c1"];
  }
  if (mood.includes("声音") || mood.includes("sonic")) {
    return ["#42275a", "#734b6d"];
  }
  if (mood.includes("字里") || mood.includes("lines")) {
    return ["#355c7d", "#c06c84"];
  }
  if (mood.includes("classical") || mood.includes("gramophone")) {
    return ["#1f1c2c", "#928dab"];
  }
  if (mood.includes("neon") || mood.includes("night") || mood.includes("city")) {
    return ["#1a2a6c", "#b21f1f"];
  }
  if (mood.includes("raw") || mood.includes("cassette")) {
    return ["#3c1053", "#ad5389"];
  }
  return ["#141e30", "#243b55"];
}

function deriveCoverFromFile(file) {
  if (!file) return "";
  const normalized = file.trim().replace(/\\/g, "/");
  if (!normalized) return "";
  const segments = normalized.split("/").filter(Boolean);
  if (!segments.length) return "";
  const filename = segments.pop();
  const coverName = `${filename.replace(/\.[^.]+$/, "")}.jpg`;
  const encodedPath = [...segments, coverName].map((segment) => encodeURIComponent(segment)).join("/");
  return `${LOCAL_AUDIO_BASE}${encodedPath}`;
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load cover: ${src}`));
    img.src = src;
  });
}

function setCoverImage(src) {
  if (!audioElements.cover) return;
  audioElements.cover.style.backgroundImage = `url(${src})`;
  audioElements.cover.removeAttribute("data-placeholder");
}

function applyCoverFallback(program) {
  if (!audioElements.cover) return;
  const [start, end] = getMoodGradient(program?.name || program?.englishTag || "");
  audioElements.cover.style.backgroundImage = `linear-gradient(135deg, ${start}, ${end})`;
  audioElements.cover.setAttribute("data-placeholder", "true");
}

function buildProgramLookup(schedule) {
  const byId = new Map();
  const byFrequency = new Map();
  const byCategory = new Map();

  schedule.forEach((program) => {
    byId.set(program.id, program);
    byFrequency.set(program.frequency.toFixed(1), program);
    (program.categories || []).forEach((category) => {
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category).push(program);
    });
  });

  return { byId, byFrequency, byCategory };
}

function bindProgramTriggerLinks() {
  const triggerLinks = document.querySelectorAll("[data-program-trigger]");
  if (!triggerLinks.length) return;
  triggerLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const programId = link.dataset.programTrigger;
      if (!isValidProgramId(programId)) return;
      if (isSameDocumentLink(link) && dom.categoryBar) {
        event.preventDefault();
        setActiveCategory(programId, { force: true, alignDial: true, scrollToPosts: true });
        return;
      }
      persistProgramIntent(programId);
    });
  });
}

function isSameDocumentLink(link) {
  const href = link.getAttribute("href") || "";
  if (!href || href.startsWith("#")) {
    return true;
  }
  try {
    const targetUrl = new URL(link.href, window.location.href);
    return targetUrl.pathname === window.location.pathname;
  } catch (error) {
    return false;
  }
}

function persistProgramIntent(programId) {
  try {
    sessionStorage.setItem(PROGRAM_INTENT_STORAGE_KEY, programId);
  } catch {
    // Storage might be unavailable in some contexts; ignore.
  }
}

function consumeStoredProgramIntent() {
  try {
    const value = sessionStorage.getItem(PROGRAM_INTENT_STORAGE_KEY);
    if (value) {
      sessionStorage.removeItem(PROGRAM_INTENT_STORAGE_KEY);
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

function detectInitialProgramIntent() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("program");
  if (isValidProgramId(fromQuery)) {
    return fromQuery;
  }
  const stored = consumeStoredProgramIntent();
  if (isValidProgramId(stored)) {
    return stored;
  }
  return null;
}

function isValidProgramId(value) {
  return Boolean(value && PROGRAM_LOOKUP.byId.has(value));
}

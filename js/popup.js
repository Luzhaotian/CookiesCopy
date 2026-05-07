let cookieList = [];

const copy = (text) => {
  navigator.clipboard?.writeText?.(text);
};

const showFeedback = (btn, originalText, timerRef) => {
  if (timerRef.value) clearTimeout(timerRef.value);

  btn.innerText = "复制成功";
  btn.classList.add("btn--success");
  btn.style.pointerEvents = "none";

  timerRef.value = setTimeout(() => {
    btn.innerText = originalText;
    btn.classList.remove("btn--success");
    btn.style.pointerEvents = "";
    timerRef.value = null;
  }, 1000);
};

const copyAllCookies = (formatFn) =>
  cookieList.map(formatFn).filter(Boolean).join("\n");

const formats = {
  copyAll: (c) => `${c.name}:${c.value};`,
  copyAllKey: (c) => `${c.name};`,
  copyAllValue: (c) => `${c.value};`,
};

// 主题
const applyTheme = (mode) => {
  let effective;
  if (mode === "auto") {
    effective = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } else {
    effective = mode;
  }
  document.body.setAttribute("data-theme", effective);
};

const getSavedTheme = () =>
  new Promise((resolve) => {
    if (!chrome.storage?.sync) return resolve(null);
    chrome.storage.sync.get("themeMode", (result) => {
      resolve(result.themeMode || null);
    });
  });

const initTheme = async () => {
  const saved = await getSavedTheme();
  const mode = saved || "auto";
  document.getElementById("themeSelect").value = mode;
  applyTheme(mode);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (document.getElementById("themeSelect").value === "auto") {
      applyTheme("auto");
    }
  });
};

const setTheme = (mode) => {
  applyTheme(mode);
  chrome.storage?.sync?.set({ themeMode: mode });
};

// Cookie 数量显示
const updateCookieCount = (total, filtered) => {
  const countEl = document.getElementById("cookieCount");
  if (total === 0) {
    countEl.textContent = "";
  } else if (filtered !== undefined && filtered !== total) {
    countEl.textContent = `显示 ${filtered} / ${total} 个 Cookie`;
  } else {
    countEl.textContent = `共 ${total} 个 Cookie`;
  }
};

// 渲染 Cookie 列表
const renderCookies = (cookies) => {
  const cookiesList = document.getElementById("cookiesList");
  cookiesList.innerHTML = "";

  if (cookies.length > 0) {
    cookies.forEach(({ name, value }) => {
      const li = document.createElement("li");
      li.textContent = name.toUpperCase();
      li.title = value;
      cookiesList.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = cookieList.length > 0 ? "无匹配结果" : "当前页面无 Cookie";
    li.classList.add("empty-state");
    cookiesList.appendChild(li);
  }
};

// 搜索过滤
const filterCookies = (query) => {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderCookies(cookieList);
    updateCookieCount(cookieList.length);
    return;
  }
  const filtered = cookieList.filter((c) =>
    c.name.toLowerCase().includes(q)
  );
  renderCookies(filtered);
  updateCookieCount(cookieList.length, filtered.length);
};

// 导出 JSON 文件
const exportJson = (hostname) => {
  const data = cookieList.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
    expirationDate: c.expirationDate,
  }));
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cookies-${hostname}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const init = () => {
  initTheme();

  let hostname = "";

  chrome.tabs.query(
    { active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
    (tabs) => {
      const { url } = tabs[0];
      hostname = new URL(url).hostname;

      document.getElementById("title").innerText = `当前页面：${hostname}`;

      chrome.cookies.getAll({ url }, (cookies) => {
        cookieList = cookies.filter((item) => item.domain === hostname);
        renderCookies(cookieList);
        updateCookieCount(cookieList.length);
      });
    }
  );

  const cookiesListEl = document.getElementById("cookiesList");
  const copyAll = document.getElementById("copyAll");
  const copyAllKey = document.getElementById("copyAllKey");
  const copyAllValue = document.getElementById("copyAllValue");
  const exportJsonBtn = document.getElementById("exportJson");
  const themeSelect = document.getElementById("themeSelect");
  const searchInput = document.getElementById("searchInput");

  const allTimer = { value: null };
  const keyTimer = { value: null };
  const valueTimer = { value: null };

  cookiesListEl.addEventListener("click", (e) => {
    if (!e.target.title) return;
    copy(e.target.title);
    const originalText = e.target.textContent;
    e.target.classList.add("copied");
    e.target.textContent = "已复制";
    setTimeout(() => {
      e.target.classList.remove("copied");
      e.target.textContent = originalText;
    }, 800);
  });

  copyAll.addEventListener("click", () => {
    const text = copyAllCookies(formats.copyAll);
    if (text) copy(text);
    showFeedback(copyAll, "全部复制", allTimer);
  });

  copyAllKey.addEventListener("click", () => {
    const text = copyAllCookies(formats.copyAllKey);
    if (text) copy(text);
    showFeedback(copyAllKey, "复制键名", keyTimer);
  });

  copyAllValue.addEventListener("click", () => {
    const text = copyAllCookies(formats.copyAllValue);
    if (text) copy(text);
    showFeedback(copyAllValue, "复制值", valueTimer);
  });

  exportJsonBtn.addEventListener("click", () => {
    exportJson(hostname);
  });

  themeSelect.addEventListener("change", (e) => {
    setTheme(e.target.value);
  });

  searchInput.addEventListener("input", (e) => {
    filterCookies(e.target.value);
  });
};

init();

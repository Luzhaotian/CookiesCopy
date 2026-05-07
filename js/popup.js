let cookieList = [];
let filteredList = [];
let searchQuery = "";

const copy = (text) => {
  navigator.clipboard?.writeText?.(text);
};

// Toast 系统
const showToast = (() => {
  let timer = null;
  return (message) => {
    if (timer) clearTimeout(timer);
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("visible");
    timer = setTimeout(() => {
      toast.classList.remove("visible");
      timer = null;
    }, 1200);
  };
})();

// 搜索高亮
const highlightText = (text, query) => {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query);
  const regex = new RegExp(`(${escapeRegex(escapedQuery)})`, "gi");
  return escaped.replace(regex, "<mark>$1</mark>");
};

const escapeHtml = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 过滤感知批量复制
const copyAllCookies = (formatFn) =>
  filteredList.map(formatFn).filter(Boolean).join("\n");

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
    countEl.textContent = `${filtered} / ${total}`;
  } else {
    countEl.textContent = `${total} 个`;
  }
};

// 格式化过期时间
const formatExpiration = (expirationDate) => {
  if (!expirationDate) return "会话结束";
  const date = new Date(expirationDate * 1000);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 渲染 Cookie 列表
const renderCookies = (cookies) => {
  const cookiesList = document.getElementById("cookiesList");
  cookiesList.innerHTML = "";

  if (cookies.length > 0) {
    cookies.forEach((cookie, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="cookie-row" data-index="${index}">
          <span class="cookie-name">${highlightText(cookie.name.toUpperCase(), searchQuery)}</span>
          <button class="copy-icon" title="复制值" data-value="${escapeAttr(cookie.value)}">
            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
        </div>
        <div class="cookie-detail">
          <dl>
            <dt>值</dt><dd>${highlightText(cookie.value, searchQuery)}</dd>
            <dt>域名</dt><dd>${escapeHtml(cookie.domain)}</dd>
            <dt>路径</dt><dd>${escapeHtml(cookie.path)}</dd>
            <dt>过期</dt><dd>${escapeHtml(formatExpiration(cookie.expirationDate))}</dd>
            <dt>安全</dt><dd>${cookie.secure ? "是" : "否"}</dd>
            <dt>HttpOnly</dt><dd>${cookie.httpOnly ? "是" : "否"}</dd>
            <dt>SameSite</dt><dd>${escapeHtml(cookie.sameSite)}</dd>
          </dl>
        </div>
      `;
      cookiesList.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.classList.add("empty-state");
    li.innerHTML = `
      <div class="cookie-row">
        <span class="cookie-name">${cookieList.length > 0 ? "无匹配结果" : "当前页面无 Cookie"}</span>
      </div>
    `;
    cookiesList.appendChild(li);
  }
};

const escapeAttr = (str) =>
  str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 搜索过滤
const filterCookies = (query) => {
  searchQuery = query.toLowerCase().trim();
  if (!searchQuery) {
    filteredList = cookieList;
    renderCookies(filteredList);
    updateCookieCount(cookieList.length);
    return;
  }
  filteredList = cookieList.filter((c) =>
    c.name.toLowerCase().includes(searchQuery) ||
    c.value.toLowerCase().includes(searchQuery)
  );
  renderCookies(filteredList);
  updateCookieCount(cookieList.length, filteredList.length);
};

// 导出 JSON 文件
const exportJson = (hostname) => {
  const data = filteredList.map((c) => ({
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
  showToast("已导出 JSON");
};

const init = () => {
  initTheme();

  let hostname = "";

  chrome.tabs.query(
    { active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
    (tabs) => {
      const { url } = tabs[0];
      hostname = new URL(url).hostname;

      document.getElementById("title").innerText = hostname;

      chrome.cookies.getAll({ url }, (cookies) => {
        cookieList = cookies.filter((item) => item.domain === hostname);
        filteredList = cookieList;
        renderCookies(filteredList);
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

  // 点击 cookie 行：展开/收起详情，或点击 copy 按钮
  cookiesListEl.addEventListener("click", (e) => {
    const copyBtn = e.target.closest(".copy-icon");
    if (copyBtn) {
      e.stopPropagation();
      const value = copyBtn.getAttribute("data-value");
      copy(value);
      showToast("已复制");
      return;
    }

    const cookieRow = e.target.closest(".cookie-row");
    if (!cookieRow) return;

    const li = cookieRow.closest("li");
    if (!li || li.classList.contains("empty-state")) return;

    const wasExpanded = li.classList.contains("expanded");
    cookiesListEl.querySelectorAll("li.expanded").forEach((el) => el.classList.remove("expanded"));
    if (!wasExpanded) li.classList.add("expanded");
  });

  copyAll.addEventListener("click", () => {
    const text = copyAllCookies(formats.copyAll);
    if (text) {
      copy(text);
      showToast("已复制全部");
    }
  });

  copyAllKey.addEventListener("click", () => {
    const text = copyAllCookies(formats.copyAllKey);
    if (text) {
      copy(text);
      showToast("已复制键名");
    }
  });

  copyAllValue.addEventListener("click", () => {
    const text = copyAllCookies(formats.copyAllValue);
    if (text) {
      copy(text);
      showToast("已复制值");
    }
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

let time = null,
  allTime = null,
  allKeyTime = null,
  allValueTime = null,
  myUrlList;

let successObject = {
  text: "复制成功",
  color: "var(--btn-text-success-color)",
};

const init = () => {
  getHtml();
  setCopy();
};

const copy = (text) => {
  navigator.clipboard?.writeText && navigator.clipboard.writeText(text);
};

const getHtml = () => {
  const cookiesList = document.getElementById("cookiesList");
  const hostnm = document.getElementById("hostnm");
  const title = document.getElementById("title");
  let html = "";
  document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query(
      { active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
      function (tabs) {
        const { origin, hostname, url, domain } = new URL(tabs[0].url);
        title.innerText = `当前页面：${hostname}`;
        chrome.cookies.getAll({ url }, (cookies) => {
          myUrlList = cookies.filter((item) => item.domain === hostname);
          console.log(myUrlList);

          if (myUrlList.length > 0) {
            /**<button class="value" title="${value}">点击复制</button> */
            /**<div class="name" title="${value}">${name}</div> */
            myUrlList.forEach(({ name, value }) => {
              html += `<li title="${value}">${name.toUpperCase()}</li>`;
            });
          }

          cookiesList.innerHTML = html;
        });
      }
    );
  });
};

const setCopy = () => {
  const cookiesListClickAddEventListener =
    document.getElementById("cookiesList");
  const copyAll = document.getElementById("copyAll");
  const copyAllKey = document.getElementById("copyAllKey");
  const copyAllValue = document.getElementById("copyAllValue");
  const allBtn = document.getElementById("allBtn");

  cookiesListClickAddEventListener.addEventListener("click", (e) => {
    const textContent = e.target.textContent;
    if (e.target.title) copy(e.target.title);

    // e.target.style.color = "greenyellow";
    e.target.style.color = successObject.color;
    e.target.innerText = successObject.text;
    // e.target.style.pointerEvents = 'none'

    time = setTimeout(() => {
      e.target.style.color = "var(--text-color)";
      e.target.innerText = textContent;
      // e.target.style.pointerEvents = 'auto'
    }, 1000);
  });

  copyAll.addEventListener("click", () => {
    let all = "";
    if (allTime) {
      clearTimeout(allTime);
      allTime = null;
    }

    myUrlList.forEach(({ name, value }) => {
      all += `${name}:${value};\n`;
    });

    if (all) copy(all);

    copyAll.innerText = successObject.text;
    // copyAll.classList.add("disable");
    copyAll.style.color = successObject.color;
    copyAll.setAttribute("disable", true);
    copyAll.style.cursor = "not-allowed";
    copyAll.style.transform = "translateY(0)";

    allTime = setTimeout(() => {
      copyAll.innerText = "Copy All";
      copyAll.style.color = "var(--btn-text-color)";
      // copyAll.removeAttribute("disable");
      copyAll.style.cursor = "pointer";
      copyAll.style.transform = "translateY(1px)";
      copyAll.classList.remove("disable");
      clearTimeout(allTime);
    }, 1000);
  });

  copyAllKey.addEventListener("click", () => {
    let allKey = "";
    if (allKeyTime) {
      clearTimeout(allKeyTime);
      allKeyTime = null;
    }
    myUrlList.forEach(({ name, value }) => {
      allKey += `${name};\n`;
    });

    if (allKey) copy(allKey);

    copyAllKey.innerText = successObject.text;
    // copyAll.classList.add("disable");
    copyAllKey.style.color = successObject.color;
    copyAllKey.setAttribute("disable", true);
    copyAllKey.style.cursor = "not-allowed";
    copyAllKey.style.transform = "translateY(0)";

    allKeyTime = setTimeout(() => {
      copyAllKey.innerText = "Copy All Key";
      copyAllKey.style.color = "var(--btn-text-color)";
      // copyAll.removeAttribute("disable");
      copyAllKey.style.cursor = "pointer";
      copyAllKey.style.transform = "translateY(1px)";
      copyAllKey.classList.remove("disable");
      clearTimeout(allKeyTime);
    }, 1000);
  });

  copyAllValue.addEventListener("click", () => {
    let allValue = "";
    if (allValueTime) {
      clearTimeout(allValueTime);
      allValueTime = null;
    }
    myUrlList.forEach(({ name, value }) => {
      allValue += `${value};\n`;
    });

    if (allValue) copy(allValue);

    copyAllValue.innerText = successObject.text;
    // copyAll.classList.add("disable");
    copyAllValue.style.color = successObject.color;
    copyAllValue.setAttribute("disable", true);
    copyAllValue.style.cursor = "not-allowed";
    copyAllValue.style.transform = "translateY(0)";

    allValueTime = setTimeout(() => {
      copyAllValue.innerText = "Copy All Key";
      copyAllValue.style.color = "var(--btn-text-color)";
      // copyAll.removeAttribute("disable");
      copyAllValue.style.cursor = "pointer";
      copyAllValue.style.transform = "translateY(1px)";
      copyAllValue.classList.remove("disable");
      clearTimeout(allValueTime);
    }, 1000);
  });
};

init();

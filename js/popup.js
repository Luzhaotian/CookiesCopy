let time = null

const init = () => {
  getHtml();
  setCopy()
};



const copy = (text) => {
  navigator.clipboard?.writeText && navigator.clipboard.writeText(text);
}



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
          const myUrlList = cookies.filter((item) => item.domain === hostname);
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
  const cookiesListClickAddEventListener = document.getElementById("cookiesList");

  cookiesListClickAddEventListener.addEventListener('click', (e) => {
    // console.dir(e.target);
    const textContent = e.target.textContent
    if (e.target.title)
      copy(e.target.title)

    e.target.style.color = 'greenyellow'
    e.target.innerText = '复制成功'

    time = setTimeout(() => {
      e.target.style.color = 'var(--text-color)'
      e.target.innerText = textContent
    }, 1000)
  })

};

init();

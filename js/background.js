const color = "rgba(153, 196, 230, 0.2)";

// chorme.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === "get-color") {
//     sendResponse(color);
//   }
// });

chrome.runtime.onInstalled.addListener(() => {
  // const cookiesList = document.getElementById('cookiesList');
  // console.log(cookiesList);
  chrome.storage.sync.set({ color }, function () {
    console.log(`[Coloring] default color is set to ${color}`)
  });
})

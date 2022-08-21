/// <reference path="../chrome.d.ts" />

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query(
    { url: chrome.runtime.getURL("main.html") },
    async (tabs) => {
      console.log(tabs);
      //switch to the tab
      if (tabs.length)
        chrome.tabs.highlight({ tabs: [tabs[0].index] }, () => {});
      else {
        const tab = await chrome.tabs.create({
          url: chrome.runtime.getURL("main.html"),
          selected: true,
        });
      }
    }
  );
});

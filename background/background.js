/// <reference path="../chrome.d.ts" />
import { appUtils } from "../lib/utils.js";

chrome.runtime.onInstalled.addListener(async () => {
  const pages = (await appUtils.loadFromLocal(["pages"])?.pages) || [];
  if (!pages.length)
    await appUtils.saveToLocal({
      pages: [...pages, { id: Date.now(), title: "Page 1" }],
    });
});

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

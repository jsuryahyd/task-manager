/// <reference path="../chrome.d.ts" />
import { appUtils } from "../lib/utils.js";

chrome.runtime.onInstalled.addListener(async () => {
  const pages = (await appUtils.loadFromLocal(["pages"]))?.pages || [];
  if (!pages.length)
    await appUtils.saveToLocal({
      pages: [...pages, { id: Date.now(), title: "Page 1" }],
    });
});

chrome.action.onClicked.addListener((tab) => {
  showExtensionPage();
});

function showExtensionPage() {
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
}

chrome.alarms.onAlarm.addListener(async (alarmInfo) => {
  const alarmNotes =
    (await appUtils.loadFromLocal(["alarmNotes"])).alarmNotes || {};
  const notificationDetails = {
    type: "basic",
    title: alarmInfo.name,
    message: "Pop Pop!!!",
    iconUrl: chrome.runtime.getURL("../assets/list.png"),
  };
  if (alarmNotes[alarmInfo.name]) {
    alarmInfo.name.split("__")[0] &&
      (notificationDetails.title = alarmInfo.name.split("__")[0]);
    notificationDetails.message = alarmNotes[alarmInfo.name].notes;
  }
  // showExtensionPage();
  chrome.notifications.create("", notificationDetails, (notificationId) => {
    console.log(notificationId);
  });

  chrome.tabs.query(
    { url: chrome.runtime.getURL("main.html") },
    async (tabs) => {
      let page = null;
      console.log(tabs);
      //switch to the tab
      if (tabs.length) {
        page = tabs[0].id;
        chrome.tabs.highlight({ tabs: [tabs[0].index] }, () => {});
      } else {
        page = await chrome.tabs.create({
          url: chrome.runtime.getURL("main.html"),
          selected: true,
        });
      }

      setTimeout(() => {
        chrome.runtime.sendMessage(
          {
            msg: "alarm-bajao",
            alarmInfo, //: { ...alarmInfo, name: alarmInfo.name.split("__")[0] },
          },
          (response) => {
            if (chrome.runtime.lastError)
              return console.log(chrome.runtime.lastError);
            console.log(response);
          }
        );
      }, 300);//this will wait until page load, but on page load, the alarm card will not even be added.
    }
  );
});

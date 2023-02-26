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
  if (Date.now() - alarmInfo.scheduledTime > 5 * 60 * 1000) return; //dont ring alarm, if the scheduledTime is older than 5 mins.(browser/system is opened a lot of time after the scheduled time.)
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
      }, 300); //todo: this will wait until page load, but on page load, the alarm card will not even be added.
    }
  );
});

//read all deleted  items
async function cleanup() {
  const { pages = [] } = await appUtils.loadFromLocal(["pages"]);
  console.log(pages);
  const toBeRemoved = [];
  const pagesTobekept = pages.filter((p) => {
    const toBeKept =
      !p.deletedOn || Date.now() - p.deletedOn < 30 * 24 * 60 * 60 * 1000;
    if (!toBeKept) toBeRemoved.push(p.id);
    return toBeKept;
  });
  await Promise.all(
    toBeRemoved.map((id) => {
      return chrome.storage.local.remove("page--" + id);
    })
  );
  appUtils.saveToLocal({ pages: pagesTobekept });
  //todo: download the content before deleting
  //todo: send message to foreground and show a toast
  console.log("cleanup cleared " + toBeRemoved.length + " items");
}

cleanup();

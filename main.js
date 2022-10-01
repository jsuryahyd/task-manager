//global document
///<reference path="./chrome.d.ts" />
import { appUtils } from "./lib/utils.js";
import { appNavigator } from "./lib/Navigator.js";
import { Accordion } from "./lib/accordion.js";
async function saveToSync(e) {
  // console.log(e);

  const newlyaddedLine = e.target.querySelector(":last-child");

  if (newlyaddedLine) {
    newlyaddedLine.classList.add("item");
    newlyaddedLine.setAttribute("data-item-id", (() => Date.now())());
  }

  if (e.target.lastElementChild?.innerHTML !== "<br>") {
    //add extraempty line to escape from codeblocks or so, by clicking down arrow
    const extraLine = document.createElement("div");
    extraLine.setAttribute("data-item-id", (() => Date.now() + "")());
    extraLine.classList.add("item");
    e.target.appendChild(extraLine);
    extraLine.innerHTML = "<br />";
  }

  // if (newlyaddedLine.innerText.startsWith("- ")) {
  //   const li = document.createElement("li");
  //   li.classList.add("item");
  //   li.setAttribute(
  //     "data-item-id",
  //     newlyaddedLine.getAttribute("data-item-id")
  //   );
  //   li.innerHTML = newlyaddedLine.innerHTML;
  //   e.target.appendChild(li);
  //   e.target.removeChild(newlyaddedLine);
  // }

  // const tabs = await chrome.tabs.query({
  //   url: chrome.runtime.getURL("main.html"),
  // });
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tabs.length) {
    // chrome.pageCapture.saveAsMHTML(
    //   {
    //     tabId: tabs[0]?.id,
    //   },
    //   (blob) => {
    //     // console.log(blob);
    //   }
    // );
  }
  const id = document
    .getElementById("editor-wrapper")
    ?.getAttribute("data-active-page-id");
  await appUtils.saveToLocal({
    ["page--" + id]: {
      content: e.target.innerHTML,
      contentToDownload:
        e.target.outerHTML +
        [...document.getElementsByTagName("style")]
          .map((s) => s.outerHTML)
          .join(""),
    },
  }); //+[...document.getElementsByTagName('style')].map(s=>s.outerHTML)
}
appUtils.loadFromLocal(["ui-theme"]).then((data) => {
  document.body.setAttribute("data-theme", data["ui-theme"] || "dark");
});

document.addEventListener("DOMContentLoaded", () => {
  appNavigator.init();
  Accordion({ accordionId: "pages" })?.expand();
  Accordion({ accordionId: "recycle-bin" });
  //get all pages
  reconcilePages();

  document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
    document.body.setAttribute("data-theme", "dark");
    appUtils.saveToLocal({ "ui-theme": "dark" });
  });
  document
    .getElementById("light-mode-toggle")
    ?.addEventListener("click", () => {
      document.body.setAttribute("data-theme", "light");
      appUtils.saveToLocal({ "ui-theme": "light" });
    });

  // blur keyup paste

  document
    .getElementById("downloadContent")
    ?.addEventListener("click", downloadContent);

  document.getElementById("add-page-btn")?.addEventListener("click", addPage);

  showAlarms();
  const alarmFormDialog = document.getElementById("alarm-dialog");
  document.getElementById("add-alarm-btn")?.addEventListener("click", () => {
    alarmFormDialog?.showModal?.();
  });
  alarmFormDialog?.addEventListener("close", async (e) => {
    // console.log(e.target.returnValue);
    if (e.target.returnValue === "default") {
      const formData = new FormData(e.target.firstElementChild);
      const formValues = {};
      for (let [name, value] of formData) {
        formValues[name] = value;
      }
      e.target.firstElementChild.reset();
      if (!formValues["alarm-at"] && !formValues["alarm-series-at"]) {
        e.preventDefault();
        alert("enter time");
      }

      const alarmId = formValues.title + "__" + Date.now();

      const alarmNotes =
        (await appUtils.loadFromLocal(["alarmNotes"])).alarmNotes || {};
      appUtils.saveToLocal({
        alarmNotes: { ...alarmNotes, [alarmId]: { ...formValues } },
      });
      if (formValues["alarm-at"]) {
        chrome.alarms.create(alarmId, {
          when: new Date(formValues["alarm-at"]).getTime(),
        });
      } else if (formValues["alarm-series-at"]) {
        const [hrs, mins] = formValues["alarm-series-at"].split(":");
        const todayAtGivenTime = new Date();
        todayAtGivenTime.setHours(+hrs);
        todayAtGivenTime.setMinutes(+mins);
        const firstOccurence = (
          appUtils.minutesOfDay(new Date()) >
          appUtils.minutesOfDay(todayAtGivenTime)
            ? (() => {
                todayAtGivenTime.setDate(new Date().getDate() + 1);
                return todayAtGivenTime; //tomorrow at given time
              })()
            : todayAtGivenTime
        ).getTime();
        chrome.alarms.create(alarmId, {
          periodInMinutes: 1440, //delay since the first alarm
          when: firstOccurence, //first alarm
        });
      }

      showAlarms();
    }
  });
  document.body.addEventListener("click", (e) => {
    const deleteAlarmId = e.target.getAttribute("data-delete-alarm");
    if (deleteAlarmId) {
      clearAlarm(deleteAlarmId);
      showAlarms();
    }

    if (e.target?.classList?.contains("alarm-icon")) {
      // e.target.parentElement.getAttribute('data-id')
      e.target?.closest("alarm-card")?.classList?.remove("ringing");
      document.getElementById("audioPlayer")?.pause();
      showAlarms();
    }
  });
  // document.getElementById("alarm-form").onsubmit = (e) => {
  //   e.preventDefault();
  //   const formData = new FormData(e.target);
  //   for (let [name, value] of formData) {
  //     console.log(name, value);
  //   }
  //   alarmFormDialog?.close?.();
  // };

  document
    .getElementById("cancel-alarm-form")
    ?.addEventListener("click", () => {
      alarmFormDialog?.firstElementChild.reset();
      alarmFormDialog?.close?.(); //invalid form doesnot close with default functionality
    });
});

async function downloadContent() {
  const a = document.createElement("a");
  a.download = "content.json";
  const pages = (await appUtils.loadFromLocal(["pages"])).pages || [];
  const pageContents = await appUtils.loadFromLocal(
    pages.map((p) => "page--" + p.id)
  );
  const payload = {
    pages,
    pageContents: Object.entries(pageContents).reduce((acc, [key, p]) => {
      acc[key.replace(/^page--/, "")] = p.contentToDownload;
      return acc;
    }, {}),
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  );
  console.log(payload);
  a.href = url;
  // a.href = "data:text/html;charset=utf-8" + encodeURIComponent(content);

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

async function addPage() {
  //add to aside menu
  const parent = document.getElementById("page-buttons-list");
  const numPages = (parent?.children?.length || 1) - 1;
  const id = Date.now();
  const title = `Page ${numPages + 1}`;
  //add to storage
  const pages = (await appUtils.loadFromLocal(["pages"]))?.pages || [];
  await appUtils.saveToLocal({ pages: [...pages, { id, title }] });
  reconcilePages({ newPage: true });

  showPage(id);
}

async function reconcilePages(options = {}) {
  const { newPage } = options;

  const pages = (await appUtils.loadFromLocal(["pages"]))?.pages || [];

  const editorWrapper = document.getElementById("editor-wrapper");
  const buttonsList = document.getElementById("page-buttons-list");
  let firstPageIdx = true;
  pages.sort().forEach((p, idx) => {
    const existingEditor = document.querySelector(
      '.editor[data-page-id="' + p.id + '"]'
    );
    const existingButton = document.querySelector(
      '.page-title[data-id="' + p.id + '"]'
    );
    if (p.deletedOn) {
      if (existingEditor) existingEditor.contentEditable = false;
      //   existingEditor.parentElement?.removeChild(existingEditor);
      if (existingButton) {
        existingButton.parentElement?.removeChild(existingButton);
        // document.getElementById('trash-files-buttons-list').
      }
      addTrashFileBtn(p);
      return;
    }

    if (existingEditor) {
      return;
    }
    const editor = document.createElement("div");
    editor.contentEditable = p.deletedOn ? "false" : "true";
    editor?.setAttribute("data-page-id", p.id);
    editor.classList.add("editor");
    idx === 0 && editorWrapper?.setAttribute("data-active-page-id", p.id);
    editorWrapper?.appendChild(editor);
    editor.addEventListener("input", appUtils.debounce(saveToSync, 500));
    chrome.storage.local.get(["page--" + p.id], (pageObj) => {
      const pageDetails = pageObj["page--" + p.id];
      if (!pageDetails)
        return console.log("no content with id", ["page--" + p.id], pageObj);
      editor.innerHTML = pageDetails.content || "";
    });
    if (!existingButton) {
      addButton(p, buttonsList, newPage);
    }
    if (newPage || firstPageIdx) {
      showPage(p.id);
      firstPageIdx = false;
    }
  });

  //update buttons
}

function renderTrashFiles(p) {}

function addButton({ id, title }, parentEl, isEditing) {
  const li = document.createElement("li");
  li.classList.add("page-title");
  if (isEditing) {
    li.classList.add("editing");
  }
  li.setAttribute("data-id", id);
  document
    .getElementById("page-buttons-list")
    ?.insertBefore(li, parentEl?.lastElementChild);

  const input = document.createElement("input");
  input.type = "text";
  input.value = title;
  li.innerHTML = `<div class='row'>
  <div class="nine columns" >
  
  </div>
  <div class="three columns"></div>
  </div>`;
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-page-btn");
  deleteBtn.innerHTML = `<img src="assets/delete.png" />`;
  deleteBtn.onclick = (e) =>
    deletePage(e.target?.closest("li")?.getAttribute("data-id"));
  li.firstElementChild?.firstElementChild?.nextElementSibling?.appendChild(
    deleteBtn
  );
  li.firstElementChild?.firstElementChild?.appendChild(input);
  input.onblur = onChangeComplete;

  async function onChangeComplete(e) {
    const pages = (await appUtils.loadFromLocal(["pages"])).pages;
    const page = pages.find((p) => p.id === id);
    if (page) {
      page.title = e.target.value;
      await appUtils.saveToLocal({ pages }); //mutated pages
    }
    return li.classList.remove("editing");
  }

  input.onkeyup = (e) => {
    if (e.key === "Enter") {
      onChangeComplete(e);
    }
  };

  const button = document.createElement("button");
  button.textContent = title;
  li.firstElementChild?.firstElementChild?.appendChild(button);

  button.classList.add("u-full-width");
  button.ondblclick = (e) => li.classList.add("editing");
  button.onclick = function (e) {
    showPage(e.target?.closest("li")?.getAttribute("data-id"));
  };

  button.setAttribute("data-route-goto", "active-editors");

  input.onchange = (e) => {
    button.textContent = e.target.value;
  };
  requestAnimationFrame(() => {
    input.focus();
  });
}

function addTrashFileBtn(p) {
  console.log(p);

  const li = document.createElement("li");
  li.classList.add("page-title");
  li.setAttribute("data-id", p.id);
  document
    .getElementById("trash-files-buttons-list")
    ?.insertAdjacentElement("afterbegin", li);

  li.innerHTML = `<div class='row'>
    <div class="nine columns" >
    
    </div>
    <div class="three columns"></div>
    </div>`;

  // const deleteBtn = document.createElement("button");
  // deleteBtn.classList.add("delete-page-btn");
  // deleteBtn.innerHTML = `<img src="assets/delete.png" />`;
  // deleteBtn.onclick = (e) =>
  //   deletePage(e.target?.closest("li")?.getAttribute("data-id"));
  // li.firstElementChild?.firstElementChild?.nextElementSibling?.appendChild(
  //   deleteBtn
  // );

  const button = document.createElement("button");
  button.textContent = p.title;
  button.classList.add("u-full-width");
  li.firstElementChild?.firstElementChild?.appendChild(button);
  button.ondblclick = (e) => li.classList.add("editing");
  button.onclick = function (e) {
    showPage(p.id);
  };

  button.setAttribute("data-route-goto", "active-editors");

  const restoreButton = document.createElement("button");
  restoreButton.classList.add("delete-page-btn");
  restoreButton.innerHTML = `<img src="assets/history.png" />`;
  restoreButton.onclick = (e) => restorePage(p.id);
  li.firstElementChild?.firstElementChild?.nextElementSibling?.appendChild(
    restoreButton
  );
}

function showPage(id) {
  if (!id) throw "invalid id passed :" + id;
  document
    .getElementById("editor-wrapper")
    ?.setAttribute("data-active-page-id", id);
  [...document.getElementsByClassName("editor")].forEach((editor) =>
    editor.classList.remove("show")
  );
  document
    .querySelector('.editor[data-page-id="' + id + '"]')
    ?.classList.add("show");
}

const toastService = {
  show: alert,
};

async function deletePage(id) {
  const pages = (await appUtils.loadFromLocal(["pages"]))?.pages || [];
  const pageToBeDeleted = pages.find((p) => p.id === +id);
  if (!pageToBeDeleted) return toastService.show("no such page");
  pageToBeDeleted.deletedOn = Date.now();

  await appUtils.saveToLocal({ pages });
  reconcilePages();
}

async function restorePage(id) {
  const pages = (await appUtils.loadFromLocal(["pages"]))?.pages || [];
  const pageToBeRestored = pages.find((p) => p.id === +id);
  if (!pageToBeRestored) return toastService.show("no such page");
  delete pageToBeRestored.deletedOn;

  await appUtils.saveToLocal({ pages });
  reconcilePages();
}

/**
 *
 */
function showAlarms() {
  chrome.alarms.getAll((alarms) => {
    // console.log(alarms);

    const recurringListUI = document.getElementById("recurring-alarms-list");
    const oneOfflistUI = document.getElementById("oneOff-alarms-list");
    if (!recurringListUI)
      return console.error(
        "no element with id - recurring-alarms-list",
        recurringListUI
      );
    if (!oneOfflistUI)
      return console.error(
        "no element with id - recurring-alarms-list",
        oneOfflistUI
      );

    recurringListUI.innerHTML = "";
    oneOfflistUI.innerHTML = "";

    const { recurring, oneOff } = alarms.reduce(
      (
        /** @type {{recurring:chrome.alarms.Alarm[],oneOff:chrome.alarms.Alarm[]}} */ acc,
        item
      ) => {
        item.periodInMinutes
          ? acc["recurring"].push(item)
          : acc["oneOff"].push(item);
        return acc;
      },
      { recurring: [], oneOff: [] }
    );

    chrome.storage.local.get(["alarmNotes"], ({ alarmNotes = {} }) => {
      recurring.forEach((r) => {
        recurringListUI.innerHTML += `<div class="alarm-card" data-id="${
          r.name
        }">
        <img src="${chrome.runtime.getURL(
          "./assets/alarm-clock.png"
        )}" class="alarm-icon"/>
      <p>title: ${r.name.split("__")[0]} </p>
      <p>time:  ${
        "Everyday " +
        (new Date(r.scheduledTime).getHours() +
          ":" +
          new Date(r.scheduledTime).getMinutes())
      } </p>
      <p>notes: ${alarmNotes[r.name].notes}</p>
      <div><button data-delete-alarm="${
        r.name
      }">Delete</button> <button>Edit</button></div></div>`;
      });
      oneOff.forEach((r) => {
        oneOfflistUI.innerHTML += `
      <div class="alarm-card" data-id="${r.name}">
        <img src="${chrome.runtime.getURL(
          "./assets/alarm-clock.png"
        )}" class="alarm-icon"/>
        <p>title: ${r.name.split("__")[0]} </p>
        <p>time: ${new Date(r.scheduledTime)} </p>
        <p>notes: ${alarmNotes[r.name].notes}</p>
      <div><button data-delete-alarm="${
        r.name
      }">Delete</button> <button>Edit</button>
      </div>
      </div>`;
      });
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  appNavigator.navigate("alarms");
  if (message.msg === "alarm-bajao") {
    const card = document.querySelector(
      '[data-id="' + message.alarmInfo.name + '"]'
    );

    if (card) {
      card.classList.add("ringing");
      sendResponse("Wa kkay");
      /**
       * @type {HTMLAudioElement}
       */
      const audioPlayer = document.getElementById("audioPlayer");
      audioPlayer?.play();
    } else console.error("no card with id", message.alarmInfo.name);
  }
});

async function clearAlarm(deleteAlarmId) {
  chrome.alarms.clear(deleteAlarmId);
 
  chrome.alarms.getAll(async(alarms)=>{
    const alarmNotes = (await appUtils.loadFromLocal(["alarmNotes"])).alarmNotes || {};
    // console.log(alarms)
    const newAlarmNotes = {}
    //only keep the existing alarms' notes
    for(let alarm of alarms){
      if(alarmNotes[alarm.name]){
        newAlarmNotes[alarm.name] = alarmNotes[alarm.name]
      }
    }
    appUtils.saveToLocal({
      alarmNotes: newAlarmNotes
    });
  })
}

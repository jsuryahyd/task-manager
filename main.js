//global document
///<reference path="./chrome.d.ts" />
import { appUtils } from "./lib/utils.js";
import { appNavigator } from "./lib/Navigator.js";
import { Accordion } from "./lib/accordion.js";
import { AlarmDialog } from "./components/AlarmDialog.js";
import { replaceWithCodeBlocks } from "./components/SimpleEditor.js";
import { createEffect, createSignal } from "./lib/solidjs/solid.js";
import { addEditor } from "./components/editorjsEditor.js";
// import { component, render } from "./lib/tomato/component.js";
// import { createBlock } from "./node_modules/blockdom/dist/index.js";
// import { html } from "./lib/tomato/html.js";

const [pages, setPages] = createSignal();
createEffect(() => {
  (async () => {
    reconcilePages(pages());
    reconcileSideMenu(pages());
  })();
});
const [currentPageId, setCurrentPageId] = createSignal(null);
createEffect(() => {
  currentPageId() && showPage(currentPageId());
});

// function Main(render){

//   return ()=>html`<div>${component(Child,["cherry-tomato"])}</div>`
// }

// function Child(render){
//   return (name)=>createBlock(`<p>Hello <block-text-0 /></p>`)(name)
// }
// render(Main,document.body)

function getCaretPosition(editableDiv) {
  var caretPos = 0,
    sel,
    range;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      if (range.commonAncestorContainer.parentNode == editableDiv) {
        caretPos = range.endOffset;
      }
    }
  } else if (document.selection && document.selection.createRange) {
    range = document.selection.createRange();
    if (range.parentElement() == editableDiv) {
      var tempEl = document.createElement("span");
      editableDiv.insertBefore(tempEl, editableDiv.firstChild);
      var tempRange = range.duplicate();
      tempRange.moveToElementText(tempEl);
      tempRange.setEndPoint("EndToEnd", range);
      caretPos = tempRange.text.length;
    }
  }
  return caretPos;
}

async function saveToSync(e) {
  console.log(e);
  console.log(getCaretPosition(e.target));
  const newlyaddedLine = e.target.querySelector("div[data-item-id]:last-child");

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

  replaceWithCodeBlocks(e);

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
      // contentToDownload:
      //   e.target.outerHTML +
      //   [...document.getElementsByTagName("style")]
      //     .map((s) => s.outerHTML)
      //     .join(""),
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
  appUtils
    .loadFromLocal(["pages"])
    .then((r) => {
      setPages(r?.pages || []);
      setCurrentPageId(r.pages[0]?.id + "");
    })
    .catch((e) => {
      console.error(e);
    });

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

  document.getElementById("add-page-btn")?.addEventListener("click", () => {
    addPage();
  });

  document
    .getElementById("add-editorjs-editor")
    ?.addEventListener("click", () => {
      addPage("editorjs");
    });

  const alarmDialog = AlarmDialog({
    dialogId: "alarm-dialog",
    appUtils,
    refreshAlarmsInUI: showAlarms,
  });
  showAlarms();
  document
    .getElementById("add-alarm-btn")
    ?.addEventListener("click", alarmDialog.showDialog);

  document.body.addEventListener("click", (e) => {
    const deleteAlarmId = e.target.getAttribute("data-delete-alarm");
    if (deleteAlarmId) {
      clearAlarm(deleteAlarmId);
      showAlarms();
    }

    const editAlarmId = e.target.getAttribute("data-edit-alarm");
    if (editAlarmId) {
      chrome.alarms.get(
        editAlarmId,
        async (/** @type {chrome.alarms.Alarm} */ alarmInfo) => {
          const { alarmNotes } =
            (await appUtils.loadFromLocal(["alarmNotes"])) || {};
          const alarmDetails = alarmNotes[editAlarmId];
          console.log(alarmDetails);
          const details = {
            title: alarmDetails.title,
            isRecurring: alarmDetails.isRecurring,
            "alarm-at": alarmDetails["alarm-at"],
            "alarm-series-at": alarmDetails["alarm-series-at"],
            notes: alarmDetails.notes,
          };
          alarmDialog.showDialog({ ...details, editAlarmId });
        }
      );
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
    ?.addEventListener("click", alarmDialog.close);
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
      acc[key.replace(/^page--/, "")] = p.content;
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

async function addPage(editorLib) {
  //add to aside menu
  const parent = document.getElementById("page-buttons-list");
  const numPages = (parent?.children?.length || 1) - 1;
  const id = Date.now();
  const title = `Page ${numPages + 1}`;
  //add to storage
  const newPage = { id, title, editorLib };
  const pages = (await appUtils.loadFromLocal(["pages"]))?.pages || [];

  await appUtils.saveToLocal({ pages: [...pages, newPage] });
  setPages([...pages, { ...newPage, editingTitle: true }]);
  requestAnimationFrame(() => {
    setCurrentPageId(id + "");
  });
}

function reconcileSideMenu(pages) {
  const buttonsList = document.getElementById("page-buttons-list");
  (pages || []).sort().forEach((p, idx) => {
    const existingButton = document.querySelector(
      '#page-buttons-list .page-title[data-id="' + p.id + '"]'
    );
    const existingTrashedButton = document.querySelector(
      '#trash-files-buttons-list .page-title[data-id="' + p.id + '"]'
    );
    if (p.deletedOn) {
      if (existingButton)
        existingButton.parentElement?.removeChild(existingButton);
      addTrashFileBtn(p);
      // document.getElementById('trash-files-buttons-list').
    } else {
      addButton(p);

      if (existingTrashedButton)
        existingTrashedButton.parentElement?.removeChild(existingTrashedButton);
    }
  });
}

async function reconcilePages(pages, options = {}) {
  const { newPage } = options;

  const editorWrapper = document.getElementById("editor-wrapper");

  (pages || []).sort().forEach((p, idx) => {
    const existingEditor = document.querySelector(
      '.editor[data-page-id="' + p.id + '"]'
    );

    if (existingEditor) {
      //todo:update editable status.
      return (existingEditor.contentEditable = p.deletedOn ? "false" : "true");
    }

    const editor = document.createElement("div");
    editor?.setAttribute("data-page-id", p.id);
    editor.classList.add("editor");

    idx === 0 && editorWrapper?.setAttribute("data-active-page-id", p.id);

    editorWrapper?.appendChild(editor);

    if (p.editorLib === "editorjs") {
      chrome.storage.local.get(["page--" + p.id], (pageObj) => {
        const pageDetails = pageObj["page--" + p.id];
        if (!pageDetails) {
          addEditor(editor);
          return console.log("no content with id", ["page--" + p.id], pageObj);
        }
        addEditor(editor, pageDetails.content);
      });
      editor.classList.add('editorjs-container')
    } else if (p.editorLib === "simple-editor" || !p.editorLib) {
      editor.addEventListener("input", appUtils.debounce(saveToSync, 500));
      editor.contentEditable = p.deletedOn ? "false" : "true";
      chrome.storage.local.get(["page--" + p.id], (pageObj) => {
        const pageDetails = pageObj["page--" + p.id];
        if (!pageDetails)
          return console.log("no content with id", ["page--" + p.id], pageObj);
        editor.innerHTML = pageDetails.content || "";
      });
    }
  });

  //todo: update buttons
}

function renderTrashFiles(p) {}

function addButton({ id, title }, parentEl, isEditing) {
  const existingButton = document.querySelector(
    '#page-buttons-list .page-title[data-id="' + id + '"]'
  );
  if (existingButton) return;
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
    if (!e.target.value) return;
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
    setCurrentPageId(e.target?.closest("li")?.getAttribute("data-id"));
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
  const existingButton = document.querySelector(
    '#trash-files-buttons-list .page-title[data-id="' + p.id + '"]'
  );
  if (existingButton) return;

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
  //hide other pages and show this one
  document
    .getElementById("editor-wrapper")
    ?.setAttribute("data-active-page-id", id);
  [...document.getElementsByClassName("editor")].forEach((editor) =>
    editor.dataset.pageId + "" === id + ""
      ? editor?.classList.add("show")
      : editor.classList.remove("show")
  );
  //highlight the corresponding button
  [
    ...document
      .getElementById("page-buttons-list")
      .querySelectorAll("[data-id]"),
  ].forEach((el) => {
    el.dataset.id === id
      ? el.classList.add("active")
      : el.classList.remove("active");
  });
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
  setPages(pages);
}

async function restorePage(id) {
  const pages = (await appUtils.loadFromLocal(["pages"]))?.pages || [];
  const pageToBeRestored = pages.find((p) => p.id === +id);
  if (!pageToBeRestored) return toastService.show("no such page");
  delete pageToBeRestored.deletedOn;

  await appUtils.saveToLocal({ pages });
  setPages(pages);
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
      }">Delete</button> <button data-edit-alarm="${
          r.name
        }">Edit</button></div></div>`;
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

  chrome.alarms.getAll(async (alarms) => {
    const alarmNotes =
      (await appUtils.loadFromLocal(["alarmNotes"])).alarmNotes || {};
    // console.log(alarms)
    const newAlarmNotes = {};
    //only keep the existing alarms' notes
    for (let alarm of alarms) {
      if (alarmNotes[alarm.name]) {
        newAlarmNotes[alarm.name] = alarmNotes[alarm.name];
      }
    }
    appUtils.saveToLocal({
      alarmNotes: newAlarmNotes,
    });
  });
}

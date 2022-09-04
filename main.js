//global document
///<reference path="./chrome.d.ts" />
import { appUtils } from "./lib/utils.js";
import { appNavigator } from "./Navigator.js";
async function saveToSync(e) {
  console.log(e);

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
    chrome.pageCapture.saveAsMHTML(
      {
        tabId: tabs[0]?.id,
      },
      (blob) => {
        console.log(blob);
      }
    );
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

document.addEventListener("DOMContentLoaded", () => {
  appNavigator.init();
  //get all pages
  reconcilePages();

  document
    .getElementById("dark-mode-toggle")
    .addEventListener("click", () =>
      document.body.setAttribute("data-theme", "dark")
    );
  document
    .getElementById("light-mode-toggle")
    .addEventListener("click", () =>
      document.body.setAttribute("data-theme", "light")
    );

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
    console.log(e.target.returnValue);
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

      const alarmId = formValues.name + "__" + Date.now();

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
        todayAtGivenTime.setHours(hrs);
        todayAtGivenTime.setMinutes(mins);
        const firstOccurence = (
          appUtils.minutesOfDay(new Date()) >
          appUtils.minutesOfDay(todayAtGivenTime)
            ? todayAtGivenTime.setDate(new Date().getDate() + 1)
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
      chrome.alarms.clear(deleteAlarmId);
      showAlarms()
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

  // document
  //   .getElementById("cancel-alarm-form")
  //   ?.addEventListener("click", () => {
  //     alarmFormDialog?.close?.();
  //   });
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
      if (existingEditor)
        existingEditor.parentElement?.removeChild(existingEditor);
      if (existingButton)
        existingButton.parentElement?.removeChild(existingButton);

      return;
    }

    if (existingEditor) {
      return;
    }
    const editor = document.createElement("div");
    editor.contentEditable = "true";
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

function addButton({ id, title }, parentEl, isEditing) {
  const li = document.createElement("li");
  li.classList.add("page-title")
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
  
  button.classList.add("u-full-width")
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

/**
 *
 */
function showAlarms() {
  chrome.alarms.getAll((alarms) => {
    console.log(alarms);
    const { recurring, oneOff } = alarms.reduce(
      (acc, item) => {
        item.periodInMinutes
          ? acc["recurring"].push(item)
          : acc["oneOff"].push(item);
        return acc;
      },
      { recurring: [], oneOff: [] }
    );
    document.getElementById(
      "recurring-alarms-list"
    ).innerHTML = ""
      document.getElementById("oneOff-alarms-list").innerHTML = "";


    chrome.storage.local.get(["alarmNotes"], ({ alarmNotes = {} }) => {
      recurring.forEach((r) => {
        document.getElementById(
          "recurring-alarms-list"
        ).innerHTML += `<div class="alarm-card"><div>
      <p>title: ${r.name} </p>
      <p>time:  ${
        "Everyday " +
        (new Date(r.scheduledTime).getHours() +
          ":" +
          new Date(r.scheduledTime).getMinutes())
      } </p>
      <p>notes: ${alarmNotes[r.name].notes}
      </div><div><button data-delete-alarm="${
        r.name
      }">Delete</button> <button>Edit</button></div></div>`;
      });
      oneOff.forEach((r) => {
        document.getElementById("oneOff-alarms-list").innerHTML += `<div class="alarm-card"><div>
<p>title: ${r.name} </p>
<p>time: ${new Date(r.scheduledTime)} </p>
<p>notes: ${alarmNotes[r.name].notes}
</div><div><button data-delete-alarm="${
  r.name
}">Delete</button> <button>Edit</button></div></div>`;
      });
    });
  });
}

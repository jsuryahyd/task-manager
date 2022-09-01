//global document
import { appUtils } from "./lib/utils.js";
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
  //get all pages
  reconcilePages();

  document.getElementById('dark-mode-toggle').addEventListener('click',()=>document.body.setAttribute('data-theme','dark'))
  document.getElementById('light-mode-toggle').addEventListener('click',()=>document.body.setAttribute('data-theme','light'))

  // blur keyup paste

  document
    .getElementById("downloadContent")
    ?.addEventListener("click", downloadContent);

  document.getElementById("add-page-btn")?.addEventListener("click", addPage);
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
}

async function reconcilePages(options = {}) {
  const { newPage } = options;

  const pages = (await appUtils.loadFromLocal(["pages"]))?.pages || [];
  const editorWrapper = document.getElementById("editor-wrapper");
  const buttonsList = document.getElementById("page-buttons-list");

  pages.sort().forEach((p, idx) => {
    if (document.querySelector('.editor[data-page-id="' + p.id + '"]')) {
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
    if (!document.querySelector('.page-title[data-id="' + p + '"]')) {
      addButton(p, buttonsList, newPage);
    }
  });

  //update buttons
}

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
  li.appendChild(input);
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
  li.appendChild(button);
  button.ondblclick = (e) => li.classList.add("editing");
  button.onclick = function (e) {
    showPage(e.target?.parentElement?.getAttribute("data-id"));
  };

  input.onchange = (e) => {
    button.textContent = e.target.value;
  };
  showPage(id);
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

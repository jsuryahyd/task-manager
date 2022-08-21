import {appUtils} from "./lib/utils.js";
function saveToSync(e) {
  console.log(e, e.target.innerHTML);

  const newlyaddedLine = e.target.querySelector(":last-child");
  newlyaddedLine.classList.add("item");
  newlyaddedLine.setAttribute("data-item-id", Date.now());

  if (newlyaddedLine.innerText.startsWith("- ")) {
    const li = document.createElement("li");
    li.classList.add("item");
    li.setAttribute(
      "data-item-id",
      newlyaddedLine.getAttribute("data-item-id")
    );
    li.innerHTML = newlyaddedLine.innerHTML;
    e.target.appendChild(li);
    e.target.removeChild(newlyaddedLine);
  }

  chrome.storage.sync.set({ content: e.target.innerHTML });
}

document.addEventListener("DOMContentLoaded", () => {
  const main = document.getElementById("main");
  if (!main) return console.error("no main?", main);
  main.addEventListener("input", appUtils.debounce(saveToSync,500));
  chrome.storage.sync.get(["content"], ({ content }) => {
    main.innerHTML = content || "";
  });

  // blur keyup paste
});

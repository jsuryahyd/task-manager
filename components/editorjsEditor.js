import { appUtils } from "../lib/utils.js";

// import EditorJS from "../lib/editor.js";
export function addEditor(parent, initialContent, options) {
  document.body.addEventListener("click", (e) => {});
  window.addEventListener("blur", () => {
    editor.save().then(async (value) => {
      await appUtils.saveToLocal({
        ["page--" + parent.getAttribute("data-page-id")]: {
          content: value,
          // contentToDownload:
          //   e.target.outerHTML +
          //   [...document.getElementsByTagName("style")]
          //     .map((s) => s.outerHTML)
          //     .join(""),
        },
      });
    });
  });
  // @ts-ignore
  const editor = new EditorJS({
    holder: parent,
    tools: {
      header: {
        class: Header,
        inlineToolbar: true,
      },
      table: {
        class: Table,
        inlineToolbar: true,
      },
      checklist: {
        class: Checklist,
        inlineToolbar: true,
      },
      image: {
        class: ImageTool,
      },
      codeMirror: {
        class: CodeMirror,
      },
      list:{
        class:NestedList
      }
    },
    placeholder: "What are we up to?",
    readOnly: options?.readOnly,
    autoFocus: true,
    data:initialContent
  });
}

import { AlarmBlockTune } from "../lib/editorjs/alarm--tune.js";
import { appUtils } from "../lib/utils.js";

// import EditorJS from "../lib/editor.js";
export function addEditor(parent, initialContent, options) {
  document.body.addEventListener("click", (e) => {});
  document.body.addEventListener("blur", () => {
    const activeEditor = document.querySelector('.editor.show')
    if(!activeEditor?.querySelector('.codex-editor')){
return;
    }
    editor.save().then(async (value) => {
      // console.log('saving')
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
  },{capture:true});
  // @ts-ignore
  const editor = new EditorJS({
    holder: parent,
    tools: {
      header: {
        class: Header,
        inlineToolbar: true,
        shortcut:"CTRL+SHIFT+H"
      },
      table: {
        class: Table,
        inlineToolbar: true,
      },
      checklist: {
        class: Checklist,
        inlineToolbar: true,
      },
      image: SimpleImage,
      
      codeMirror: {
        class: CodeMirror,
      },
      list:{
        class:NestedList,
        inlineToolbar:true,
        shortcut:"CMD+SHIFT+L"
      },
      inlineCode:{
        class: InlineCode,
      },
      alarmTune: AlarmBlockTune
    },
    tunes: ['alarmTune'],
    placeholder: "What are we up to?",
    // readOnly: options?.readOnly,does not work because codeMirror does not support readonly
    autoFocus: true,
    data:initialContent
  });
}

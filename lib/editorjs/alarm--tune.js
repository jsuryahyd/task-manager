import { appUtils } from "../utils.js";

export class AlarmBlockTune {
  /**
   *
   * @param {object} args
   * @property {object} args.data
   * @property {{"blocks": {getByIndex:()=>object},"caret": {},"events": {},"listeners": {},"notifier": {},"sanitizer": {},"saver": {},"selection": {},"styles": {"block": "cdx-block","inlineToolButton": "ce-inline-tool","inlineToolButtonActive": "ce-inline-tool--active","input": "cdx-input","loader": "cdx-loader","button": "cdx-button","settingsButton": "cdx-settings-button","settingsButtonActive": "cdx-settings-button--active"},"toolbar": {},"inlineToolbar": {},"tooltip": {},"i18n": {},"readOnly": {"isEnabled": false},"ui": {"nodes": {"wrapper": {},"redactor": {}}}}} args.api
   */
  constructor({ data, api, config, readOnly, block }) {
    console.log("instantiated");
    this.api = api;
    this.data = data || {};
    this.block = block;
    this.config = config;
  }

  static get isTune() {
    return true;
  }

  render() {
    console.log(this.data, this.api, this.block, this.config);
    const container = document.createElement("div");
    const button = document.createElement("button");
    this.button = button
    // const timeinput = document.createElement("input");
    // timeinput.style.display = "none";
    // timeinput.type = "datetime-local";
    // timeinput.pattern = "DD-MM-YYYY HH:mm a";
    // timeinput.addEventListener("keydown", (e) => {

    // timeinput.addEventListener("change", (e) => {
    //   e.stopPropagation();
    //   //set alarm
    //   const alarmId = "notes-alarm:"+this.api.ui.nodes.wrapper.parentElement.dataset.pageId + ":"+this.block.id
    //   this.data.alarmId = alarmId

    //   this.data.alarmValue = new Date(e.target.value).getTime();
    //   console.log(this.api.blocks,this.api.blocks.getBlockByIndex(this.block.getCurrentBlockIndex))
    //   appUtils.createOrEditAlarm({...this.data,title:"Alarm from notes ",notes:this.block.holder?.innerHTML || "somehow get the content"},this.data.alarmId)
    //   //hideinput and show time.
    //   timeinput.style.display="none"
    //   button.innerHTML = "alarm at " + new Date(e.target.value).toLocaleString()
    // });
    button.classList.add(this.api.styles.button);
    
    const alarmId =
      this.data.alarmId 
      // ||
      // "notes-alarm:" +
      //   this.api.ui.nodes.wrapper.parentElement.dataset.pageId +
      //   ":" +
      //   this.block.id;
    chrome.alarms.get(alarmId+"", (alarm) => {
      this.setButtonContent(!!alarm)
      button.addEventListener("click", () => {
        // timeinput.style.display = "";
        // button.style.display = "none";
        window.alarmDialog.showDialog(
          {
            ...this.data,
            alarmId,
            editAlarmId: alarm ? alarmId : undefined,
          },
          (formValues,type) => {
            if(type !=='default') return;
            this.data = formValues;
            this.setButtonContent(true)
          }
        );
      });
    });

    container.appendChild(button);
    // container.appendChild(timeinput);

    return container;
  }

  setButtonContent(alarm){
    this.button.innerHTML = alarm
    ? "alarm at " + new Date(this.data.alarmValue).toLocaleString()
    : `<img src="${chrome.runtime.getURL(
        "./assets/alarm-clock.png"
      )}" class="alarm-icon" style="width:20px"/>`;
  }

  save() {
    return this.data;
  }
}

export class AlarmBlockTune {
  constructor({ data, api, config, readOnly, block }) {
    console.log("instantiated");
    this.api = api;
    this.data = data;
    this.block = block;
  }

  static get isTune() {
    return true;
  }

  render() {
    console.log(this.data, this.api);
    const container = document.createElement("div");
    const button = document.createElement("button");

    const timeinput = document.createElement("input");
		timeinput.style.display ="none"
    timeinput.type = "datetime-local";
    timeinput.pattern = "DD-MM-YYYY HH:mm a";
    timeinput.addEventListener("change", (e) => {
		
     
        console.log(e.target.value);
				//set alarm

				//hideinput and show time.
    
    });
    button.classList.add(this.api.styles.button);
    button.innerHTML = `<img src="${chrome.runtime.getURL(
      "./assets/alarm-clock.png"
    )}" class="alarm-icon" style="width:20px"/>`;
    button.addEventListener("click", () => {
      timeinput.style.display = "";
			button.style.display = "none"
    });

    container.appendChild(button);
    container.appendChild(timeinput);

    return container;
  }

  save() {
    return {
      alarmId: 1,
    };
  }
}

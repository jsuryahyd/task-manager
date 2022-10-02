export function AlarmDialog({
  dialogId,
  appUtils,
  refreshAlarmsInUI: showAlarms,
}) {
  let _editAlarmId = null;
  const alarmFormDialog = /** @type {HTMLDialogElement|null} */ (
    document.getElementById(dialogId)
  ); //put paranthesis, to cast as the type
  if (!alarmFormDialog) {
    console.error("no alarm form dialog with id - " + dialogId);
    return {
      close: () =>
        console.log("close: no alarm form dialog with id - " + dialogId),
      showDialog: () => {
        console.log("showDialog: no alarm form dialog with id - " + dialogId);
      },
    };
  }
  function showDialog(alarmDetails) {
    if (!alarmDetails.editAlarmId) alarmFormDialog?.showModal?.();
    else {
      _editAlarmId = alarmDetails.editAlarmId;
      alarmFormDialog?.showModal();
      //todo: populate the form
      alarmFormDialog.querySelector('[name="title"]').value =
        alarmDetails.title;
      if (alarmDetails.isRecurring === "1") {
        alarmFormDialog.querySelector(
          '[id="isRecurring--true"]'
        ).checked = true;
        alarmFormDialog.querySelector('[name="alarm-series-at"]').value =
          alarmDetails["alarm-series-at"];
      } else {
        alarmFormDialog.querySelector('[name="alarm-at"]').value =
          alarmDetails["alarm-at"];
        alarmFormDialog.querySelector(
          '[id="isRecurring--false"]'
        ).checked = true;
      }

      alarmFormDialog.querySelector('[name="notes"]').value =
        alarmDetails.notes;
    }
  }

  alarmFormDialog?.addEventListener("close", async (e) => {
    // console.log(e.target.returnValue);
    if (e.target?.returnValue === "default") {
      const formData = new FormData(
        /**  @type {HTMLFormElement|null} */ (
          e.target?.firstElementChild || null
        )
      );
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
      if (_editAlarmId) {
        appUtils.saveToLocal({
          alarmNotes: { ...alarmNotes, [_editAlarmId]: { ...formValues } },
        });
      } else {
        appUtils.saveToLocal({
          alarmNotes: { ...alarmNotes, [alarmId]: { ...formValues } },
        });
      }
      if (formValues["alarm-at"]) {
        if (_editAlarmId) {
          chrome.alarms.clear(_editAlarmId);
          chrome.alarms.create(_editAlarmId, {
            when: new Date(formValues["alarm-at"]).getTime(),
          });
        } else {
          chrome.alarms.create(alarmId, {
            when: new Date(formValues["alarm-at"]).getTime(),
          });
        }
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
        if (_editAlarmId) {
          chrome.alarms.clear(_editAlarmId);
          chrome.alarms.create(_editAlarmId, {
            periodInMinutes: 1440, //delay since the first alarm
            when: firstOccurence, //first alarm
          });
        } else
          chrome.alarms.create(alarmId, {
            periodInMinutes: 1440, //delay since the first alarm
            when: firstOccurence, //first alarm
          });
      }
			_editAlarmId = null;
      showAlarms();
    }
  });

  const close = () => {
    alarmFormDialog?.firstElementChild?.reset?.();
    alarmFormDialog?.close?.(); //invalid form doesnot close with default functionality
  };

  return { showDialog, close };
}

// export const alarmDialog = AlarmDialog({dialogId:"alarm-dialog"})

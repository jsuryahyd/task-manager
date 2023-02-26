/**
 * @typedef {import('../lib/utils.js').alarmDetails} alarmDetails
 * @param {*} param0 
 * @returns 
 */


export function AlarmDialog({
  dialogId,
  appUtils,
  refreshAlarmsInUI: showAlarms,
  onSuccess,
}) {
  let _editAlarmId = null;
  let successCbs = [];
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
  function showDialog(alarmDetails, cb) {
    successCbs.push(cb);
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
      const formValues = getFormValues();
      const alarmId = formValues.title + "__" + Date.now();
      onSuccess?.({...formValues,alarmId}, !!_editAlarmId,e);
      successCbs[0]?.({...formValues,alarmId},e.target.returnValue);
      _editAlarmId = null;
    }
    e.target.firstElementChild.reset();
    successCbs.pop();
  });

  const close = () => {
    alarmFormDialog?.firstElementChild?.reset?.();
    alarmFormDialog?.close?.(); //invalid form doesnot close with default functionality
  };

  function getFormValues() {
    const formData = new FormData(
      /**  @type {HTMLFormElement|undefined} */ (
        alarmFormDialog?.querySelector("form") || undefined
      )
    );
    const formValues =
      /** @type alarmDetails  */ ({});
    for (let [name, value] of formData) {
      formValues[name] = value;
    }
    return formValues;
  }

  return { showDialog, close, utils: { getFormValues } };
}

// export const alarmDialog = AlarmDialog({dialogId:"alarm-dialog"})

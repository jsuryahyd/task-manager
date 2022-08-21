function Utils() {
  function getUniqueNumber() {
    window._UNIQUE_NUMBER_ = (window._UNIQUE_NUMBER_ || 0) + 1;
    return window._UNIQUE_NUMBER_;
  }

  function saveToStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, () => {
        resolve(data);
      });
    });
  }

  function loadFromStorage(keys) {
    const func = (resolve, reject) => {
      chrome.storage.sync.get(keys, (data) => {
        resolve(data);
      });
    };
    return new Promise(func);
  }

  function loadFromLocal(keys) {
    const func = (resolve, reject) => {
      chrome.storage.local.get(keys, (data) => {
        resolve(data);
      });
    };
    return new Promise(func);
  }
  
  function saveToLocal(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        resolve(data);
      });
    });
  }
  
  function validateUrl(str) {
    if (str.indexOf("http") == -1) {
      str = "http://" + str; //just to emulate they are added
    }

    let u;
    try {
      u = new URL(str);
      //  return "";
    } catch (e) {
      console.error(e);
      return "Please Input valid website address/url"; //"Invalid Address/Url";
    }

    const regexp =
      /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (regexp.test(str)) {
      return "";
    } else {
      return "Please Input valid website address/url";
    }
  }
	const debounce = (func, delay) => {
    let debounceTimer
    return function() {
        const context = this
        const args = arguments
            clearTimeout(debounceTimer)
                debounceTimer
            = setTimeout(() => func.apply(context, args), delay)
    }
}


  return {
    getUniqueNumber,
    saveToStorage,
    loadFromStorage,
    validateUrl,
    loadFromLocal,
    saveToLocal,
		debounce
  };
}

export const appUtils = Utils();

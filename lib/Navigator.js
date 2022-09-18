function Navigator({ routes } = {}) {
  let _routes = routes || [];
  function setRoutePagesStyle() {
    document.querySelectorAll("[data-route]").forEach((el) => {
      el.classList.add("page-style");
    });
  }
  function navigate(route) {
    [...(document.getElementById("route-outlet")?.children || [])].forEach(
      (el) => {
        if (el.getAttribute("data-route") === route) {
          el.classList.add("show");
        } else {
          el.classList.remove("show");
        }
      }
    );
  }

  function addGotoBtnListeners() {
    document.body.addEventListener("click", (e) => {
      const goTo = e.target.getAttribute("data-route-goto");
      if (goTo) {
        navigate(goTo);
      }
    });
  }

  function init() {
    _routes = [...document.querySelectorAll("[data-route]")].map((r) =>
      r.getAttribute("data-route")
    );
    setRoutePagesStyle();
		addGotoBtnListeners();
    navigate(_routes[0]);
  }

  return {
    init,
    navigate,
  };
}

export const appNavigator = Navigator();

window.appNavigator = appNavigator;

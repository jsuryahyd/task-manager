export function Accordion({ accordionId }) {
  const accordionItem = document.querySelector(
    '[data-accordion-id="' + accordionId + '"]'
  );

  if (!accordionItem) {
    return console.error("no element with given accordionId", accordionId);
  }
  function clickListener() {
    accordionItem?.classList.contains("collapsed")
      ? accordionItem?.classList.remove("collapsed")
      : accordionItem?.classList.add("collapsed");
  }

  function init() {
    accordionItem
      ?.querySelector("[accordion-toggle]")
      ?.addEventListener("click", clickListener);
  }

  function destroy() {
    accordionItem
      ?.querySelector("[accordion-toggle]")
      ?.removeEventListener("click", clickListener);
  }
  init();

  return {
    expand: () => accordionItem?.classList.remove("collapsed"),
    collapse: () => accordionItem?.classList.add("collapsed"),
  };
}

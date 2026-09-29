const tabTree = (element) => {
  const panels = Array.prototype.filter.call(
    element.childNodes,
    (x) => x.nodeType === 1
  );
  let tabBarIndex = panels.findIndex(
    (x) => x.getAttribute("slot") === "tab-bar"
  );
  tabBarIndex = tabBarIndex === -1 ? 0 : tabBarIndex;
  const tabBar = panels[tabBarIndex];
  panels.splice(tabBarIndex, 1);
  const tabs = Array.prototype.filter.call(
    tabBar.childNodes,
    (x) => x.nodeType === 1
  );

  return { tabs, panels, tabBar };
};
export const createTabbedUI = (element) => {
  const update = ({ target }) => {
    const { tabs, panels, tabBar } = tabTree(element);
    let i = 0;
    if (target === tabBar || !tabBar.contains(target)) {
      return;
    }
    for (const tab of tabs) {
      const panel = panels[i];
      if (tab.contains(target)) {
        tab.setAttribute("selected", "");
        panel.setAttribute("selected", "");
        panel.style.display =
          panel.dataset.display ?? element.dataset.display ?? "block";
      } else {
        tab.removeAttribute("selected");
        panel.removeAttribute("selected");
        panel.style.display = "none";
      }
      i++;
    }
  };
  element.addEventListener("click", update);
  const { tabs } = tabTree(element);
  const target = tabs[element.dataset.defaultIndex] || tabs[0];
  update({ target });
  return element;
};
export default createTabbedUI;

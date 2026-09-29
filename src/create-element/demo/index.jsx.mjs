import _createElement from 'https://esm.sh/@johnhenry/domkit/create-element/index.mjs'; 
const App = (props) => /* @__PURE__ */ _createElement("", null, /* @__PURE__ */ _createElement("div", {
  ...props
}, /* @__PURE__ */ _createElement("p", null, "Edit ", /* @__PURE__ */ _createElement("code", null, "index.jsx"), " and save to test!")));
const instance = App({ class: "class-app" });
document.getElementById("app").append(instance);

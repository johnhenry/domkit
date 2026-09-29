const App = (props) => (
  <>
    <div {...props}>
      <p>
        Edit <code>index.jsx</code> and save to test!
      </p>
    </div>
  </>
);

const instance = App({ class: "class-app" });
document.getElementById("app").append(instance);

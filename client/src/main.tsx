import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

function renderApp() {
  root.render(<App />);
  document.body.style.opacity = '1';
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  requestAnimationFrame(renderApp);
} else {
  window.addEventListener('load', () => requestAnimationFrame(renderApp));
}

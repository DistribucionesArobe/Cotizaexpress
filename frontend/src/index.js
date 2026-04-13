import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const rootElement = document.getElementById("root");

// react-snap pre-renders pages to static HTML for SEO.
// If pre-rendered content exists, hydrate it instead of rendering from scratch.
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

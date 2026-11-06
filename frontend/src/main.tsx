import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { applyAppearance } from "./lib/appearance";
import { requestPersistentStorage, setupPwa } from "./lib/pwa";
import { ensureSeeded } from "./data/seed";

applyAppearance();
setupPwa();
void requestPersistentStorage();
void ensureSeeded();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

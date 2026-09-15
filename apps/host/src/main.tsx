import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@grille/characters/keyframes.css";
import "./styles/global.css";
import "./styles/keyframes.css";
import { App } from "./App.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Registra el service worker y, si hay una versión nueva disponible,
// la activa y recarga la página automáticamente — sin que el usuario
// tenga que borrar caché o desinstalar nada manualmente.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

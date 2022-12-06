import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import Client from "client";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Client platform="desktop"/>
  </React.StrictMode>
);

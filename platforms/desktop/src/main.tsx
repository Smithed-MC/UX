import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import Client from "client";
import MCVMRuntime from "./MCVMRuntime";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* <Client platform="desktop"/> */}
    <MCVMRuntime />
  </React.StrictMode>
);

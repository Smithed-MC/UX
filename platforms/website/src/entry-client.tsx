import { routes } from 'client'
import ReactDOM from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

let router = createBrowserRouter(routes);

const app = document.getElementById("app")
if(app != null) {
  ReactDOM.hydrateRoot(
    app,
    <RouterProvider router={router} />
  );
}

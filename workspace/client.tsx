import { hydrateRoot } from "https://npm.tfl.dev/react-dom/client";
import { Ultra } from "@ultra/react";
import App from "./src/app.tsx";

hydrateRoot(
  document,
  <Ultra>
    <App state={window.__ultra_renderState} />
  </Ultra>,
);

import type { ReactElement } from "https://npm.tfl.dev/react";
import type { RenderOptions } from "./types.ts";
import { LinkHeader } from "./links.ts";

// FIXME: https://github.com/esm-dev/esm.sh/issues/78
// context files are bundled (bad). so we need to roll with our own
import { renderToStream } from "https://tfl.dev/@truffle/ultra-server@0.3.0/react-streaming/renderToStream.js";

export async function render(
  element: ReactElement,
  options: RenderOptions,
) {
  const { strategy, bootstrapModules } = options;

  const stream = await renderToStream(element, {
    bootstrapModules,
    disable: strategy === "static",
  });

  // injectToStream = stream.injectToStream;

  const links = new LinkHeader();

  for (const preload of bootstrapModules) {
    if (preload.includes("//npm.tfl.dev") || preload.endsWith(".js")) {
      links.preloadModule(preload);
    }
  }

  const headers = new Headers({
    "content-type": "text/html; charset=utf-8",
    "link": links.toString(),
  });

  return new Response(stream.readable, {
    status: 200,
    headers,
  });
}

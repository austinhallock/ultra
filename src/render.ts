import type { ReactElement } from "react";
import { renderToStream } from "react-streaming/server";

import type { RenderOptions } from "./types.ts";
import { LinkHeader } from "./links.ts";

export async function render(
  element: ReactElement,
  options: RenderOptions,
) {
  const { strategy, bootstrapModules } = options;

  const stream = await renderToStream(element, {
    bootstrapModules,
    disable: strategy === "static",
  });

  const links = new LinkHeader();

  for (const preload of bootstrapModules) {
    if (preload.includes("//esm.sh") || preload.endsWith(".js")) {
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

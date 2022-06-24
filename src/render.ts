import type { ReactElement } from "https://npm.tfl.dev/react";
import type { RenderOptions } from "./types.ts";
// import { createElement } from "https://npm.tfl.dev/react";
import { LinkHeader } from "./links.ts";
// import { SsrDataProvider } from "./react/useSsrData.ts";
// import { StreamProvider } from "./react/useStream.ts";

// FIXME: https://github.com/esm-dev/esm.sh/issues/78
// context files are bundled (bad). so we need to roll with our own
import { renderToStream } from "https://tfl.dev/@truffle/ultra-server@0.2.0/react-streaming/renderToStream.js";

export async function render(
  element: ReactElement,
  options: RenderOptions,
) {
  const { strategy, bootstrapModules } = options;

  // element = createElement(SsrDataProvider, null, element);

  // // deno-lint-ignore prefer-const
  // let injectToStream: (chunk: string) => void;

  // element = createElement(
  //   StreamProvider,
  //   { value: { injectToStream: (chunk: string) => injectToStream(chunk) } },
  //   element,
  // );

  const stream = await renderToStream(element, {
    bootstrapModules,
    disable: strategy === "static",
  });

  // injectToStream = stream.injectToStream;

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

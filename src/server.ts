import { createElement } from "react";
import { Application } from "./app.ts";
import { ServerAppComponent, ServerOptions } from "./types.ts";
import { toCompilerUrl } from "./utils.ts";
import {
  join,
  parseImportMap,
  RequestHandler,
  serveDir,
  toFileUrl,
} from "./deps.ts";
import { render } from "./render.ts";
import { resolveImportMap } from "./config.ts";
import { ImportVisitor } from "./ast/import.ts";
import { createCompileHandler } from "./handler/compile.ts";

export default async function createServer(
  app: ServerAppComponent,
  options: ServerOptions = {},
) {
  const {
    mode = "production",
    publicPath = "public",
    rootUrl = toFileUrl(Deno.cwd()),
    compilerPath = "/@ultra/compiler/",
  } = options;

  const importMap = await resolveImportMap(rootUrl.pathname);
  const parsedImportMap = parseImportMap(importMap, rootUrl);
  const publicUrl = join(rootUrl.pathname, publicPath);

  let { bootstrapModules = [] } = options;

  bootstrapModules = bootstrapModules.map(
    (bootstrapModule) => toCompilerUrl(bootstrapModule, compilerPath),
  );

  const renderHandler: RequestHandler<Application> = (context) => {
    return render(createElement(app, { state: context.state }), {
      bootstrapModules,
    });
  };

  const server = new Application({
    mode,
    rootUrl,
  });

  const compileHandler = createCompileHandler(
    rootUrl,
    compilerPath,
  );

  const publicHandler: RequestHandler<Application> = ({ request }) =>
    serveDir(request, { fsRoot: publicUrl, urlRoot: publicPath });

  /**
   * Setup Ultra routes
   */
  server.add("GET", `/${publicPath}/*`, publicHandler);
  server.add("GET", `${compilerPath}*.(tsx|ts|js|jsx).js`, compileHandler);
  server.add("GET", "/*", renderHandler);

  /**
   * Inject the request State once we see the end body tag
   */
  server.addResponseTransformer((_response, context, rewriter) => {
    rewriter.on("body", {
      element(element) {
        element.onEndTag((body) => {
          body.before(
            `<script id="__ultra_state">window.__ultra_state = ${
              JSON.stringify(context.state)
            }</script>`,
            { html: true },
          );
        });
      },
    });
  });

  server.compiler.addVisitor(new ImportVisitor(parsedImportMap));

  await server.compiler.init(
    "https://cdn.esm.sh/@swc/wasm-web@1.2.182/wasm-web_bg.wasm",
  );

  server.addEventListener("listening", (event) => {
    const message = `Ultra running on http://localhost:${event.detail.port}`;
    console.log(message);
  });

  return server;
}

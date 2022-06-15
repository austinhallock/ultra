import { ImportVisitor } from "../../ast/import.ts";
import { join, serveDir } from "../../deps.ts";
import type { ParsedImportMap } from "../../deps.ts";
import { isDev } from "../../env.ts";
import type {
  Plugin,
  RequestHandler,
  ResponseTransformer,
} from "../../types.ts";
import { isGetRequest, isHtmlResponse } from "../../utils.ts";
import { createCompileHandler } from "../../handler/compile.ts";

type PluginOptions = {
  importMap: ParsedImportMap;
  rootUrl: URL;
  publicPath: string;
  compilerPath: string;
};

export const ultraPlugin: Plugin<PluginOptions> = async (
  app,
  options,
) => {
  const { importMap, publicPath, compilerPath, rootUrl } = options;
  const publicUrl = join(rootUrl.pathname, publicPath);

  const compileHandler = createCompileHandler(
    rootUrl,
    compilerPath,
  );

  const publicHandler: RequestHandler = ({ request }) => {
    return serveDir(request, { fsRoot: publicUrl, urlRoot: publicPath });
  };

  app.add("GET", `/${publicPath}/*`, publicHandler);
  app.add("GET", `${compilerPath}*.(tsx|ts|js|jsx|css)`, compileHandler);

  await app.resolveSources();

  app.compiler.addVisitor(
    new ImportVisitor(importMap, Array.from(app.sourceFiles.keys())),
  );

  app.addResponseTransformer(
    responseTransformer,
  );
};

function replacer(_key: string, value: unknown) {
  if (value instanceof Map) {
    return Array.from(value.entries());
  } else {
    return value;
  }
}

const responseTransformer: ResponseTransformer = (
  response,
  context,
  rewriter,
) => {
  if (isGetRequest(context.request) && isHtmlResponse(response)) {
    rewriter.on("body", {
      element(element) {
        element.onEndTag((body) => {
          body.before(
            `<script id="__ultra_renderState">window.__ultra_renderState = ${
              JSON.stringify(context.state, replacer)
            }</script>
            ${isDev ? `<script>
              // HACK: until better dev server is implemented
              function _ultra_socket_connect(shouldReloadOnConnect) {
                const _ultra_socket = new WebSocket("ws://localhost:8001");
                _ultra_socket.addEventListener("message", (e) => {
                  console.log('socket message');
                  
                  if (e.data === "reload") {
                    location.reload();
                  }
                });
                if (shouldReloadOnConnect) {
                  _ultra_socket.onopen = function() {
                    window.location.reload();
                  }
                }
                _ultra_socket.onclose = function(e) {
                  console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
                  setTimeout(function() {
                    _ultra_socket_connect(true);
                  }, 1000);
                };
              }
              _ultra_socket_connect();
            </script>` : ''}`,
            { html: true },
          );
        });
      },
    });
  }
};

import { ImportVisitor } from "../../ast/import.ts";
import type {
  ParsedImportMap,
  Plugin,
  ResponseTransformer,
} from "../../deps.ts";
import { isGetRequest, isHtmlResponse } from "../../utils.ts";

type PluginOptions = { importMap: ParsedImportMap };

export const ultraPlugin: Plugin<PluginOptions> = (app, { importMap }) => {
  app.compiler.addVisitor(new ImportVisitor(importMap));
  app.addResponseTransformer(
    responseTransformer,
  );
};

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
            `<script id="__ultra_state">window.__ultra_state = ${
              JSON.stringify(context.state)
            }</script>`,
            { html: true },
          );
        });
      },
    });
  }
};

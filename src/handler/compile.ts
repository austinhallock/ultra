import { debug, join, extname } from "../deps.ts";
import { isDev } from "../env.ts";
import {
  toLocalPathnameWithoutJsExt,
  shouldCompileToJs
} from "../utils.ts";
import type { RequestHandler } from "../types.ts";

class CachedString extends String {}

const log = debug("ultra:compiler");
const compilerCache = new Map<string, CachedString>();

function toAbsoluteUrl(pathname: string, rootUrl: URL) {
  return pathname.startsWith("file://") || pathname.startsWith("http")
    ? new URL(pathname)
    : new URL(join(rootUrl.toString(), pathname));
}

function getContentTypeByExtName(extension: string) {
  switch (extension) {
    case '.js':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    default:
      return 'text/plain';
  }
}

export function createCompileHandler(
  rootUrl: URL,
  pathPrefix: string,
) {
  const compileHandler: RequestHandler = async (context) => {
    const { app } = context;
    try {
      const pathname = toLocalPathnameWithoutJsExt(context.pathname, pathPrefix);
      const url = toAbsoluteUrl(pathname, rootUrl);

      const sourceFile = await app.sourceFiles.get(url);

      if (!sourceFile) {
        throw new Error(`${url} is not a valid compiler source file.`);
      }

      let output: string | null = null;
      let contentType = 'text/plain';
      const cached = !isDev && compilerCache.get(url.toString());

      const extension = extname(url.toString());

      if (shouldCompileToJs(extension)) {
        if (cached) {
          log(`Cached: ${url}`);
          output = cached.toString();
        } else {
          log(`Compiling: ${url}`);

          output = app.compiler.compile({
            input: sourceFile.code,
            url,
          });

          if (!isDev) compilerCache.set(url.toString(), new CachedString(output));
        }
        contentType = 'application/javascript';
      } else {
        output = sourceFile.code
        contentType = getContentTypeByExtName(extension);
      }

      return new Response(output, {
        headers: {
          "content-type": `${contentType}; charset=utf-8`,
        },
      });
    } catch (error) {
      console.error(error);
      return new Response("", {
        status: 404,
      });
    }
  };

  return compileHandler;
}

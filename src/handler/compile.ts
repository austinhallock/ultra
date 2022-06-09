import { debug, join, extname } from "../deps.ts";
import {
  toLocalPathnameWithoutJsExt,
  shouldCompileToJs,
  shouldCompileToFakeCssModule
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
      const cached = compilerCache.get(url.toString());

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

          compilerCache.set(url.toString(), new CachedString(output));
        }
        contentType = 'application/javascript';
      } else if (shouldCompileToFakeCssModule(extension)) {
        // for css
        // when swc and deno support css module asserts, we can probably get
        // rid of this and just return the raw css
        // https://github.com/denoland/deno/issues/11961
        output = `let stylesheet
const css = \`${sourceFile.code.replace(/\\/g, '\\\\').replace(/\`/g, '\\`')}\`
try {
  // partial support in browsers
  // https://stackoverflow.com/a/57567930
  stylesheet = new CSSStyleSheet();
  stylesheet.replace(css);
} catch (err) {
  // hack to get stylesheet in browsers that don't support first method
  const style = document.createElement('style');
  style.innerText = css;
  document.head.appendChild(style);
  const { sheet } = style;
  document.head.removeChild(style);
  stylesheet = sheet;
}
export default stylesheet;`
        contentType = 'application/javascript';
        // output = sourceFile.code;
        // contentType = getContentTypeByExtName(extension);
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

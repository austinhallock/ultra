import {
  dirname,
  extname,
  fromFileUrl,
  join,
  normalize,
  toFileUrl,
} from "./deps.ts";

export function relativeImportMetaPath(path: string, importMetaUrl: string) {
  const importPathname = importMetaUrl.startsWith("http")
    ? new URL(path, importMetaUrl)
    : fromFileUrl(importMetaUrl);

  if (importPathname instanceof URL) {
    return importPathname;
  }

  const result = join(
    dirname(importPathname),
    normalize(path),
  );

  return toFileUrl(result);
}

export function hasTrailingSlash(input: string): boolean {
  if (input.length > 1 && input[input.length - 1] === "/") {
    return true;
  }

  return false;
}

export function removeTrailingSlash(input: string): string {
  if (hasTrailingSlash(input)) {
    input = input.slice(0, input.length - 1);
  }
  return input;
}

export function isHtmlResponse(
  response: Response,
) {
  return response.headers.get("content-type")?.includes(
    "text/html",
  ) || false;
}

export function isGetRequest(request: Request) {
  return request.method === "GET";
}

export function shouldCompileToJs(extension: string) {
  return ['.jsx', '.js', '.tsx', '.ts'].includes(extension);
}

export function toCompilerUrl(path: string, pathPrefix?: string) {
  const compiledPath = `${path}.compiled.js`;
  return pathPrefix ? join(pathPrefix, compiledPath) : compiledPath;
}

export function getReferringScriptUrl(request: Request) {
  return new URL(request.referrer || request.url);
}

export function toLocalPathnameWithoutJsExt(pathname: string, pathPrefix: string) {
  const localPathName = pathname.replace(pathPrefix, "")
  const extension = extname(localPathName);
  const compiledPostfix = `.compiled${extension}`;
  const hasCompiledPostfix = localPathName.endsWith(compiledPostfix);
  return hasCompiledPostfix
    ? localPathName.slice(0, -compiledPostfix.length)
    : localPathName;
}

export function toUrl(path: string) {
  return path.startsWith("file://") ? toFileUrl(path) : new URL(path);
}

export async function loadSource(path: string | URL) {
  const url = typeof path === "string"
    ? path.startsWith("file://") ? toFileUrl(fromFileUrl(path)) : new URL(path)
    : path;

  const content = url.protocol === "file:"
    ? await Deno.readTextFile(url)
    : await (await fetch(url.toString(), { cache: "no-cache" })).text();

  return content;
}

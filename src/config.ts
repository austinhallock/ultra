import { Config, ImportMap } from "./types.ts";
import { resolveFileUrl, isRemoteSource } from "./resolver.ts";

export async function resolveConfig(cwd: string): Promise<Config> {
  const CONFIG_ENV = Deno.env.get("config");
  const configPath = resolveFileUrl(cwd, CONFIG_ENV || "./deno.json");
  const config = JSON.parse(await Deno.readTextFile(configPath));

  return config;
}

export async function resolveImportMap(
  cwd: string,
  config?: Config,
): Promise<ImportMap> {
  const IMPORT_MAP_ENV = Deno.env.get("importMap");
  let importMapPath = IMPORT_MAP_ENV || config?.importMap || "./importMap.json"
  
  if (!isRemoteSource(importMapPath)) {
    importMapPath = resolveFileUrl(cwd, importMapPath).toString();
  }

  const importMap = (await import(importMapPath, {
    assert: { type: "json" },
  })).default;

  return importMap;
}

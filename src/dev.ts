const invalidated = "__$$invalidated$$__";

export class Sources extends Map {
  // deno-lint-ignore no-explicit-any
  constructor(private loadSource: (key: string) => Promise<any>) {
    super();
  }

  async load(key: string | URL) {
    key = typeof key === "string" ? key : key.toString();

    const value = await this.loadSource(key);
    this.set(key, value);

    return this;
  }

  // deno-lint-ignore no-explicit-any
  async get(key: string): Promise<any> {
    let value = super.get(key);

    if (value === invalidated) {
      console.log(`Source load: ${key}`);
      value = await this.load(key);
      this.set(key, value);
    }

    return value;
  }

  invalidate(key: string) {
    if (this.has(key)) {
      console.log(`Source invalidated: ${key}`);
      this.set(key, invalidated);
    }

    return this;
  }
}

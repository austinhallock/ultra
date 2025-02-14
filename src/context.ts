import { Application } from "./app.ts";
import type { ContextOptions, RenderState } from "./types.ts";

export class Context {
  readonly app: Application;
  readonly #request: Request;
  response: Response;
  state: RenderState;

  constructor({ app, request }: ContextOptions) {
    this.app = app;
    this.#request = request;
    this.response = new Response();
    this.state = {
      url: this.url,
      helmet: {},
    };
  }

  get url() {
    return new URL(this.#request.url);
  }

  get pathname() {
    return this.url.pathname;
  }

  get request() {
    return this.#request;
  }
}

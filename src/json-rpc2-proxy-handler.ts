import { AbstractJsonRpc2 } from "./json-rpc2.ts";
import { Params, request, Value } from "./model.ts";

export type ProxyableFunction = (params: Params) => Promise<Value | void>;
export type ProxyableObject = Record<string, ProxyableFunction>;

interface InternalProxiedFunction {
  name: string;
  fn: ProxyableFunction;
}

// deno-lint-ignore no-explicit-any
function isInternalProxiedFunction(a?: any): a is InternalProxiedFunction {
  return typeof a === "object" &&
    typeof a.name === "string" &&
    typeof a.fn === "function";
}

export class JsonRpc2ProxyHandler<
  T extends ProxyableObject | ProxyableFunction | InternalProxiedFunction,
> implements ProxyHandler<T> {
  readonly #jsonRpc2: AbstractJsonRpc2;
  constructor(jsonRpc2ClientServer: AbstractJsonRpc2) {
    this.#jsonRpc2 = jsonRpc2ClientServer;
  }

  // deno-lint-ignore no-unused-vars no-explicit-any
  get<T>(target: T, name: string, receiver: any): T | undefined {
    if (typeof target === "function") {
      throw new Error(
        `Can't get a property (${name.toString()}) from a function (${
          JSON.stringify(target)
        })`,
      );
    }

    if (typeof target !== "object") return undefined;
    const fn = (target as Record<string, unknown>)[name];

    if (typeof fn !== "function") return undefined;

    return new Proxy(
      { name, fn: fn as ProxyableFunction },
      this,
    ) as unknown as T;
  }

  // deno-lint-ignore no-unused-vars no-explicit-any
  apply<T>(target: T, thisArg: any, argArray: Params): any {
    if (!isInternalProxiedFunction(target)) {
      throw new Error("Target is not an InternalProxiedFunction. Can't apply.");
    }
    return this.#jsonRpc2.call(request(target.name, argArray));
  }

  // deno-lint-ignore no-unused-vars ban-types no-explicit-any
  construct(target: T, argArray: any[], newTarget: Function): object {
    throw new Error("Not supported.");
  }

  defineProperty(
    // deno-lint-ignore no-unused-vars
    target: T,
    // deno-lint-ignore no-unused-vars
    p: string | symbol,
    // deno-lint-ignore no-unused-vars
    attributes: PropertyDescriptor,
  ): boolean {
    throw new Error("Not supported.");
  }

  // deno-lint-ignore no-unused-vars
  deleteProperty(target: T, p: string | symbol): boolean {
    throw new Error("Not supported.");
  }

  getOwnPropertyDescriptor(
    // deno-lint-ignore no-unused-vars
    target: T,
    // deno-lint-ignore no-unused-vars
    p: string | symbol,
  ): PropertyDescriptor | undefined {
    throw new Error("Not supported.");
  }

  // deno-lint-ignore no-unused-vars ban-types
  getPrototypeOf(target: T): object | null {
    throw new Error("Not supported.");
  }

  // deno-lint-ignore no-unused-vars
  has(target: T, p: string | symbol): boolean {
    throw new Error("Not supported.");
  }

  // deno-lint-ignore no-unused-vars
  isExtensible(target: T): boolean {
    return false;
  }

  // deno-lint-ignore no-unused-vars
  ownKeys(target: T): ArrayLike<string | symbol> {
    throw new Error("Not supported.");
  }

  // deno-lint-ignore no-unused-vars
  preventExtensions(target: T): boolean {
    return false;
  }

  // deno-lint-ignore no-unused-vars no-explicit-any
  set(target: T, p: string | symbol, value: any, receiver: any): boolean {
    throw new Error("Not supported.");
  }

  // deno-lint-ignore no-unused-vars ban-types
  setPrototypeOf(target: T, v: object | null): boolean {
    throw new Error("Not supported.");
  }
}

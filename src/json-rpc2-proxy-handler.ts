import { JsonRpc2ClientServer } from "./json-rpc2.ts";
import { Params, request, Value } from "./model.ts";

export type ProxyableFunction = (params: Params) => Promise<Value | void>;
export type ProxyableObject = Record<string, ProxyableFunction>;

interface InternalProxiedFunction {
  name: string;
  fn: ProxyableFunction;
}

function isInternalProxiedFunction(a?: any): a is InternalProxiedFunction {
  return typeof a === "object" &&
    typeof a.name === "string" &&
    typeof a.fn === "function";
}

export class JsonRpc2ProxyHandler<
  T extends ProxyableObject | ProxyableFunction | InternalProxiedFunction,
> implements ProxyHandler<T> {
  readonly #jsonRpc2ClientServer: JsonRpc2ClientServer;
  constructor(jsonRpc2ClientServer: JsonRpc2ClientServer) {
    this.#jsonRpc2ClientServer = jsonRpc2ClientServer;
  }

  get<T>(target: T, name: string, receiver: any): T | undefined {
    if (typeof target === "function") {
      throw new Error(
        `Can't get a property (${name.toString()}) from a function (${
          JSON.stringify(target)
        })`,
      );
    }

    if (typeof target !== "object") return undefined;
    const fn = (target as Record<string, any>)[name];

    if (typeof fn !== "function") return undefined;

    return new Proxy(
      { name, fn: fn as ProxyableFunction },
      this,
    ) as unknown as T;
  }

  apply<T>(target: T, thisArg: any, argArray: Params): any {
    if (!isInternalProxiedFunction(target)) {
      throw new Error("Target is not an InternalProxiedFunction. Can't apply.");
    }
    return this.#jsonRpc2ClientServer.call(request(target.name, argArray));
  }

  construct(target: T, argArray: any[], newTarget: Function): object {
    throw new Error("Not supported.");
  }

  defineProperty(
    target: T,
    p: string | symbol,
    attributes: PropertyDescriptor,
  ): boolean {
    throw new Error("Not supported.");
  }

  deleteProperty(target: T, p: string | symbol): boolean {
    throw new Error("Not supported.");
  }

  getOwnPropertyDescriptor(
    target: T,
    p: string | symbol,
  ): PropertyDescriptor | undefined {
    throw new Error("Not supported.");
  }

  getPrototypeOf(target: T): object | null {
    throw new Error("Not supported.");
  }

  has(target: T, p: string | symbol): boolean {
    throw new Error("Not supported.");
  }

  isExtensible(target: T): boolean {
    return false;
  }

  ownKeys(target: T): ArrayLike<string | symbol> {
    throw new Error("Not supported.");
  }

  preventExtensions(target: T): boolean {
    return false;
  }

  set(target: T, p: string | symbol, value: any, receiver: any): boolean {
    throw new Error("Not supported.");
  }

  setPrototypeOf(target: T, v: object | null): boolean {
    throw new Error("Not supported.");
  }
}

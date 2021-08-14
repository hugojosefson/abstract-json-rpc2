import { ErrorCode } from "./error-code.ts";
import { uuid } from "./uuid.ts";

export const VERSION = "2.0" as const;

export type Primitive =
  | string
  | number
  | boolean
  | null;

export type Value =
  | Primitive
  | Value[]
  | { [key: string]: Value }; /* same as Record<string, Value> */

export type Params =
  | Value[]
  | Record<string, Value>;

export type NonNullId =
  | string
  | number;

export type Id =
  | NonNullId
  | null
  | never;

export interface Request<P extends Params, I extends Id> {
  jsonrpc: typeof VERSION;
  method: string;
  params?: P;
  id?: I;
}

export type Notification<P extends Params> = Request<P, never>;

export type Response<R extends Value, I extends Id, E extends Value> = {
  jsonrpc: typeof VERSION;
  result: R;
  id: I;
} | {
  jsonrpc: typeof VERSION;
  error: ResponseError<E>;
  id: I;
};

export interface ResponseError<E extends Value> {
  code: ErrorCode | number;
  message: string;
  data?: E;
}

export function notification<P extends Params>(
  method: string,
  params?: P,
): Notification<P> {
  return {
    jsonrpc: "2.0",
    method,
    params,
  };
}

export function request<P extends Params>(
  method: string,
  params?: P,
): Request<P, string> {
  return {
    ...notification(method, params),
    id: uuid(),
  };
}

export function resultResponse<R extends Value>(
  id: string,
  result: R,
): Response<R, string, never> {
  return {
    jsonrpc: "2.0",
    result,
    id,
  };
}

export function errorResponse<E extends Value>(
  id: string,
  code: ErrorCode | number,
  message: string,
  data?: E,
): Response<never, string, E> {
  return {
    jsonrpc: "2.0",
    error: {
      code,
      message,
      data,
    },
    id,
  };
}

export function isNonNullId(id: any): id is NonNullId {
  return isString(id) || isNumber(id);
}

export function isRequest(a: any): a is Request<any, any> {
  return isObject(a) &&
    a.jsonrpc === VERSION &&
    typeof a.method === "string";
}

export function isString(a: any): a is string {
  return typeof a === "string";
}

export function isNumber(a: any): a is number {
  return typeof a === "number";
}

export function isBoolean(a: any): a is boolean {
  return typeof a === "boolean";
}

export function isArray(a: any): a is any[] {
  return Array.isArray(a);
}

export function isValue(a: any): a is Value {
  return isString(a) ||
    isNumber(a) ||
    isBoolean(a) ||
    isObject(a) ||
    isArray(a);
}

export function isResponseError(a: any): a is ResponseError<any> {
  return isObject(a) &&
    isNumber(a.code) &&
    isString(a.message);
}

export function xor(a: boolean, b: boolean): boolean {
  return a !== b;
}

export function isObject(a: any): a is Record<string | symbol, any> {
  return typeof a === "object";
}

export function isResponse(a: any): a is Response<any, any, any> {
  return isObject(a) &&
    a.jsonrpc === VERSION &&
    xor(isValue(a.result), isResponseError(a.error));
}

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

export type ResultResponse<R extends Value> = {
  jsonrpc: typeof VERSION;
  result: R;
  id: NonNullId;
};

export type ErrorResponse<E extends Value> = {
  jsonrpc: typeof VERSION;
  error: ErrorResponseError<E>;
  id: NonNullId;
};

export type AnyResponse<R extends Value, E extends Value> =
  | ResultResponse<R>
  | ErrorResponse<E>;

export interface ErrorResponseError<E extends Value> {
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
  id: NonNullId,
  result: R,
): ResultResponse<R> {
  return {
    jsonrpc: "2.0",
    result,
    id,
  };
}

export function errorResponse<E extends Value>(
  id: NonNullId,
  code: ErrorCode | number,
  message: string,
  data?: E,
): ErrorResponse<E> {
  return {
    jsonrpc: "2.0",
    error: {
      code: code ?? ErrorCode.InternalError,
      message: message ?? "Unknown error",
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

export function isFunction(a: any): a is Function {
  return typeof a === "function";
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

export function isErrorResponseError<E extends Value>(
  a: any,
): a is ErrorResponseError<E> {
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

export function isResultResponse<R extends Value>(
  a: any,
): a is ResultResponse<R> {
  return isObject(a) &&
    a.jsonrpc === VERSION && isValue(a.result) && isNonNullId(a.id);
}

export function isErrorResponse<E extends Value>(
  a: any,
): a is ErrorResponse<E> {
  return isObject(a) &&
    a.jsonrpc === VERSION && isErrorResponseError(a.error) && isNonNullId(a.id);
}

export type Message =
  | Request<Params, Id>
  | AnyResponse<Value, Value>;

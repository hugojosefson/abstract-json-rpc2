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

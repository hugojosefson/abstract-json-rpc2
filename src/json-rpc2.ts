import { ErrorCode } from "./error-code.ts";
import {
  JsonRpc2ProxyHandler,
  ProxyableObject,
} from "./json-rpc2-proxy-handler.ts";

import {
  AnyResponse,
  ErrorResponse,
  errorResponse,
  Id,
  isArray,
  isErrorResponse,
  isFunction,
  isNonNullId,
  isRequest,
  isResultResponse,
  Message,
  NonNullId,
  Params,
  Request,
  ResultResponse,
  resultResponse,
  Value,
} from "./model.ts";
import { Transport } from "./transport.ts";

export abstract class AbstractJsonRpc2 {
  protected readonly messageTransport: Transport<Message>;
  protected readonly deferredResolutions: Map<NonNullId, {
    resolve: (response: ResultResponse<Value>) => void;
    reject: (error: ErrorResponse<Value>) => void;
  }> = new Map();

  constructor(messageTransport: Transport<Message>) {
    this.messageTransport = messageTransport;
  }
}

export abstract class ProxyBasedJsonRpc2<
  LX extends ProxyableObject,
  RX extends ProxyableObject,
> extends AbstractJsonRpc2 {
  readonly local: LX;
  readonly remote: RX;

  constructor(messageTransport: Transport<Message>, local: LX, remote: RX) {
    super(messageTransport);
    messageTransport.addListener(this.handleMessage.bind(this));
    this.local = local;
    this.remote = new Proxy(
      remote,
      new JsonRpc2ProxyHandler(this),
    ) as RX;
  }

  async call<P extends Params, I extends Id, R extends Value, E extends Value>(
    req: Request<P, I>,
  ): Promise<AnyResponse<R, E> | void> {
    const id = req.id;
    if (!isNonNullId(id)) return;
    const promise: Promise<AnyResponse<R, E> | void> = new Promise(
      (resolve, reject) => {
        // @ts-ignore
        this.deferredResolutions.set(id, { resolve, reject });
      },
    );
    await this.messageTransport.send(req);
    return promise;
  }

  async handleMessage(message: Message): Promise<void> {
    if (isResultResponse(message) || isErrorResponse(message)) {
      return this.handleAnyResponse(message);
    }

    if (isRequest(message)) {
      return this.handleRequest(message);
    }
  }

  protected async handleAnyResponse(response: AnyResponse<Value, Value>) {
    if (!this.deferredResolutions.has(response.id)) {
      return;
    }
    const { resolve, reject } = this.deferredResolutions.get(response.id)!;

    if (isResultResponse(response)) {
      return resolve(response);
    }
    if (isErrorResponse(response)) {
      return reject(response);
    }
  }

  protected async handleRequest(request: Request<Params, Id>) {
    const id = request.id;
    const params: Params = request.params ?? [];

    let method: Function = this.local[request.method];
    if (!isFunction(method)) {
      if (isNonNullId(id)) {
        this.messageTransport.send(
          errorResponse(
            id,
            ErrorCode.MethodNotFound,
            `Method ${request.method} not found.`,
          ),
        );
      }
      return;
    }
    method = method.bind(this.local);

    if (isNonNullId(id)) {
      const returned = isArray(params) ? method(...params) : method(params);
      Promise.resolve(returned).then(
        (result) => {
          this.messageTransport.send(resultResponse(id, result));
        },
        (error) => {
          this.messageTransport.send(
            errorResponse(id, error.code, error.message ?? error.name, error),
          );
        },
      );
    } else {
      isArray(params) ? method(...params) : method(params);
    }
  }
}

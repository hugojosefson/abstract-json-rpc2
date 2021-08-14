import {
  JsonRpc2ProxyHandler,
  ProxyableObject,
} from "./json-rpc2-proxy-handler.ts";
import {
  Id,
  isNonNullId,
  isRequest,
  isResponse,
  NonNullId,
  Params,
  Request,
  Response,
  Value,
} from "./types.ts";

type Message = Request<Params, Id> | Response<Value, Id, Value>;

export type Listener<T> = (t: T) => void;
export type MessageListener = Listener<Message>;
export type ListenerRemover = () => void;

export interface Transporter {
  send(
    message: Message,
  ): Promise<void>;

  addMessageListener(messageListener: MessageListener): ListenerRemover;
}

export abstract class StringTransporter implements Transporter {
  readonly #messageListeners: Set<MessageListener> = new Set();

  addMessageListener(messageListener: MessageListener): ListenerRemover {
    this.#messageListeners.add(messageListener);
    return () => this.#messageListeners.delete(messageListener);
  }

  send(
    message: Message,
  ): Promise<void> {
    return this.sendString(JSON.stringify(message));
  }

  abstract sendString(message: string): Promise<void>;

  addStringListener(stringListener: Listener<string>) {
    return this.addMessageListener((message: Message) =>
      stringListener(JSON.stringify(message))
    );
  }
}

export abstract class AbstractJsonRpc2 {
  protected readonly transporter: Transporter;
  protected readonly deferredResolutions: Map<
    NonNullId,
    {
      resolve: (response: Response<any, any, any>) => void;
      reject: (error: any) => void;
    }
  > = new Map();

  constructor(transporter: Transporter) {
    this.transporter = transporter;
  }

  abstract call<
    P extends Params,
    I extends Id,
    R extends Value,
    E extends Value,
  >(
    req: Request<P, I>,
  ): Promise<Response<R, I, E> | void>;

  abstract handleResponse<
    R extends Value,
    I extends Id,
    E extends Value,
  >(
    response: Response<R, I, E>,
  ): void;
}

export abstract class ProxyBasedJsonRpc2 extends AbstractJsonRpc2 {
  constructor(transporter: Transporter) {
    super(transporter);
    transporter.addMessageListener((message: Message) => {
      if (isRequest(message)) {
        this.call(message);
      }
      if (isResponse(message)) {
        this.handleCall(message);
      }
    });
  }

  wrap<T extends ProxyableObject>(
    delegate: T,
  ): T {
    return new Proxy(
      delegate,
      new JsonRpc2ProxyHandler(this),
    ) as T;
  }

  async call<P extends Params, I extends Id, R extends Value, E extends Value>(
    req: Request<P, I>,
  ): Promise<Response<R, I, E> | void> {
    await this.transporter.send(req);
    const id = req.id;
    if (!isNonNullId(id)) return;
    return new Promise((resolve, reject) => {
      this.deferredResolutions.set(id, { resolve, reject });
    });
  }

  handleResponse<R extends Value, I extends Id, E extends Value>(
    response: Response<R, I, E>,
  ): void {
  }
}

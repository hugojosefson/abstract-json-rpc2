import { Message } from "./model.ts";

export type Listener<T> = (data: T) => void;
export type ListenerRemover = () => void;

export interface Transport<T> {
  send(data: T): Promise<void>;

  addListener(listener: Listener<T>): ListenerRemover;
}

export abstract class BaseTransport<T> implements Transport<T> {
  protected readonly listeners: Set<Listener<T>> = new Set();

  addListener(listener: Listener<T>): ListenerRemover {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  abstract send(data: T): Promise<void>;
}

export function stringTransportToMessageTransport(
  stringTransport: Transport<string>,
): Transport<Message> {
  return {
    addListener(messageListener: Listener<Message>): ListenerRemover {
      return stringTransport.addListener(
        (s: string) => messageListener(JSON.parse(s) as Message),
      );
    },
    send(message: Message): Promise<void> {
      return stringTransport.send(JSON.stringify(message));
    },
  };
}

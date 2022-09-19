import { SfuEvent } from '../gen/sfu_events/events';

export type SfuEventListener = (event: SfuEvent) => void;

export class Dispatcher {
  private subscribers: {
    [eventName: string]: SfuEventListener[] | undefined;
  } = {};

  dispatch = (message: SfuEvent) => {
    const eventKind = message.eventPayload.oneofKind;
    if (eventKind) {
      // @ts-ignore
      console.log(`Dispatching`, eventKind, message.eventPayload[eventKind]);
      const listeners = this.subscribers[eventKind];
      listeners?.forEach((fn) => {
        try {
          fn(message);
        } catch (e) {
          console.warn(`Listener failed with error`, e);
        }
      });
    }
  };

  on = (eventName: string, fn: SfuEventListener) => {
    (this.subscribers[eventName] ??= []).push(fn);
    return () => {
      this.off(eventName, fn);
    };
  };

  off = (eventName: string, fn: SfuEventListener) => {
    this.subscribers[eventName] = (this.subscribers[eventName] || []).filter(
      (f) => f !== fn,
    );
  };

  offAll = (eventName?: string) => {
    if (eventName) {
      this.subscribers[eventName] = [];
    } else {
      this.subscribers = {};
    }
  };
}

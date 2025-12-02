import type { EventSubscription } from 'react-native';
import NativeCallingModule from './spec/NativeCallingx';
import type { EventData, EventName, EventParams } from './types';

type EventListener<T> = (params: T) => void;

class EventManager {
  private listenersCount: number = 0;
  private eventListeners: Map<
    EventName,
    EventListener<EventParams[EventName]>[]
  > = new Map();
  private subscription: EventSubscription | null = null;

  addListener<T extends EventName>(
    eventName: T,
    callback: EventListener<EventParams[T]>
  ): void {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.push(callback as EventListener<EventParams[EventName]>);
    this.eventListeners.set(eventName, listeners);

    this.listenersCount++;

    if (this.subscription === null) {
      this.subscription = NativeCallingModule.onNewEvent((event: EventData) => {
        console.log('[callingx] NativeCallingModule.onNewEvent', event);
        const eventListeners =
          this.eventListeners.get(event.eventName as EventName) || [];
        eventListeners.forEach((listener) =>
          listener(event.params as EventParams[EventName])
        );
      });
    }
  }

  removeListener<T extends EventName>(
    eventName: T,
    callback: EventListener<EventParams[T]>
  ): void {
    const listeners = this.eventListeners.get(eventName) || [];
    this.eventListeners.set(
      eventName,
      listeners.filter((c) => c !== callback)
    );

    this.listenersCount--;

    if (this.listenersCount === 0) {
      this.subscription?.remove();
      this.subscription = null;
    }

    console.log(
      '!!! remove listener',
      this.listenersCount,
      this.subscription === null ? 'null' : 'not null'
    );
  }
}

export { EventManager, type EventName, type EventParams, type EventListener };

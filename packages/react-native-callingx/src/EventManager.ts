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
    callback: EventListener<EventParams[T]>,
  ): void {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.push(callback as EventListener<EventParams[EventName]>);
    this.eventListeners.set(eventName, listeners);

    this.listenersCount++;

    if (this.subscription === null) {
      this.subscription = NativeCallingModule.onNewEvent((event: EventData) => {
        if (__DEV__) {
          console.log('[Callingx] EventManager: onNewEvent:', event);
        }
        const eventListeners =
          this.eventListeners.get(event.eventName as EventName) || [];
        eventListeners.forEach((listener) =>
          listener(event.params as EventParams[EventName]),
        );
      });
    }
  }

  removeListener<T extends EventName>(
    eventName: T,
    callback: EventListener<EventParams[T]>,
  ): void {
    const listeners = this.eventListeners.get(eventName) || [];
    const updatedListeners = listeners.filter((c) => c !== callback);
    this.eventListeners.set(eventName, updatedListeners);

    if (updatedListeners.length !== listeners.length) {
      this.listenersCount--;
    }

    if (this.listenersCount === 0) {
      this.subscription?.remove();
      this.subscription = null;
    }
  }
}

export { EventManager, type EventName, type EventParams, type EventListener };

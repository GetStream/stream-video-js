import { NativeEventEmitter, type EventSubscription } from 'react-native';
import NativeCallingModule from './spec/NativeCallingx';
import type {
  EventData,
  EventName,
  VoipEventData,
  VoipEventName,
} from './types';
import { isVoipEvent, isTurboModuleEnabled } from './utils/utils';

type EventListener<T> = (params: T) => void;

class EventManager<Name extends EventName | VoipEventName, Params> {
  private listenersCount: number = 0;
  private eventListeners: Map<Name, EventListener<Params>[]> = new Map();
  private subscription: EventSubscription | null = null;

  addListener<T extends Name>(
    eventName: T,
    callback: EventListener<Params>,
  ): void {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.push(callback as EventListener<Params>);
    this.eventListeners.set(eventName, listeners);
    this.listenersCount++;

    if (this.subscription === null) {
      const eventHandler = (event: EventData | VoipEventData) => {
        const eventListeners =
          this.eventListeners.get(event.eventName as Name) || [];
        eventListeners.forEach((listener) => listener(event.params as Params));
      };

      if (isTurboModuleEnabled) {
        if (isVoipEvent(eventName)) {
          this.subscription = NativeCallingModule.onNewVoipEvent(eventHandler);
        } else {
          this.subscription = NativeCallingModule.onNewEvent(eventHandler);
        }
      } else {
        const nativeEmitter = new NativeEventEmitter(
          NativeCallingModule as any,
        );
        const nativeEventName = isVoipEvent(eventName)
          ? 'onNewVoipEvent'
          : 'onNewEvent';
        this.subscription = nativeEmitter.addListener(
          nativeEventName,
          eventHandler as any,
        );
      }
    }
  }

  removeListener<T extends Name>(
    eventName: T,
    callback: EventListener<Params>,
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

export { EventManager, type EventListener };

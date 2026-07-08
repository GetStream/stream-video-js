import { NativeEventEmitter, type EventSubscription } from 'react-native';
import NativeCallingModule from './spec/NativeCallingx';
import type {
  EventData,
  EventName,
  VoipEventData,
  VoipEventName,
} from './types';
import { isVoipEvent, isTurboModuleEnabled } from './utils/utils';
import type { AudioEndpointsSnapshot } from './types';

type EventListener<T> = (params: T) => void;

/**
 * Native carries the audio-endpoints snapshot as a single JSON string (`snapshot`) to survive
 * event-param flattening across the bridge. Expand it into the structured public shape here.
 */
const normalizeEventParams = (event: EventData | VoipEventData): unknown => {
  if (event.eventName !== 'didChangeAudioEndpoints') {
    return event.params;
  }
  const raw = event.params as { callId?: string; snapshot?: string };
  const fallback: AudioEndpointsSnapshot = {
    endpoints: [],
    currentEndpoint: null,
  };
  let snapshot = fallback;
  if (raw.snapshot) {
    try {
      snapshot = JSON.parse(raw.snapshot) as AudioEndpointsSnapshot;
    } catch {
      snapshot = fallback;
    }
  }
  return { callId: raw.callId, ...snapshot };
};

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
        const params = normalizeEventParams(event);
        eventListeners.forEach((listener) => listener(params as Params));
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

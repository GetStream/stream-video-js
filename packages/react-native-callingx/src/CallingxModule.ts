import { Platform } from 'react-native';
import NativeCallingModule from './spec/NativeCallingx';
import {
  HEADLESS_TASK_NAME,
  registerHeadlessTask,
  setHeadlessTask,
} from './utils/headlessTask';
import type { ManagableTask } from './utils/headlessTask';
import { EventManager } from './EventManager';
import type { EventListener } from './EventManager';
import {
  type ICallingxModule,
  type InfoDisplayOptions,
  type EndCallReason,
  type EventData,
  type EventName,
  type EventParams,
  type CallingExpOptions,
  type DefaultDeviceEndpointType,
  type VoipEventName,
  type VoipEventParams,
  type VoipEventData,
} from './types';
import {
  androidEndCallReasonMap,
  defaultAndroidOptions,
  defaultiOSOptions,
  iosEndCallReasonMap,
} from './utils/constants';
import { isVoipEvent } from './utils/utils';

class CallingxModule implements ICallingxModule {
  // Grace period for the debounced keep-alive stop: a re-acquire within this window (e.g. the
  // ringing-push -> keep-alive hand-off) cancels the stop and reuses the running task.
  private static readonly KEEP_ALIVE_STOP_DEBOUNCE_MS = 2000;

  private _isSetup = false;
  private _isOngoingCallsEnabled = {
    android: false,
    ios: false,
  };
  // Ref-counted keep-alive ownership over the single native background-task slot.
  // This prevents one caller from tearing down the task another still needs.
  private _keepAliveOwners = new Set<string>();
  private _keepAliveResolve: (() => void) | undefined;
  // Pending debounced stop. When the last owner releases we defer the actual stop briefly; a
  // re-acquire within the window cancels it and reuses the running task. This keeps the task
  // continuous across the ringing-push -> keep-alive hand-off.
  private _keepAliveStopTimer: ReturnType<typeof setTimeout> | undefined;

  private titleTransformer: (memberName: string, incoming: boolean) => string =
    (memberName: string) => memberName;

  private eventManager: EventManager<EventName, EventParams> =
    new EventManager();
  private voipEventManager: EventManager<VoipEventName, VoipEventParams> =
    new EventManager();

  get canPostNotifications(): boolean {
    if (Platform.OS !== 'android') {
      return true;
    }

    return NativeCallingModule.canPostNotifications();
  }

  get isOngoingCallsEnabled(): boolean {
    return Platform.OS === 'ios'
      ? this._isOngoingCallsEnabled.ios
      : this._isOngoingCallsEnabled.android;
  }

  get isSetup(): boolean {
    return this._isSetup;
  }

  setup(options: CallingExpOptions): void {
    if (this._isSetup) {
      return;
    }

    this._isOngoingCallsEnabled = {
      android: options.android?.enableOngoingCalls ?? false,
      ios: options.ios?.enableOngoingCalls ?? false,
    };
    this.setShouldRejectCallWhenBusy(options.shouldRejectCallWhenBusy ?? false);

    if (Platform.OS === 'ios') {
      NativeCallingModule.setupiOS({ ...defaultiOSOptions, ...options.ios });
      if (options.ios?.defaultDeviceEndpointType) {
        NativeCallingModule.setDefaultAudioDeviceEndpointType(
          options.ios.defaultDeviceEndpointType,
        );
      }
    }

    if (Platform.OS === 'android') {
      const {
        titleTransformer,
        incomingChannel,
        ongoingChannel,
        notificationTexts,
        skipIncomingPushInForeground = false,
      } = options.android ?? {};

      this.titleTransformer =
        titleTransformer ?? ((memberName: string) => memberName);

      const notificationsConfig = {
        incomingChannel: {
          ...defaultAndroidOptions.incomingChannel,
          ...(incomingChannel ?? {}),
        },
        ongoingChannel: {
          ...defaultAndroidOptions.ongoingChannel,
          ...(ongoingChannel ?? {}),
        },
        notificationTexts,
        skipIncomingPushInForeground,
      };

      if (
        notificationsConfig.incomingChannel.id ===
        notificationsConfig.ongoingChannel.id
      ) {
        throw new Error('Incoming and outgoing channel IDs cannot be the same');
      }

      NativeCallingModule.setupAndroid(notificationsConfig);

      registerHeadlessTask();
    }

    this._isSetup = true;
  }

  setShouldRejectCallWhenBusy(shouldReject: boolean): void {
    NativeCallingModule.setShouldRejectCallWhenBusy(shouldReject);
  }

  setDefaultAudioDeviceEndpointType(
    endpointType: DefaultDeviceEndpointType,
  ): void {
    if (Platform.OS !== 'ios') return;
    NativeCallingModule.setDefaultAudioDeviceEndpointType(endpointType);
  }

  getInitialEvents(): EventData[] {
    return NativeCallingModule.getInitialEvents() as EventData[];
  }

  getInitialVoipEvents(): VoipEventData[] {
    return NativeCallingModule.getInitialVoipEvents() as VoipEventData[];
  }

  //activates call that was registered with the telecom stack
  setCurrentCallActive(callId: string): Promise<void> {
    return NativeCallingModule.setCurrentCallActive(callId);
  }

  displayIncomingCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
  ): Promise<void> {
    const displayOptions: InfoDisplayOptions = {
      displayTitle: this.titleTransformer(callerName, true),
    };
    return NativeCallingModule.displayIncomingCall(
      callId,
      phoneNumber,
      callerName,
      hasVideo,
      displayOptions,
    );
  }

  answerIncomingCall(callId: string): Promise<void> {
    return NativeCallingModule.answerIncomingCall(callId);
  }

  //registers call with the telecom stack
  startCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
  ): Promise<void> {
    const displayOptions: InfoDisplayOptions = {
      displayTitle: this.titleTransformer(callerName, false),
    };
    return NativeCallingModule.startCall(
      callId,
      phoneNumber,
      callerName,
      hasVideo,
      displayOptions,
    );
  }

  updateDisplay(
    callId: string,
    phoneNumber: string,
    callerName: string,
    incoming: boolean,
  ): Promise<void> {
    const displayOptions: InfoDisplayOptions = {
      displayTitle: this.titleTransformer(callerName, incoming),
    };
    return NativeCallingModule.updateDisplay(
      callId,
      phoneNumber,
      callerName,
      displayOptions,
    );
  }

  endCallWithReason(callId: string, reason: EndCallReason): Promise<void> {
    const reasons =
      Platform.OS === 'ios' ? iosEndCallReasonMap : androidEndCallReasonMap;

    if (Platform.OS === 'ios' && reason === 'local') {
      return NativeCallingModule.endCall(callId);
    }

    return NativeCallingModule.endCallWithReason(callId, reasons[reason]);
  }

  isCallTracked(callId: string): boolean {
    return NativeCallingModule.isCallTracked(callId);
  }

  hasRegisteredCall(): boolean {
    return NativeCallingModule.hasRegisteredCall();
  }

  setMutedCall(callId: string, isMuted: boolean): Promise<void> {
    return NativeCallingModule.setMutedCall(callId, isMuted);
  }

  setOnHoldCall(callId: string, isOnHold: boolean): Promise<void> {
    return NativeCallingModule.setOnHoldCall(callId, isOnHold);
  }

  private registerBackgroundTask(taskProvider: ManagableTask): void {
    // We intentionally do NOT route stops through NativeCallingModule.stopBackgroundTask: that uses
    // startService, so when no CallService is running (the call already ended -> onDestroy) it would
    // spin up a throwaway CallService just to deliver a no-op stop, which then lingers.
    const noopStop = () => {};

    setHeadlessTask((taskData: any) => taskProvider(taskData, noopStop));

    NativeCallingModule.registerBackgroundTaskAvailable();
  }

  async acquireBackgroundTask(owner: string): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    // A new owner means we keep the task alive — cancel any pending debounced stop.
    if (this._keepAliveStopTimer) {
      clearTimeout(this._keepAliveStopTimer);
      this._keepAliveStopTimer = undefined;
    }

    const wasEmpty = this._keepAliveOwners.size === 0;
    this._keepAliveOwners.add(owner);

    if (!wasEmpty) {
      return;
    }

    // First owner, or a re-acquire right after the last release (we just cancelled its pending
    // stop). Either way we (re-)issue the native start: HeadlessTaskManager ignores it if the task
    // is genuinely still running (e.g. CallService stayed alive across the hand-off), or starts a
    // fresh one if the task was already torn down by CallService.onDestroy (e.g. declining one call
    // and accepting another). Idempotent + self-healing across a CallService teardown.
    this.registerBackgroundTask(
      () =>
        new Promise<void>((resolve) => {
          if (this._keepAliveOwners.size === 0 && !this._keepAliveStopTimer) {
            resolve();
            return;
          }
          this._keepAliveResolve = resolve;
        }),
    );
    await NativeCallingModule.startBackgroundTask(HEADLESS_TASK_NAME, 0);
  }

  async releaseBackgroundTask(owner: string): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    if (!this._keepAliveOwners.delete(owner)) {
      return;
    }
    if (this._keepAliveOwners.size > 0 || this._keepAliveStopTimer) {
      return;
    }
    // Last owner released — defer the actual stop. A re-acquire within the window (e.g. the
    // ringing-push -> keep-alive hand-off) cancels this and reuses the still-running task, avoiding
    // a stop/restart race on the single native task slot.
    this._keepAliveStopTimer = setTimeout(() => {
      this._keepAliveStopTimer = undefined;
      if (this._keepAliveOwners.size > 0) {
        return;
      }
      this._keepAliveResolve?.();
      this._keepAliveResolve = undefined;
    }, CallingxModule.KEEP_ALIVE_STOP_DEBOUNCE_MS);
  }

  fulfillAnswerCallAction(callId: string, didFail: boolean): void {
    NativeCallingModule.fulfillAnswerCallAction(callId, didFail);
  }

  fulfillEndCallAction(callId: string, didFail: boolean): void {
    NativeCallingModule.fulfillEndCallAction(callId, didFail);
  }

  registerVoipToken(): void {
    NativeCallingModule.registerVoipToken();
  }

  stopService(): Promise<void> {
    return NativeCallingModule.stopService();
  }

  addEventListener<T extends EventName | VoipEventName>(
    eventName: T,
    callback: EventListener<
      T extends EventName
        ? EventParams[T]
        : T extends VoipEventName
          ? VoipEventParams[T]
          : never
    >,
  ): { remove: () => void } {
    type ManagerType = EventManager<EventName | VoipEventName, any>;

    const manager: ManagerType = (
      isVoipEvent(eventName) ? this.voipEventManager : this.eventManager
    ) as ManagerType;

    manager.addListener(eventName, callback as any);

    return {
      remove: () => {
        manager.removeListener(eventName, callback as any);
      },
    };
  }

  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    NativeCallingModule.log(message, level);
  }
}

const module = new CallingxModule();
export default module;

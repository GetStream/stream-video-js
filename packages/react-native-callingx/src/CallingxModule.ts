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
  type TextTransformer,
  type EndCallReason,
  type EventData,
  type EventName,
  type EventParams,
  type CallingExpOptions,
  type VoipEventName,
  type VoipEventParams,
  type VoipEventData,
} from './types';
import {
  androidEndCallReasonMap,
  defaultAndroidOptions,
  defaultiOSOptions,
  defaultTextTransformer,
  iosEndCallReasonMap,
} from './utils/constants';
import { isTurboModuleEnabled, isVoipEvent } from './utils/utils';

class CallingxModule implements ICallingxModule {
  private _isSetup = false;
  private _isOngoingCallsEnabled = false;
  private _isHeadlessTaskRegistered = false;

  private titleTransformer: TextTransformer = (text: string) => text;
  private subtitleTransformer: TextTransformer | undefined = undefined;

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
    return this._isOngoingCallsEnabled;
  }

  get isSetup(): boolean {
    return this._isSetup;
  }

  setup(options: CallingExpOptions): void {
    if (this._isSetup) {
      return;
    }

    this._isOngoingCallsEnabled = options.enableOngoingCalls ?? false;
    this.setShouldRejectCallWhenBusy(options.shouldRejectCallWhenBusy ?? false);

    if (Platform.OS === 'ios') {
      NativeCallingModule.setupiOS({ ...defaultiOSOptions, ...options.ios });
    }

    if (Platform.OS === 'android') {
      const {
        titleTransformer,
        subtitleTransformer,
        incomingChannel,
        ongoingChannel,
      } = options.android ?? {};

      this.titleTransformer = titleTransformer ?? defaultTextTransformer;
      this.subtitleTransformer = subtitleTransformer;

      const notificationsConfig = {
        incomingChannel: {
          ...defaultAndroidOptions.incomingChannel,
          ...(incomingChannel ?? {}),
        },
        ongoingChannel: {
          ...defaultAndroidOptions.ongoingChannel,
          ...(ongoingChannel ?? {}),
        },
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
      displaySubtitle: this.subtitleTransformer?.(phoneNumber, true),
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
      displaySubtitle: this.subtitleTransformer?.(phoneNumber, false),
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
  ): Promise<void> {
    const displayOptions: InfoDisplayOptions = {
      displayTitle: this.titleTransformer(callerName, false), //adjust incoming or outgoing call
      displaySubtitle: this.subtitleTransformer?.(phoneNumber, false), //adjust incoming or outgoing call
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

  registerBackgroundTask(taskProvider: ManagableTask): void {
    const stopTask = () => {
      this._isHeadlessTaskRegistered = false;
      NativeCallingModule.stopBackgroundTask(HEADLESS_TASK_NAME);
    };

    setHeadlessTask((taskData: any) => taskProvider(taskData, stopTask));

    this._isHeadlessTaskRegistered = true;
    NativeCallingModule.registerBackgroundTaskAvailable();
  }

  async startBackgroundTask(taskProvider?: ManagableTask): Promise<void> {
    // If taskProvider is provided, register it first
    if (taskProvider) {
      this.registerBackgroundTask(taskProvider);
    }

    // Check if task is registered
    if (!this._isHeadlessTaskRegistered) {
      throw new Error(
        'Background task not registered. Call registerBackgroundTask first.',
      );
    }

    // Check if service is started (Android only)
    if (Platform.OS === 'android') {
      const isServiceStarted = await NativeCallingModule.isServiceStarted();
      if (!isServiceStarted) {
        throw new Error(
          'Service is not started. Call displayIncomingCall or startCall first.',
        );
      }
    }

    return NativeCallingModule.startBackgroundTask(HEADLESS_TASK_NAME, 0);
  }

  stopBackgroundTask(): Promise<void> {
    this._isHeadlessTaskRegistered = false;
    return NativeCallingModule.stopBackgroundTask(HEADLESS_TASK_NAME);
  }

  registerVoipToken(): void {
    NativeCallingModule.registerVoipToken();
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

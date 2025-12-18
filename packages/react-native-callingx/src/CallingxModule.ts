import { Platform } from 'react-native';
import NativeCallingModule from './spec/NativeCallingx';
import {
  checkCallPermissions,
  requestCallPermissions,
} from './utils/permissions';
import type { PermissionsResult } from './utils/permissions';
import {
  HEADLESS_TASK_NAME,
  registerHeadlessTask,
  setHeadlessTask,
} from './utils/headlessTask';
import type { ManagableTask } from './utils/headlessTask';
import { EventManager } from './EventManager';
import type { EventListener, EventName, EventParams } from './EventManager';
import {
  type ICallingxModule,
  type InfoDisplayOptions,
  type TextTransformer,
  type EndCallReason,
  type EventData,
  type Options,
} from './types';
import {
  androidEndCallReasonMap,
  defaultAndroidOptions,
  defaultiOSOptions,
  defaultTextTransformer,
  iosEndCallReasonMap,
} from './utils/constants';

class CallingxModule implements ICallingxModule {
  private _isNotificationsAllowed = false;
  private _isOutcomingCallsEnabled = false;

  private titleTransformer: TextTransformer = (text: string) => text;
  private subtitleTransformer: TextTransformer | undefined = undefined;

  private eventManager: EventManager = new EventManager();

  get isOutcomingCallsEnabled(): boolean {
    return this._isOutcomingCallsEnabled;
  }

  get isNotificationsAllowed(): boolean {
    if (Platform.OS !== 'android') {
      return true;
    }

    return (
      this._isNotificationsAllowed && NativeCallingModule.canPostNotifications()
    );
  }

  setup(options: Options): void {
    this._isOutcomingCallsEnabled = options.enableOutcomingCalls ?? false;

    if (Platform.OS === 'ios') {
      NativeCallingModule.setupiOS({ ...defaultiOSOptions, ...options.ios });
    }

    if (Platform.OS === 'android') {
      const {
        titleTransformer,
        subtitleTransformer,
        incomingChannel,
        outgoingChannel,
      } = options.android ?? {};

      this.titleTransformer = titleTransformer ?? defaultTextTransformer;
      this.subtitleTransformer = subtitleTransformer;

      const notificationsConfig = {
        incomingChannel: {
          ...defaultAndroidOptions.incomingChannel,
          ...(incomingChannel ?? {}),
        },
        outgoingChannel: {
          ...defaultAndroidOptions.outgoingChannel,
          ...(outgoingChannel ?? {}),
        },
      };
      NativeCallingModule.setupAndroid(notificationsConfig);

      registerHeadlessTask();
    }

    //by default we will request permissions on setup call
    if (options.enableAutoPermissions ?? true) {
      this.requestPermissions()
        .then((result) => {
          console.log('Permissions result:', result);
        })
        .catch((error) => {
          console.error('Error requesting permissions:', error);
        });
    }
  }

  setShouldRejectCallWhenBusy(shouldReject: boolean): void {
    NativeCallingModule.setShouldRejectCallWhenBusy(shouldReject);
  }

  async requestPermissions(): Promise<PermissionsResult> {
    const result: {
      recordAudio: boolean;
      postNotifications: boolean;
    } = await requestCallPermissions();

    this._isNotificationsAllowed = result.postNotifications;
    return result;
  }

  async checkPermissions(): Promise<PermissionsResult> {
    const result: {
      recordAudio: boolean;
      postNotifications: boolean;
    } = await checkCallPermissions();

    this._isNotificationsAllowed = result.postNotifications;
    return result;
  }

  getInitialEvents(): EventData[] {
    return NativeCallingModule.getInitialEvents() as EventData[];
  }

  clearInitialEvents(): void {
    return NativeCallingModule.clearInitialEvents();
  }

  //activates call that was registered with the telecom stack
  setCurrentCallActive(callId: string): Promise<void> {
    return NativeCallingModule.setCurrentCallActive(callId);
  }

  displayIncomingCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean
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
      displayOptions
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
    hasVideo: boolean
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
      displayOptions
    );
  }

  updateDisplay(
    callId: string,
    phoneNumber: string,
    callerName: string
  ): Promise<void> {
    const displayOptions: InfoDisplayOptions = {
      displayTitle: this.titleTransformer(callerName, false),
      displaySubtitle: this.subtitleTransformer?.(phoneNumber, false),
    };
    return NativeCallingModule.updateDisplay(
      callId,
      phoneNumber,
      callerName,
      displayOptions
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

  isCallRegistered(callId: string): boolean {
    return NativeCallingModule.isCallRegistered(callId);
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

  startBackgroundTask(taskProvider: ManagableTask): Promise<void> {
    const stopTask = () => {
      NativeCallingModule.log(`stopBackgroundTask`, 'warn');
      NativeCallingModule.stopBackgroundTask(HEADLESS_TASK_NAME);
    };

    setHeadlessTask((taskData: any) => taskProvider(taskData, stopTask));

    return NativeCallingModule.startBackgroundTask(HEADLESS_TASK_NAME, 0);
  }

  stopBackgroundTask(): Promise<void> {
    return NativeCallingModule.stopBackgroundTask(HEADLESS_TASK_NAME);
  }

  addEventListener<T extends EventName>(
    eventName: T,
    callback: EventListener<EventParams[T]>
  ): { remove: () => void } {
    this.eventManager.addListener(eventName, callback);

    return {
      remove: () => {
        this.eventManager.removeListener(eventName, callback);
      },
    };
  }

  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    NativeCallingModule.log(message, level);
  }
}

const module = new CallingxModule();
export default module;

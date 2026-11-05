import { Platform } from 'react-native';
import NativeCallingModule from './NativeCallingx';
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
  type AudioEndpointsSnapshot,
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
  private _isSetup = false;
  private _isOngoingCallsEnabled = {
    android: false,
    ios: false,
  };

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

  get isTelecomBacked(): boolean {
    if (Platform.OS !== 'android') {
      return false;
    }
    return NativeCallingModule.isTelecomBacked();
  }

  setup = (options: CallingExpOptions): void => {
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
        defaultDeviceEndpointType,
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

      if (defaultDeviceEndpointType) {
        NativeCallingModule.setDefaultAudioDeviceEndpointType(
          defaultDeviceEndpointType,
        );
      }
    }

    this._isSetup = true;
  };

  wireAudioEngineSubscription(): void {
    if (Platform.OS !== 'ios') return;

    NativeCallingModule.wireAudioEngineSubscription();
  }

  unwireAudioEngineSubscription(): void {
    if (Platform.OS !== 'ios') return;

    NativeCallingModule.unwireAudioEngineSubscription();
  }

  setShouldRejectCallWhenBusy = (shouldReject: boolean): void => {
    NativeCallingModule.setShouldRejectCallWhenBusy(shouldReject);
  };

  setDefaultAudioDeviceEndpointType = (
    endpointType: DefaultDeviceEndpointType,
  ): void => {
    NativeCallingModule.setDefaultAudioDeviceEndpointType(endpointType);
  };

  getRegisteredCallIds = (): string[] => {
    if (Platform.OS !== 'android') {
      return [];
    }
    return NativeCallingModule.getRegisteredCallIds();
  };

  getAvailableAudioEndpoints = (callId: string): AudioEndpointsSnapshot => {
    const empty: AudioEndpointsSnapshot = {
      endpoints: [],
      currentEndpoint: null,
    };
    if (Platform.OS !== 'android') {
      return empty;
    }
    try {
      return JSON.parse(
        NativeCallingModule.getAvailableAudioEndpoints(callId),
      ) as AudioEndpointsSnapshot;
    } catch {
      return empty;
    }
  };

  requestAudioEndpointChange = (callId: string, endpointId: string): void => {
    if (Platform.OS !== 'android') {
      return;
    }
    NativeCallingModule.requestAudioEndpointChange(callId, endpointId);
  };

  getInitialEvents = (): EventData[] => {
    return NativeCallingModule.getInitialEvents() as EventData[];
  };

  getInitialVoipEvents = (): VoipEventData[] => {
    return NativeCallingModule.getInitialVoipEvents() as VoipEventData[];
  };

  //activates call that was registered with the telecom stack
  setCurrentCallActive = (callId: string): void => {
    NativeCallingModule.setCurrentCallActive(callId);
  };

  displayIncomingCall = (
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
  ): Promise<void> => {
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
  };

  answerIncomingCall = (callId: string): void => {
    NativeCallingModule.answerIncomingCall(callId);
  };

  //registers call with the telecom stack
  startCall = (
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
  ): Promise<void> => {
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
  };

  updateDisplay = (
    callId: string,
    phoneNumber: string,
    callerName: string,
    incoming: boolean,
  ): void => {
    const displayOptions: InfoDisplayOptions = {
      displayTitle: this.titleTransformer(callerName, incoming),
    };
    NativeCallingModule.updateDisplay(
      callId,
      phoneNumber,
      callerName,
      displayOptions,
    );
  };

  endCallWithReason = (callId: string, reason: EndCallReason): void => {
    const reasons =
      Platform.OS === 'ios' ? iosEndCallReasonMap : androidEndCallReasonMap;

    if (Platform.OS === 'ios' && reason === 'local') {
      NativeCallingModule.endCall(callId);
      return;
    }

    NativeCallingModule.endCallWithReason(callId, reasons[reason]);
  };

  isCallTracked = (callId: string): boolean => {
    return NativeCallingModule.isCallTracked(callId);
  };

  hasRegisteredCall = (): boolean => {
    return NativeCallingModule.hasRegisteredCall();
  };

  setMutedCall = (callId: string, isMuted: boolean): void => {
    NativeCallingModule.setMutedCall(callId, isMuted);
  };

  setOnHoldCall = (callId: string, isOnHold: boolean): void => {
    NativeCallingModule.setOnHoldCall(callId, isOnHold);
  };

  startBackgroundTask = (): void => {
    if (Platform.OS !== 'android') {
      return;
    }
    NativeCallingModule.startBackgroundTask();
  };

  getFcmToken = async (): Promise<string> => {
    if (Platform.OS !== 'android') {
      return '';
    }
    return NativeCallingModule.getFcmToken();
  };

  fulfillAnswerCallAction = (callId: string, didFail: boolean): void => {
    NativeCallingModule.fulfillAnswerCallAction(callId, didFail);
  };

  fulfillEndCallAction = (callId: string, didFail: boolean): void => {
    NativeCallingModule.fulfillEndCallAction(callId, didFail);
  };

  registerVoipToken = (): void => {
    NativeCallingModule.registerVoipToken();
  };

  setVoipTokenRegistered = (registered: boolean): void => {
    NativeCallingModule.setVoipTokenRegistered(registered);
  };

  stopService = (): void => {
    NativeCallingModule.stopService();
  };

  addEventListener = <T extends EventName | VoipEventName>(
    eventName: T,
    callback: EventListener<
      T extends EventName
        ? EventParams[T]
        : T extends VoipEventName
          ? VoipEventParams[T]
          : never
    >,
  ): { remove: () => void } => {
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
  };

  log = (message: string, level: 'debug' | 'info' | 'warn' | 'error'): void => {
    NativeCallingModule.log(message, level);
  };
}

const module = new CallingxModule();
export default module;

/*   KRISP TECHNOLOGIES, INC
  __________________

  [2018] - [2023] Krisp Technologies, Inc
  All Rights Reserved.

  NOTICE: By accessing this programming code, you acknowledge that you have read, understood, and agreed to the User Agreement available at
  https://krisp.ai/terms-of-use.
  Please note that ALL information contained herein is and remains the property of Krisp Technologies, Inc., and its affiliates or assigns, if any. The intellectual property
  contained herein is proprietary to Krisp Technologies, Inc. and may be covered by pending and granted U.S. and Foreign Patents, and is further protected by
  copyright, trademark and/or other forms of intellectual property protection.
  Dissemination of this information or reproduction of this material IS STRICTLY FORBIDDEN.
 */
declare class AudioFilterNode
  extends AudioWorkletNode
  implements IAudioFilterNode
{
  private params;
  private _isReady;
  private enabled;
  private vad_enabled;
  private ndb_enabled;
  private nc_enabled;
  private wasmParams;
  private secondsCounterInterval;
  private worker;
  private get debugLogs();
  constructor(
    audioContext: BaseAudioContext,
    params: ISDKCreateNoiseFilterParams,
    onReady?: EventListener,
    onDispose?: EventListener,
  );
  private _onWasmWorkerMessage;
  postMessage(message: EventMessagesTypes, transfer?: Transferable[]): void;
  checkReadiness(): void;
  isReady(): boolean;
  isBVCEnabled(): boolean;
  isEnabled(): boolean;
  enable(): void;
  disable(): void;
  enableVAD(): void;
  disableVAD(): void;
  isVadEnabled(): boolean;
  enableNDB(): void;
  disableNDB(): void;
  isNdbEnabled(): boolean;
  enableNC(): void;
  disableNC(): void;
  isNcEnabled(): boolean;
  toggle(): void;
  dispose(): void;
  private startSecondsCounter;
}
declare class BVC {
  private allowedDevices;
  private blockedDevices;
  private runtimeAllowedDevices;
  init(params: ISDKOptionsParams): Promise<void>;
  dispose(): Promise<void>;
  add(deviceLabel: string, force?: boolean): boolean;
  remove(deviceLabel: string): boolean;
  loadFromURL(url: string): Promise<void>;
  isCompatible(device: MediaDeviceInfo | MediaStreamTrack): boolean;
  isCompatibleStream(stream: MediaStream): boolean;
}
declare class KrispSDK implements IKrispSDK {
  BVC: BVC;
  private params;
  private state;
  private get debugLogs();
  static isSupported(): boolean;
  constructor(options: ISDKPartialOptions);
  init(): Promise<void>;
  createNoiseFilter(
    props: AudioContext | ICreateNoiseFilterProps,
    onReady?: EventListener,
    onDispose?: EventListener,
  ): Promise<AudioFilterNode>;
  preload(models: PartialRecord<ModelNames, string>): Promise<boolean>;
  downloadReport(): Promise<boolean>;
  dispose(): void;
}
declare class SharedRingBuffer {
  private _state;
  private _bufferLength;
  private _channelCount;
  private _channelData;
  constructor(size: number, channelCount?: number);
  static from(ringBuffer: SharedRingBuffer): any;
  push(input: Float32Array[], blockLength: number): boolean;
  pull(output: Float32Array[], blockLength: number): boolean;
  /**
   * Helper function for debugging.
   * Prints currently available read and write.
   */
  printAvailableReadAndWrite(): void;
  /**
   * Returns number of samples available for read
   */
  getAvailableSamples(): number;
  /**
   * returns if frame of given size is available or not.
   */
  isFrameAvailable(size: number): boolean;
  getBufferLength(): number;
  private _getAvailableWrite;
  private _getAvailableRead;
}
export declare const enum EventMessages {
  INIT_WASM_PROCESSOR = 'INIT_WASM_PROCESSOR',
  INPUT_AUDIO_DATA = 'INPUT_AUDIO_DATA',
  BUFFER_OVERFLOW = 'BUFFER_OVERFLOW',
  REQUEST_NOISE_CANCELATION = 'REQUEST_NOISE_CANCELATION',
  OUTPUT_CLEAN_AUDIO_DATA = 'OUTPUT_CLEAN_AUDIO_DATA',
  TOGGLE = 'TOGGLE',
  ENABLE_NC = 'ENABLE_NC',
  DISABLE_NC = 'DISABLE_NC',
  ENABLE_VAD = 'ENABLE_VAD',
  DISABLE_VAD = 'DISABLE_VAD',
  ENABLE_NDB = 'ENABLE_NDB',
  DISABLE_NDB = 'DISABLE_NDB',
  DISPOSE = 'DISPOSE',
  SUSPEND = 'SUSPEND',
  RESUME = 'RESUME',
  WASM_PROCESSOR_INITIALIZED = 'WASM_PROCESSOR_INITIALIZED',
  SET_AUDIO_PROCESSOR_READY = 'SET_AUDIO_PROCESSOR_READY',
  SET_LOGGING_PORT = 'SET_LOGGING_PORT',
}
export declare const enum ModelNames {
  MODEL_RT = 'modelRT',
  MODEL_BVC = 'modelBVC',
  MODEL_VAD = 'modelVAD',
  MODEL_NDB = 'modelNDB',
  MODEL_8K = 'model8',
  MODEL_16K = 'model16',
  MODEL_32K = 'model32',
}
export declare type EventMessagesTypes =
  | MessageDataItem<EventMessages.INIT_WASM_PROCESSOR, IWasmParams>
  | MessageDataItem<EventMessages.INPUT_AUDIO_DATA, Float32Array>
  | MessageDataItem<
      EventMessages.BUFFER_OVERFLOW,
      {
        delayMS: number;
      }
    >
  | MessageDataItem<EventMessages.REQUEST_NOISE_CANCELATION, undefined>
  | MessageDataItem<EventMessages.OUTPUT_CLEAN_AUDIO_DATA, Float32Array>
  | MessageDataItem<EventMessages.TOGGLE, boolean | undefined>
  | MessageDataItem<EventMessages.ENABLE_NC, boolean | undefined>
  | MessageDataItem<EventMessages.DISABLE_NC, boolean | undefined>
  | MessageDataItem<EventMessages.ENABLE_VAD, boolean | undefined>
  | MessageDataItem<EventMessages.DISABLE_VAD, boolean | undefined>
  | MessageDataItem<EventMessages.ENABLE_NDB, boolean | undefined>
  | MessageDataItem<EventMessages.DISABLE_NDB, boolean | undefined>
  | MessageDataItem<EventMessages.SUSPEND, undefined>
  | MessageDataItem<EventMessages.RESUME, undefined>
  | MessageDataItem<EventMessages.DISPOSE, undefined>
  | MessageDataItem<EventMessages.WASM_PROCESSOR_INITIALIZED, boolean>
  | MessageDataItem<EventMessages.SET_AUDIO_PROCESSOR_READY, boolean>
  | MessageDataItem<EventMessages.SET_LOGGING_PORT, undefined>;
export declare type ISDKPartialOptions = {
  params: Partial<{
    models: PartialRecord<ModelNames, IURLOptions | string>;
    inboundModels: PartialRecord<ModelNames, IURLOptions | string>;
    useSharedArrayBuffer: boolean;
    logProcessStats: boolean;
    useBVC: boolean;
    bvc: {
      allowedDevices: string;
      allowedDevicesExt?: string;
    };
    debugLogs: boolean;
    bufferOverflowMS: number;
  }>;
};
export declare type ISampleRate =
  | number
  | 8000
  | 12000
  | 16000
  | 24000
  | 32000
  | 44100
  | 48000
  | 88200
  | 96000;
export declare type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};
export interface IAudioFilterNode extends AudioNode {
  dispose(): void;
  isEnabled(): boolean;
  enable(): void;
  disable(): void;
  toggle(): void;
}
export interface ICreateNoiseFilterProps {
  audioContext: AudioContext;
  stream: MediaStream;
  isInbound?: boolean;
  forceAllowBVC?: boolean;
  enableOnceReady?: boolean;
  useVAD?: boolean;
  vad?: {
    threshold: number;
  };
  useNDB?: boolean;
  ndb?: {
    active_duration: number;
    inactive_duration: number;
  };
}
export interface IKrispSDK {
  init(): void;
  dispose(): void;
  createNoiseFilter(
    audioContext: AudioContext | ICreateNoiseFilterProps,
    onReady?: EventListener,
    onDispose?: EventListener,
  ): Promise<AudioFilterNode>;
}
export interface ISDKCreateNoiseFilterParams extends ISDKOptionsParams {
  allowBVC: boolean;
  isInbound: boolean;
  enableOnceReady: boolean;
  useVAD?: boolean;
  vad?: {
    threshold: number;
  };
  useNDB?: boolean;
  ndb?: {
    active_duration: number;
    inactive_duration: number;
  };
}
export interface ISDKOptionsParams {
  models: PartialRecord<ModelNames, string>;
  inboundModels: PartialRecord<ModelNames, string>;
  preloadModels: PartialRecord<ModelNames, string>;
  preloadInboundModels: PartialRecord<ModelNames, string>;
  useSharedArrayBuffer: boolean;
  logProcessStats: boolean;
  useBVC: boolean;
  bvc?: {
    allowedDevices?: string;
    allowedDevicesExt?: string;
  };
  debugLogs: boolean;
  bufferOverflowMS: number;
}
export interface ISDKSharedOptions extends ISDKOptionsParams {
  sampleRate: ISampleRate | number;
  modelName: ModelNames;
  modelPath: string;
  allowBVC: boolean;
  isInbound: boolean;
  useVAD?: boolean;
  vad?: {
    threshold: number;
  };
  useNDB?: boolean;
  ndb?: {
    active_duration: number;
    inactive_duration: number;
  };
  sharedBuffers:
    | {
        inputRingBuffer: SharedRingBuffer;
        outputRingBuffer: SharedRingBuffer;
        atomicState: Int32Array;
      }
    | undefined;
}
export interface IURLOptions {
  url: string;
  preload?: boolean;
}
export interface IWasmParams extends ISDKSharedOptions {}
export interface MessageDataItem<T, B> {
  event: T;
  data: B;
}

export { KrispSDK as default };

/* KRISP TECHNOLOGIES, INC
__________________

[2018] - [2024] Krisp Technologies, Inc.
All Rights Reserved.

NOTICE: Access to and use of the Software are expressly conditioned upon compliance with the terms and conditions set forth in the Technology License Agreement or Software Evaluation Agreement executed between Krisp Technologies, Inc. and Your Company. In the absence of such an executed agreement, you are not authorized and have no right to access or use the Software, and any such unauthorized use is strictly prohibited.
 */
/* KRISP TECHNOLOGIES, INC
__________________

[2018] - [2024] Krisp Technologies, Inc.
All Rights Reserved.

NOTICE: Access to and use of the Software are expressly conditioned upon compliance with the terms and conditions set forth in the Technology License Agreement or Software Evaluation Agreement executed between Krisp Technologies, Inc. and Your Company. In the absence of such an executed agreement, you are not authorized and have no right to access or use the Software, and any such unauthorized use is strictly prohibited.
 */
declare class AudioFilterNode
  extends AudioWorkletNode
  implements IAudioFilterNode
{
  private params;
  private _isReady;
  private enabled;
  private vad_enabled;
  private nc_enabled;
  private ar_enabled;
  private wasmParams;
  private secondsCounterIntervalRef;
  private sessionStatsCounterIntervalRef;
  private sessionStatsIntervalMS;
  private worker;
  private get debugLogs();
  constructor(
    audioContext: BaseAudioContext,
    params: ISDKCreateFilterParams,
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
  enableNC(): void;
  enableAR(): void;
  getSessionStats(): void;
  getPerFrameStats(): void;
  disableNC(): void;
  disableAR(): void;
  isNcEnabled(): boolean;
  toggle(): void;
  dispose(): void;
  setNoiseSuppressionLevel(level: number): void;
  private startSessionStatsCounter;
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
  private eventBus;
  private get debugLogs();
  static isSupported(): boolean;
  constructor(options: ISDKPartialOptions);
  init(): Promise<void>;
  on<K extends keyof IKrispListeners>(
    eventName: K,
    callback: IKrispListeners[K],
  ): void;
  private dispatchModelLoadEvent;
  createNoiseFilter(
    props: AudioContext | ICreateNoiseFilterProps,
    onReady?: EventListener,
    onDispose?: EventListener,
  ): Promise<AudioFilterNode>;
  createAccentReductionFilter(
    props: AudioContext | ICreateAccentReductionFilterProps,
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
declare const AudioWorkletNode: {
  new (
    context: BaseAudioContext,
    name: string,
    options?: AudioWorkletNodeOptions | undefined,
  ): AudioWorkletNode;
  prototype: AudioWorkletNode;
};
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
  DISPOSE = 'DISPOSE',
  SUSPEND = 'SUSPEND',
  RESUME = 'RESUME',
  WASM_PROCESSOR_INITIALIZED = 'WASM_PROCESSOR_INITIALIZED',
  SET_AUDIO_PROCESSOR_READY = 'SET_AUDIO_PROCESSOR_READY',
  SET_LOGGING_PORT = 'SET_LOGGING_PORT',
  ERROR = 'ERROR',
  ENABLE_SESSION_STATS = 'ENABLE_SESSION_STATS',
  ENABLE_PER_FRAME_STATS = 'ENABLE_PER_FRAME_STATS',
  SET_NOISE_SUPPRESSION_LEVEL = 'SET_NOISE_SUPPRESSION_LEVEL',
  ENABLE_AR = 'ENABLE_AR',
  DISABLE_AR = 'DISABLE_AR',
}
export declare const enum KrispEvents {
  ON_MODEL_LOADED = 'on_model_loaded',
}
export declare const enum ModelNames {
  MODEL_INBOUND_8K = 'model_inbound_8',
  MODEL_INBOUND_16K = 'model_inbound_16',
  MODEL_RT = 'modelRT',
  MODEL_BVC = 'modelBVC',
  MODEL_VAD = 'modelVAD',
  MODEL_8K = 'model8',
  MODEL_NC = 'modelNC',
  MODEL_AR = 'modelAR',
}
export declare const enum WorkerErrorTypes {
  MODEL_URL_FETCH_ERROR = 'MODEL_URL_FETCH_ERROR',
  MODEL_LOAD_ERROR = 'MODEL_LOAD_ERROR',
  SAMPLING_RATE_NOT_SUPPORTED = 'SAMPLING_RATE_NOT_SUPPORTED',
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
  | MessageDataItem<EventMessages.SUSPEND, undefined>
  | MessageDataItem<EventMessages.ENABLE_VAD, boolean | undefined>
  | MessageDataItem<EventMessages.DISABLE_VAD, boolean | undefined>
  | MessageDataItem<EventMessages.RESUME, undefined>
  | MessageDataItem<EventMessages.DISPOSE, undefined>
  | MessageDataItem<EventMessages.WASM_PROCESSOR_INITIALIZED, boolean>
  | MessageDataItem<EventMessages.SET_AUDIO_PROCESSOR_READY, boolean>
  | MessageDataItem<EventMessages.SET_LOGGING_PORT, undefined>
  | MessageDataItem<
      EventMessages.ERROR,
      {
        errorCode: WorkerErrorTypes;
        errorMessage: string;
      }
    >
  | MessageDataItem<EventMessages.ENABLE_SESSION_STATS, boolean>
  | MessageDataItem<EventMessages.ENABLE_PER_FRAME_STATS, boolean>
  | MessageDataItem<EventMessages.SET_NOISE_SUPPRESSION_LEVEL, number>
  | MessageDataItem<EventMessages.ENABLE_AR, boolean>
  | MessageDataItem<EventMessages.DISABLE_AR, boolean>;
export declare type ISDKPartialOptions = {
  params: Partial<{
    models: PartialRecord<ModelNames, IURLOptions | string>;
    inboundModels: PartialRecord<ModelNames, IURLOptions | string>;
    useSharedArrayBuffer: boolean;
    logProcessStats: boolean;
    logProcessStatsFramesCount?: number;
    sessionStatsIntervalMS?: number;
    perFrameStatsCountInterval?: number;
    enableSessionStats?: boolean;
    enablePerFrameStats?: boolean;
    frameDurationMS?: number;
    useBVC: boolean;
    useAR?: boolean;
    useRawModelPath?: boolean;
    bvc: {
      allowedDevices: string;
      allowedDevicesExt?: string;
    };
    debugLogs: boolean;
    bufferOverflowMS: number;
    bufferDropMS?: number;
    noiseSuppressionLevel?: number;
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
export interface ICreateAccentReductionFilterProps {
  audioContext: AudioContext;
  stream: MediaStream;
  useAR?: boolean;
  enableOnceReady?: boolean;
}
export interface ICreateNoiseFilterProps {
  audioContext: AudioContext;
  stream: MediaStream;
  isInbound?: boolean;
  useAR?: boolean;
  forceAllowBVC?: boolean;
  enableOnceReady?: boolean;
  useVAD?: boolean;
  vad?: {
    threshold: number;
  };
}
export interface IKrispListeners {
  [KrispEvents.ON_MODEL_LOADED]: (
    models: PartialRecord<ModelNames, string>,
  ) => void;
}
export interface IKrispSDK {
  init(): void;
  dispose(): void;
  createNoiseFilter?(
    audioContext: AudioContext | ICreateNoiseFilterProps,
    onReady?: EventListener,
    onDispose?: EventListener,
  ): Promise<AudioFilterNode>;
  createAccentReductionFilter?(
    audioContext: AudioContext | ICreateAccentReductionFilterProps,
    onReady?: EventListener,
    onDispose?: EventListener,
  ): Promise<AudioFilterNode>;
}
export interface ISDKCreateFilterParams extends ISDKOptionsParams {
  allowBVC: boolean;
  isInbound: boolean;
  enableOnceReady: boolean;
}
export interface ISDKOptionsParams {
  models: PartialRecord<ModelNames, string>;
  inboundModels: PartialRecord<ModelNames, string>;
  preloadModels: PartialRecord<ModelNames, string>;
  preloadInboundModels: PartialRecord<ModelNames, string>;
  useSharedArrayBuffer: boolean;
  logProcessStats: boolean;
  logProcessStatsFramesCount?: number;
  sessionStatsIntervalMS?: number;
  perFrameStatsCountInterval?: number;
  enableSessionStats?: boolean;
  enablePerFrameStats?: boolean;
  frameDurationMS?: number;
  useBVC: boolean;
  useAR?: boolean;
  useRawModelPath?: boolean;
  bvc?: {
    allowedDevices?: string;
    allowedDevicesExt?: string;
  };
  debugLogs: boolean;
  bufferOverflowMS: number;
  bufferDropMS?: number;
  noiseSuppressionLevel?: number;
}
export interface ISDKSharedOptions extends ISDKOptionsParams {
  sampleRate: ISampleRate | number;
  modelName: ModelNames;
  modelPath: string;
  allowBVC: boolean;
  isInbound: boolean;
  useAR?: boolean;
  useVAD?: boolean;
  vad?: {
    threshold: number;
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

import { StreamVideoParticipant } from './types';
import {
  Comparator,
  defaultSortPreset,
  livestreamOrAudioRoomSortPreset,
} from './sorting';

/**
 * The options for a {@link CallType}.
 */
export type CallTypeOptions = {
  /**
   * The {@link Comparator} to use to sorting the participants in the call.
   */
  sortParticipantsBy?: Comparator<StreamVideoParticipant>;
};

/**
 * Represents a call type.
 */
export class CallType {
  /**
   * The name of the call type.
   */
  name: string;

  /**
   * The options for the call type.
   */
  options: CallTypeOptions;

  /**
   * Constructs a new CallType.
   *
   * @param name the name of the call type.
   * @param options the options for the call type.
   */
  constructor(
    name: string,
    options: CallTypeOptions = {
      sortParticipantsBy: defaultSortPreset,
    },
  ) {
    this.name = name;
    this.options = options;
  }
}

/**
 * A registry of {@link CallType}s.
 * You can register and unregister call types.
 */
class CallTypesRegistry {
  /**
   * The call types registered in this registry.
   * @private
   */
  private readonly callTypes: { [key: string]: CallType };

  /**
   * Constructs a new CallTypesRegistry.
   *
   * @param callTypes the initial call types to register.
   */
  constructor(callTypes: CallType[]) {
    this.callTypes = callTypes.reduce<{ [key: string]: CallType }>(
      (acc, callType) => {
        acc[callType.name] = callType;
        return acc;
      },
      {},
    );
  }

  /**
   * Registers a new call type.
   *
   * @param callType the call type to register.
   */
  register = (callType: CallType) => {
    this.callTypes[callType.name] = callType;
  };

  /**
   * Unregisters a call type.
   *
   * @param name the name of the call type to unregister.
   */
  unregister = (name: string) => {
    delete this.callTypes[name];
  };

  /**
   * Gets a call type by name.
   *
   * @param name the name of the call type to get.
   */
  get = (name: string): CallType => {
    if (!this.callTypes[name]) {
      this.register(new CallType(name));
    }
    return this.callTypes[name];
  };
}

/**
 * The default call types registry.
 * You can use this instance to dynamically register and unregister call types.
 */
export const CallTypes = new CallTypesRegistry([
  new CallType('default', {
    sortParticipantsBy: defaultSortPreset,
  }),
  new CallType('development', {
    sortParticipantsBy: defaultSortPreset,
  }),
  new CallType('livestream', {
    sortParticipantsBy: livestreamOrAudioRoomSortPreset,
  }),
  new CallType('audio_room', {
    sortParticipantsBy: livestreamOrAudioRoomSortPreset,
  }),
]);

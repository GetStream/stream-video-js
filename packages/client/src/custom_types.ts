/**
 * Custom data interfaces. They are empty by default and are meant to be
 * extended by integrators through module augmentation:
 *
 * ```ts
 * declare module '@stream-io/video-client' {
 *   interface CustomCallData {
 *     topic?: string;
 *   }
 * }
 * ```
 *
 * The React and React Native SDKs re-export these interfaces, so they can be
 * augmented through `@stream-io/video-react-sdk` and
 * `@stream-io/video-react-native-sdk` as well.
 */

/**
 * The custom data of a call: `call.state.custom`, `CallResponse.custom`
 * and the `custom` field of the create and update call requests.
 */
export interface CustomCallData {}

/**
 * The custom data of a call member.
 */
export interface CustomMemberData {}

/**
 * The custom data of a user.
 */
export interface CustomUserData {}

/**
 * The custom data of a call reaction.
 */
export interface CustomReactionData {}

/**
 * The payload of a custom call event (`call.sendCustomEvent`).
 */
export interface CustomEventData {}

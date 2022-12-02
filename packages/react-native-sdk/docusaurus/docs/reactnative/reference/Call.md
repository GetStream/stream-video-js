# Call

A `Call` object represents the active call, the user is part of.

## Constructors

### constructor

• **new Call**(`client`, `options`, `stateStore`)

Use the [`StreamVideoClient.joinCall`](./StreamVideoClient.md/#joincall) method to construct a `Call` instance.

#### Parameters

| Name | Type |
| :------ | :------ |
| `client` | `StreamSfuClient` |
| `options` | `CallOptions` |
| `stateStore` | `StreamVideoWriteableStateStore` |

#### Defined in

[src/rtc/Call.ts:59](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L59)

## Properties

### currentUserId

• **currentUserId**: `string`

**`Deprecated`**

use store for this data

#### Defined in

[src/rtc/Call.ts:40](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L40)

## Methods

### getStats

▸ **getStats**(`kind`, `selector?`): `Promise`<`undefined` \| `RTCStatsReport`\>

TODO: this should be part of the state store.

#### Parameters

| Name | Type |
| :------ | :------ |
| `kind` | ``"publisher"`` \| ``"subscriber"`` |
| `selector?` | `MediaStreamTrack` |

#### Returns

`Promise`<`undefined` \| `RTCStatsReport`\>

#### Defined in

[src/rtc/Call.ts:456](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L456)

___

### join

▸ **join**(`videoStream?`, `audioStream?`): `Promise`<`undefined` \| `CallState`\>

Joins the call and sets the necessary video and audio encoding configurations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `videoStream?` | `MediaStream` |
| `audioStream?` | `MediaStream` |

#### Returns

`Promise`<`undefined` \| `CallState`\>

#### Defined in

[src/rtc/Call.ts:152](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L152)

___

### leave

▸ **leave**(): `void`

Leave the call and stop the media streams that were published by the call.

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:122](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L122)

___

### off

▸ **off**(`eventName`, `fn`): `void`

Remove subscription for WebSocket events that were created by the `on` method.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` |
| `fn` | `SfuEventListener` |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:115](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L115)

___

### offStatEvent

▸ **offStatEvent**(`fn`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | `StatEventListener` |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:486](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L486)

___

### on

▸ **on**(`eventName`, `fn`): () => `void`

You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive state store.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` |
| `fn` | `SfuEventListener` |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/rtc/Call.ts:105](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L105)

___

### onStatEvent

▸ **onStatEvent**(`fn`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | `StatEventListener` |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:483](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L483)

___

### publishMediaStreams

▸ **publishMediaStreams**(`audioStream?`, `videoStream?`, `opts?`): `Promise`<`void`\>

Starts publishing the given video and/or audio streams, the streams will be stopped if the user changes an input device, or if the user leaves the call.

#### Parameters

| Name | Type |
| :------ | :------ |
| `audioStream?` | `MediaStream` |
| `videoStream?` | `MediaStream` |
| `opts` | `PublishOptions` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/rtc/Call.ts:252](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L252)

___

### replaceMediaStream

▸ **replaceMediaStream**(`kind`, `mediaStream`): `Promise`<`undefined` \| `MediaStream`\>

A method for switching an input device.

#### Parameters

| Name | Type |
| :------ | :------ |
| `kind` | ``"audioinput"`` \| ``"videoinput"`` |
| `mediaStream` | `MediaStream` |

#### Returns

`Promise`<`undefined` \| `MediaStream`\>

#### Defined in

[src/rtc/Call.ts:351](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L351)

___

### startReportingStatsFor

▸ **startReportingStatsFor**(`sessionId`): `void`

Will enhance the reported stats with additional participant-specific information.
This is usually helpful when detailed stats for a specific participant are needed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sessionId` | `string` | the sessionId to start reporting for. |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:469](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L469)

___

### stopReportingStatsFor

▸ **stopReportingStatsFor**(`sessionId`): `void`

Opposite of `startReportingStatsFor`.
Will turn off stats reporting for a specific participant.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sessionId` | `string` | the sessionId to stop reporting for. |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:479](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L479)

___

### updateMuteState

▸ **updateMuteState**(`trackKind`, `isMute`): `undefined` \| `Promise`<`UpdateMuteStateResponse`\>

Mute/unmute the video/audio stream of the current user.

#### Parameters

| Name | Type |
| :------ | :------ |
| `trackKind` | ``"video"`` \| ``"audio"`` |
| `isMute` | `boolean` |

#### Returns

`undefined` \| `Promise`<`UpdateMuteStateResponse`\>

#### Defined in

[src/rtc/Call.ts:499](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L499)

___

### updatePublishQuality

▸ **updatePublishQuality**(`enabledRids`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `enabledRids` | `string`[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/rtc/Call.ts:521](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L521)

___

### updateSubscriptionsPartial

▸ **updateSubscriptionsPartial**(`changes`): `void`

Update track subscription configuration for one or more participants.
You have to create a subscription for each participant you want to receive any kind of track.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `changes` | `SubscriptionChanges` | the list of subscription changes to do. |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:417](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/rtc/Call.ts#L417)

# Call

A `Call` object represents the active call the user is part of. It's not enough to have a `Call` instance, you will also need to call the [`join`](#join) method.

## Constructors

### constructor

• **new Call**(`data`, `client`, `options`, `stateStore`)

Don't call the constructor directly, use the [`StreamVideoClient.joinCall`](./StreamVideoClient.md/#joincall) method to construct a `Call` instance.

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `CallMetadata` |
| `client` | `StreamSfuClient` |
| `options` | `CallOptions` |
| `stateStore` | `StreamVideoWriteableStateStore` |

#### Defined in

[src/rtc/Call.ts:55](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L55)

## Properties

### data

• **data**: `CallMetadata`

Contains metadata about the call, for example who created the call. You can also extract the call ID from this object, which you'll need for certain API calls (for example to start a recording).

#### Defined in

[src/rtc/Call.ts:38](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L38)

## Methods

### getStats

▸ **getStats**(`kind`, `selector?`): `Promise`<`undefined` \| `RTCStatsReport`\>

**`Deprecated`**

use the `callStatsReport$` state [store variable](./StreamVideoClient.md/#readonlystatestore) instead

#### Parameters

| Name | Type |
| :------ | :------ |
| `kind` | ``"subscriber"`` \| ``"publisher"`` |
| `selector?` | `MediaStreamTrack` |

#### Returns

`Promise`<`undefined` \| `RTCStatsReport`\>

#### Defined in

[src/rtc/Call.ts:417](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L417)

___

### join

▸ **join**(): `Promise`<`undefined` \| `CallState`\>

Will initiate a call session with the server and return the call state. Don't call this method directly, use the [`StreamVideoClient.joinCall`](./StreamVideoClient.md/#joincall) method that takes care of this operation.

If the join was successful the [`activeCall$` state variable](./StreamVideClient/#readonlystatestore) will be set

#### Returns

`Promise`<`undefined` \| `CallState`\>

a promise which resolves once the call join-flow has finished.

#### Defined in

[src/rtc/Call.ts:139](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L139)

___

### leave

▸ **leave**(): `void`

Leave the call and stop the media streams that were published by the call.

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:114](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L114)

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

[src/rtc/Call.ts:107](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L107)

___

### on

▸ **on**(`eventName`, `fn`): () => `void`

You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the [reactive state store](./StreamVideoClient.md/#readonlystatestore).

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

[src/rtc/Call.ts:97](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L97)

___

### publishAudioStream

▸ **publishAudioStream**(`audioStream`): `Promise`<`void`\>

Starts publishing the given audio stream to the call.
The stream will be stopped if the user changes an input device, or if the user leaves the call.

Consecutive calls to this method will replace the audio stream that is currently being published.
The previous audio stream will be stopped.

**`Angular`**

It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `audioStream` | `MediaStream` | the audio stream to publish. |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/rtc/Call.ts:243](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L243)

___

### publishScreenShareStream

▸ **publishScreenShareStream**(`screenShareStream`): `Promise`<`void`\>

Starts publishing the given screen-share stream to the call.

Consecutive calls to this method will replace the previous screen-share stream.
The previous screen-share stream will be stopped.

**`Angular`**

It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `screenShareStream` | `MediaStream` | the screen-share stream to publish. |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/rtc/Call.ts:279](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L279)

___

### publishVideoStream

▸ **publishVideoStream**(`videoStream`, `opts?`): `Promise`<`void`\>

Starts publishing the given video stream to the call.
The stream will be stopped if the user changes an input device, or if the user leaves the call.

If the method was successful the [`activeCall$` state variable](./StreamVideClient/#readonlystatestore) will be cleared

Consecutive calls to this method will replace the previously published stream.
The previous video stream will be stopped.

**`Angular`**

It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `videoStream` | `MediaStream` | the video stream to publish. |
| `opts` | `PublishOptions` | the options to use when publishing the stream. |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/rtc/Call.ts:197](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L197)

___

### setAudioDevice

▸ **setAudioDevice**(`deviceId?`): `void`

Sets the `audioDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore)).

This method only stores the selection, if you want to start publishing a media stream call the [`publishAudioStream` method](#publishaudiostream) that will set `audioDeviceId` as well.

**`Angular`**

It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `deviceId?` | `string` | the selected device, pass `undefined` to clear the device selection |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:468](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L468)

___

### setAudioOutputDevice

▸ **setAudioOutputDevice**(`deviceId?`): `void`

Sets the used audio output device (`audioOutputDeviceId` of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore).

This method only stores the selection, if you're using custom UI components, you'll have to implement the audio switching, for more information see: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/sinkId.

**`Angular`**

It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `deviceId?` | `string` | the selected device, `undefined` means the user wants to use the system's default audio output |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:453](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L453)

___

### setVideoDevice

▸ **setVideoDevice**(`deviceId?`): `void`

Sets the `videoDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore).

This method only stores the selection, if you want to start publishing a media stream call the [`publishVideoStream` method](#publishvideostream) that will set `videoDeviceId` as well.

**`Angular`**

It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `deviceId?` | `string` | the selected device, pass `undefined` to clear the device selection |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:483](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L483)

___

### startReportingStatsFor

▸ **startReportingStatsFor**(`sessionId`): `void`

Will enhance the reported stats with additional participant-specific information (`callStatsReport$` state [store variable](./StreamVideoClient.md/#readonlystatestore)).
This is usually helpful when detailed stats for a specific participant are needed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sessionId` | `string` | the sessionId to start reporting for. |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:430](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L430)

___

### stopPublish

▸ **stopPublish**(`trackType`): `Promise`<`void`\>

Stops publishing the given track type to the call, if it is currently being published.
Underlying track will be stopped and removed from the publisher.

The `audioDeviceId`/`videoDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore) won't be updated, you can do that by calling the [`setAudioDevice`](#setaudiodevice)/[`setVideoDevice`](#setvideodevice) method.

**`Angular`**

It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `trackType` | `TrackType` | the track type to stop publishing. |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/rtc/Call.ts:322](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L322)

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

[src/rtc/Call.ts:440](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L440)

___

### updateSubscriptionsPartial

▸ **updateSubscriptionsPartial**(`kind`, `changes`): `void`

Update track subscription configuration for one or more participants.
You have to create a subscription for each participant for all the different kinds of tracks you want to receive.
You can only subscribe for tracks after the participant started publishing the given kind of track.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `kind` | ``"video"`` \| ``"screen"`` | the kind of subscription to update. |
| `changes` | `SubscriptionChanges` | the list of subscription changes to do. |

#### Returns

`void`

#### Defined in

[src/rtc/Call.ts:347](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/client/src/rtc/Call.ts#L347)

# Utilities

## Functions

### getAudioDevices

▸ **getAudioDevices**(): `Observable`<`MediaDeviceInfo`[]\>

Lists the list of available 'audioinput' devices, if devices are added/removed - the list is updated

#### Returns

`Observable`<`MediaDeviceInfo`[]\>

#### Defined in

[src/devices.ts:59](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/devices.ts#L59)

___

### getAudioStream

▸ **getAudioStream**(`deviceId?`): `Promise`<`MediaStream`\>

Returns an 'audioinput' media stream with the given `deviceId`, if no `deviceId` is provided, it uses the first available device

#### Parameters

| Name | Type |
| :------ | :------ |
| `deviceId?` | `string` |

#### Returns

`Promise`<`MediaStream`\>

#### Defined in

[src/devices.ts:100](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/devices.ts#L100)

___

### getVideoDevices

▸ **getVideoDevices**(): `Observable`<`MediaDeviceInfo`[]\>

Lists the list of available 'videoinput' devices, if devices are added/removed - the list is updated

#### Returns

`Observable`<`MediaDeviceInfo`[]\>

#### Defined in

[src/devices.ts:69](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/devices.ts#L69)

___

### getVideoStream

▸ **getVideoStream**(`deviceId?`): `Promise`<`MediaStream`\>

Returns a 'videoinput' media stream with the given `deviceId`, if no `deviceId` is provided, it uses the first available device

#### Parameters

| Name | Type |
| :------ | :------ |
| `deviceId?` | `string` |

#### Returns

`Promise`<`MediaStream`\>

#### Defined in

[src/devices.ts:109](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/devices.ts#L109)

___

### watchForDisconnectedAudioDevice

▸ **watchForDisconnectedAudioDevice**(`deviceId$`): `Observable`<`boolean`\>

Notifies the subscriber if a given 'audioinput' device is disconnected

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `deviceId$` | `Observable`<`undefined` \| `string`\> | an Observable that specifies which device to watch for |

#### Returns

`Observable`<`boolean`\>

#### Defined in

[src/devices.ts:133](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/devices.ts#L133)

___

### watchForDisconnectedVideoDevice

▸ **watchForDisconnectedVideoDevice**(`deviceId$`): `Observable`<`boolean`\>

Notifies the subscriber if a given 'videoinput' device is disconnected

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `deviceId$` | `Observable`<`undefined` \| `string`\> | an Observable that specifies which device to watch for |

#### Returns

`Observable`<`boolean`\>

#### Defined in

[src/devices.ts:144](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/devices.ts#L144)

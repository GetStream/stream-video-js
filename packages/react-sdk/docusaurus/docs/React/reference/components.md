# Components

## Interfaces

- [ParticipantBoxProps](../Interfaces/ParticipantBoxProps/)

## Type Aliases

### AudioPublisherInit

Ƭ **AudioPublisherInit**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `audioDeviceId?` | `string` |
| `call?` | `Call` |
| `initialAudioMuted?` | `boolean` |

#### Defined in

[packages/react-sdk/src/hooks/useAudioPublisher.ts:12](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/hooks/useAudioPublisher.ts#L12)

___

### AvatarData

Ƭ **AvatarData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `imageSrc?` | `string` |
| `name?` | `string` |
| `style?` | `CSSProperties` & `Record`<`string`, `string` \| `number`\> |

#### Defined in

[packages/react-sdk/src/components/Avatar/Avatar.tsx:3](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Avatar/Avatar.tsx#L3)

___

### AvatarProps

Ƭ **AvatarProps**: [`AvatarData`](modules/#avatardata)

#### Defined in

[packages/react-sdk/src/components/Avatar/Avatar.tsx:9](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Avatar/Avatar.tsx#L9)

___

### ButtonWithIconProps

Ƭ **ButtonWithIconProps**: { `enabled?`: `boolean` ; `icon`: `string` ; `variant?`: `string`  } & `ComponentProps`<``"button"``\>

#### Defined in

[packages/react-sdk/src/components/Button/IconButton.tsx:4](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Button/IconButton.tsx#L4)

___

### CallControlsProps

Ƭ **CallControlsProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `call` | `Call` |
| `onLeave?` | () => `void` |

#### Defined in

[packages/react-sdk/src/components/CallControls/CallControls.tsx:12](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/CallControls.tsx#L12)

___

### CallParticipantListingProps

Ƭ **CallParticipantListingProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `StreamVideoParticipant`[] | Array of participant objects to be rendered |

#### Defined in

[packages/react-sdk/src/components/CallParticipantsList/CallParticipantListing.tsx:118](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallParticipantsList/CallParticipantListing.tsx#L118)

___

### CancelCallButtonProps

Ƭ **CancelCallButtonProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `call` | `Call` |
| `onClick?` | `MouseEventHandler`<`HTMLButtonElement`\> |
| `onLeave?` | () => `void` |

#### Defined in

[packages/react-sdk/src/components/CallControls/CancelCallButton.tsx:6](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/CancelCallButton.tsx#L6)

___

### ChildrenOnly

Ƭ **ChildrenOnly**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `children` | `ReactNode` |

#### Defined in

[packages/react-sdk/src/types/components.ts:3](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/types/components.ts#L3)

___

### DeviceSelectorAudioInputProps

Ƭ **DeviceSelectorAudioInputProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `title?` | `string` |

#### Defined in

[packages/react-sdk/src/components/DeviceSettings/DeviceSelectorAudio.tsx:4](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/DeviceSettings/DeviceSelectorAudio.tsx#L4)

___

### DeviceSelectorAudioOutputProps

Ƭ **DeviceSelectorAudioOutputProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `title?` | `string` |

#### Defined in

[packages/react-sdk/src/components/DeviceSettings/DeviceSelectorAudio.tsx:26](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/DeviceSettings/DeviceSelectorAudio.tsx#L26)

___

### DeviceSelectorVideoProps

Ƭ **DeviceSelectorVideoProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `title?` | `string` |

#### Defined in

[packages/react-sdk/src/components/DeviceSettings/DeviceSelectorVideo.tsx:4](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/DeviceSettings/DeviceSelectorVideo.tsx#L4)

___

### GetInviteLinkButtonProps

Ƭ **GetInviteLinkButtonProps**: `ComponentProps`<``"button"``\> & { `Button`: `ComponentType`<`ComponentPropsWithRef`<``"button"``\> & { `ref`: `ForwardedRef`<`HTMLButtonElement`\>  }\> ; `dismissAfterMs?`: `number` ; `generateLink?`: () => `string`  }

#### Defined in

[packages/react-sdk/src/components/CallParticipantsList/GetInviteLinkButton.tsx:13](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallParticipantsList/GetInviteLinkButton.tsx#L13)

___

### IconButtonWithMenuProps

Ƭ **IconButtonWithMenuProps**: `PropsWithChildren`<{ `Menu?`: `ComponentType` ; `caption?`: `string` ; `enabled?`: `boolean`  }\>

#### Defined in

[packages/react-sdk/src/components/Button/CompositeButton.tsx:6](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Button/CompositeButton.tsx#L6)

___

### LoadingIndicatorProps

Ƭ **LoadingIndicatorProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `text?` | `string` | Text to be displayed under the loading indicator icon |
| `tooltip?` | `string` | Tooltip to be displayed on hover |
| `type?` | `string` | String will be injected into class and later used to apply as a CSS mask-image to an element as data URL |

#### Defined in

[packages/react-sdk/src/components/LoadingIndicator/LoadingIndicator.tsx:3](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/LoadingIndicator/LoadingIndicator.tsx#L3)

___

### MediaDevicesContextAPI

Ƭ **MediaDevicesContextAPI**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `audioInputDevices` | `MediaDeviceInfo`[] |
| `audioOutputDevices` | `MediaDeviceInfo`[] |
| `disposeOfMediaStream` | (`stream`: `MediaStream`) => `void` |
| `getAudioStream` | (`deviceId?`: `string`) => `Promise`<`MediaStream`\> |
| `getVideoStream` | (`deviceId?`: `string`) => `Promise`<`MediaStream`\> |
| `initialAudioEnabled` | `boolean` |
| `initialVideoState` | `DeviceState` |
| `isAudioOutputChangeSupported` | `boolean` |
| `publishAudioStream` | () => `Promise`<`void`\> |
| `publishVideoStream` | () => `Promise`<`void`\> |
| `selectedAudioInputDeviceId?` | `string` |
| `selectedAudioOutputDeviceId?` | `string` |
| `selectedVideoDeviceId?` | `string` |
| `setInitialVideoState` | (`state`: `DeviceState`) => `void` |
| `stopPublishingAudio` | () => `void` |
| `stopPublishingVideo` | () => `void` |
| `switchDevice` | (`kind`: `MediaDeviceKind`, `deviceId?`: `string`) => `void` |
| `toggleAudioMuteState` | () => `void` |
| `toggleVideoMuteState` | () => `void` |
| `videoDevices` | `MediaDeviceInfo`[] |

#### Defined in

[packages/react-sdk/src/contexts/MediaDevicesContext.tsx:69](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/contexts/MediaDevicesContext.tsx#L69)

___

### MediaDevicesProviderProps

Ƭ **MediaDevicesProviderProps**: `PropsWithChildren`<{ `enumerate?`: `boolean` ; `initialAudioEnabled?`: `boolean` ; `initialAudioInputDeviceId?`: `string` ; `initialAudioOutputDeviceId?`: `string` ; `initialVideoEnabled?`: `boolean` ; `initialVideoInputDeviceId?`: `string`  }\>

#### Defined in

[packages/react-sdk/src/contexts/MediaDevicesContext.tsx:94](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/contexts/MediaDevicesContext.tsx#L94)

___

### NotificationProps

Ƭ **NotificationProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `isVisible?` | `boolean` |
| `message?` | `ReactNode` |
| `placement?` | `Placement` |
| `resetIsVisible?` | () => `void` |
| `visibilityTimeout?` | `number` |

#### Defined in

[packages/react-sdk/src/components/Notification/Notification.tsx:5](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Notification/Notification.tsx#L5)

___

### Readable

Ƭ **Readable**<`T`\>: { [k in keyof T]: T[k] } & {}

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/react-sdk/src/types/components.ts:5](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/types/components.ts#L5)

___

### RecordCallButtonProps

Ƭ **RecordCallButtonProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `call` | `Call` |
| `caption?` | `string` |

#### Defined in

[packages/react-sdk/src/components/CallControls/RecordCallButton.tsx:10](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/RecordCallButton.tsx#L10)

___

### ScreenShareButtonProps

Ƭ **ScreenShareButtonProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `call` | `Call` |
| `caption?` | `string` |

#### Defined in

[packages/react-sdk/src/components/CallControls/ScreenShareButton.tsx:5](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ScreenShareButton.tsx#L5)

___

### SearchResultListProps

Ƭ **SearchResultListProps**<`T`\>: `Object`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `data` | `T`[] |

#### Defined in

[packages/react-sdk/src/components/Search/SearchResults.tsx:5](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Search/SearchResults.tsx#L5)

___

### SearchResultsProps

Ƭ **SearchResultsProps**<`T`\>: `Pick`<`SearchController`<`T`\>, ``"searchResults"`` \| ``"searchQueryInProgress"``\> & { `EmptySearchResultComponent`: `ComponentType` ; `LoadingIndicator?`: `ComponentType` ; `SearchResultList`: `ComponentType`<[`SearchResultListProps`](modules/#searchresultlistprops)<`T`\>\>  }

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/react-sdk/src/components/Search/SearchResults.tsx:9](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Search/SearchResults.tsx#L9)

___

### StreamMeetingProps

Ƭ **StreamMeetingProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `callId` | `string` |
| `callType` | `string` |
| `input?` | `Omit`<`GetOrCreateCallRequest`, ``"members"``\> |

#### Defined in

[packages/react-sdk/src/components/StreamMeeting/StreamMeeting.tsx:9](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/StreamMeeting/StreamMeeting.tsx#L9)

___

### StreamVideoClientInit

Ƭ **StreamVideoClientInit**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `apiKey` | `string` |
| `callConfig?` | `CallConfig` |
| `options?` | `StreamClientOptions` |
| `tokenOrProvider` | `TokenOrProvider` |
| `user` | `User` |

#### Defined in

[packages/react-sdk/src/hooks/useCreateStreamVideoClient.ts:10](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/hooks/useCreateStreamVideoClient.ts#L10)

___

### ToggleAudioOutputButtonProps

Ƭ **ToggleAudioOutputButtonProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `caption?` | `string` |

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleAudioOutputButton.tsx:4](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleAudioOutputButton.tsx#L4)

___

### ToggleAudioPreviewButtonProps

Ƭ **ToggleAudioPreviewButtonProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `caption?` | `string` |

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleAudioButton.tsx:8](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleAudioButton.tsx#L8)

___

### ToggleAudioPublishingButtonProps

Ƭ **ToggleAudioPublishingButtonProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `caption?` | `string` |

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleAudioButton.tsx:29](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleAudioButton.tsx#L29)

___

### ToggleCameraPreviewButtonProps

Ƭ **ToggleCameraPreviewButtonProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `caption?` | `string` |

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleCameraButton.tsx:9](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleCameraButton.tsx#L9)

___

### ToggleParticipantListButtonProps

Ƭ **ToggleParticipantListButtonProps**: { `caption?`: `string`  } & `Omit`<[`ButtonWithIconProps`](modules/#buttonwithiconprops), ``"icon"`` \| ``"ref"``\>

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleParticipantListButton.tsx:3](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleParticipantListButton.tsx#L3)

___

### TooltipProps

Ƭ **TooltipProps**<`T`\>: `PropsWithChildren`<{ `className?`: `string` ; `offset?`: [`number`, `number`] ; `placement?`: `PopperProps`<`unknown`\>[``"placement"``] ; `referenceElement`: `T` \| ``null`` ; `visible?`: `boolean`  }\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `HTMLElement` |

#### Defined in

[packages/react-sdk/src/components/Tooltip/Tooltip.tsx:5](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Tooltip/Tooltip.tsx#L5)

___

### VideoPlaceholderProps

Ƭ **VideoPlaceholderProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `imageSrc?` | `string` |
| `isSpeaking?` | `boolean` |
| `name?` | `string` \| ``null`` |

#### Defined in

[packages/react-sdk/src/components/Video/VideoPlaceholder.tsx:4](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Video/VideoPlaceholder.tsx#L4)

___

### VideoPreviewProps

Ƭ **VideoPreviewProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `DisabledVideoPreview?` | `ComponentType` |
| `NoCameraPreview?` | `ComponentType` |
| `StartingCameraPreview?` | `ComponentType` |
| `VideoErrorPreview?` | `ComponentType`<`VideoErrorPreviewProps`\> |
| `mirror?` | `boolean` |

#### Defined in

[packages/react-sdk/src/components/Video/VideoPreview.tsx:34](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Video/VideoPreview.tsx#L34)

___

### VideoProps

Ƭ **VideoProps**: `DetailedHTMLProps`<`VideoHTMLAttributes`<`HTMLVideoElement`\>, `HTMLVideoElement`\> & { `stream?`: `MediaStream`  }

#### Defined in

[packages/react-sdk/src/components/Video/BaseVideo.tsx:12](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Video/BaseVideo.tsx#L12)

___

### VideoPublisherInit

Ƭ **VideoPublisherInit**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `call?` | `Call` |
| `initialVideoMuted?` | `boolean` |
| `videoDeviceId?` | `string` |

#### Defined in

[packages/react-sdk/src/hooks/useVideoPublisher.ts:13](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/hooks/useVideoPublisher.ts#L13)

## Variables

### DEVICE\_STATE

• `Const` **DEVICE\_STATE**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `error` | `ErrorDeviceState` |
| `playing` | `EnabledDeviceState`<``"playing"``\> |
| `starting` | `EnabledDeviceState`<``"starting"``\> |
| `stopped` | `DisabledDeviceState`<``"stopped"``\> |
| `uninitialized` | `DisabledDeviceState`<``"uninitialized"``\> |

#### Defined in

[packages/react-sdk/src/contexts/MediaDevicesContext.tsx:55](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/contexts/MediaDevicesContext.tsx#L55)

## Functions

### Avatar

▸ **Avatar**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`AvatarData`](modules/#avatardata) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Avatar/Avatar.tsx:11](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Avatar/Avatar.tsx#L11)

___

### AvatarFallback

▸ **AvatarFallback**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `AvatarFallbackProps` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Avatar/Avatar.tsx:36](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Avatar/Avatar.tsx#L36)

___

### BaseVideo

▸ **BaseVideo**(`props`): ``null`` \| `ReactElement`<`any`, `string` \| `JSXElementConstructor`<`any`\>\>

**NOTE**: Exotic components are not callable.

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `Omit`<[`VideoProps`](modules/#videoprops), ``"ref"``\> & `RefAttributes`<`HTMLVideoElement`\> |

#### Returns

``null`` \| `ReactElement`<`any`, `string` \| `JSXElementConstructor`<`any`\>\>

#### Defined in

node_modules/@types/react/index.d.ts:351

___

### CallControls

▸ **CallControls**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`CallControlsProps`](modules/#callcontrolsprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/CallControls.tsx:17](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/CallControls.tsx#L17)

___

### CallParticipantListing

▸ **CallParticipantListing**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`CallParticipantListingProps`](modules/#callparticipantlistingprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallParticipantsList/CallParticipantListing.tsx:122](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallParticipantsList/CallParticipantListing.tsx#L122)

___

### CallParticipantListingItem

▸ **CallParticipantListingItem**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CallParticipantListingItemProps` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallParticipantsList/CallParticipantListing.tsx:80](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallParticipantsList/CallParticipantListing.tsx#L80)

___

### CallParticipantsList

▸ **CallParticipantsList**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CallParticipantListProps` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallParticipantsList/CallParticipantsList.tsx:42](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallParticipantsList/CallParticipantsList.tsx#L42)

___

### CallStatsButton

▸ **CallStatsButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CallStatsButtonProps` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/CallStatsButton.tsx:9](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/CallStatsButton.tsx#L9)

___

### CancelCallButton

▸ **CancelCallButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`CancelCallButtonProps`](modules/#cancelcallbuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/CancelCallButton.tsx:12](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/CancelCallButton.tsx#L12)

___

### CompositeButton

▸ **CompositeButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`IconButtonWithMenuProps`](modules/#iconbuttonwithmenuprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Button/CompositeButton.tsx:12](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Button/CompositeButton.tsx#L12)

___

### DefaultReactionsMenu

▸ **DefaultReactionsMenu**(): `Element`

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ReactionsButton.tsx:27](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ReactionsButton.tsx#L27)

___

### DeviceSelector

▸ **DeviceSelector**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `Object` |
| `props.devices` | `MediaDeviceInfo`[] |
| `props.onChange?` | (`deviceId`: `string`) => `void` |
| `props.selectedDeviceId?` | `string` |
| `props.title` | `string` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/DeviceSettings/DeviceSelector.tsx:47](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/DeviceSettings/DeviceSelector.tsx#L47)

___

### DeviceSelectorAudioInput

▸ **DeviceSelectorAudioInput**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`DeviceSelectorAudioInputProps`](modules/#deviceselectoraudioinputprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/DeviceSettings/DeviceSelectorAudio.tsx:8](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/DeviceSettings/DeviceSelectorAudio.tsx#L8)

___

### DeviceSelectorAudioOutput

▸ **DeviceSelectorAudioOutput**(`«destructured»`): ``null`` \| `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`DeviceSelectorAudioOutputProps`](modules/#deviceselectoraudiooutputprops) |

#### Returns

``null`` \| `Element`

#### Defined in

[packages/react-sdk/src/components/DeviceSettings/DeviceSelectorAudio.tsx:30](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/DeviceSettings/DeviceSelectorAudio.tsx#L30)

___

### DeviceSelectorVideo

▸ **DeviceSelectorVideo**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`DeviceSelectorVideoProps`](modules/#deviceselectorvideoprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/DeviceSettings/DeviceSelectorVideo.tsx:8](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/DeviceSettings/DeviceSelectorVideo.tsx#L8)

___

### DeviceSettings

▸ **DeviceSettings**(): `Element`

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/DeviceSettings/DeviceSettings.tsx:11](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/DeviceSettings/DeviceSettings.tsx#L11)

___

### GetInviteLinkButton

▸ **GetInviteLinkButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`GetInviteLinkButtonProps`](modules/#getinvitelinkbuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallParticipantsList/GetInviteLinkButton.tsx:22](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallParticipantsList/GetInviteLinkButton.tsx#L22)

___

### IconButton

▸ **IconButton**(`props`): ``null`` \| `ReactElement`<`any`, `string` \| `JSXElementConstructor`<`any`\>\>

**NOTE**: Exotic components are not callable.

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `Omit`<[`ButtonWithIconProps`](modules/#buttonwithiconprops), ``"ref"``\> & `RefAttributes`<`HTMLButtonElement`\> |

#### Returns

``null`` \| `ReactElement`<`any`, `string` \| `JSXElementConstructor`<`any`\>\>

#### Defined in

node_modules/@types/react/index.d.ts:351

___

### LoadingIndicator

▸ **LoadingIndicator**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`LoadingIndicatorProps`](modules/#loadingindicatorprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/LoadingIndicator/LoadingIndicator.tsx:12](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/LoadingIndicator/LoadingIndicator.tsx#L12)

___

### LocalMediaStreamsContextProvider

▸ **LocalMediaStreamsContextProvider**(`«destructured»`): `Element`

**`Deprecated`**

No longer used, remove later

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `children` | `ReactNode` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/contexts/LocalMediaStreamsContext.tsx:92](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/contexts/LocalMediaStreamsContext.tsx#L92)

___

### MediaDevicesProvider

▸ **MediaDevicesProvider**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`MediaDevicesProviderProps`](modules/#mediadevicesproviderprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/contexts/MediaDevicesContext.tsx:103](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/contexts/MediaDevicesContext.tsx#L103)

___

### Notification

▸ **Notification**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`NotificationProps`](modules/#notificationprops)\> |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Notification/Notification.tsx:13](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Notification/Notification.tsx#L13)

___

### ParticipantBox

▸ **ParticipantBox**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`ParticipantBoxProps`](../Interfaces/ParticipantBoxProps/) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/StreamCall/ParticipantBox.tsx:25](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/StreamCall/ParticipantBox.tsx#L25)

___

### ReactionsButton

▸ **ReactionsButton**(): `Element`

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ReactionsButton.tsx:9](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ReactionsButton.tsx#L9)

___

### RecordCallButton

▸ **RecordCallButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`RecordCallButtonProps`](modules/#recordcallbuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/RecordCallButton.tsx:15](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/RecordCallButton.tsx#L15)

___

### ScreenShareButton

▸ **ScreenShareButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ScreenShareButtonProps`](modules/#screensharebuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ScreenShareButton.tsx:10](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ScreenShareButton.tsx#L10)

___

### SearchInput

▸ **SearchInput**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `SearchInputProps` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Search/SearchInput.tsx:15](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Search/SearchInput.tsx#L15)

___

### SearchResults

▸ **SearchResults**<`T`\>(`«destructured»`): `Element`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`SearchResultsProps`](modules/#searchresultsprops)<`T`\> |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Search/SearchResults.tsx:21](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Search/SearchResults.tsx#L21)

___

### SpeakingWhileMutedNotification

▸ **SpeakingWhileMutedNotification**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ChildrenOnly`](modules/#childrenonly) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Notification/SpeakingWhileMutedNotification.tsx:8](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Notification/SpeakingWhileMutedNotification.tsx#L8)

___

### Stage

▸ **Stage**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `Object` |
| `props.call` | `Call` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/StreamCall/Stage.tsx:7](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/StreamCall/Stage.tsx#L7)

___

### StreamCall

▸ **StreamCall**(`«destructured»`): ``null`` \| `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `children` | `ReactNode` |

#### Returns

``null`` \| `Element`

#### Defined in

[packages/react-sdk/src/components/StreamCall/StreamCall.tsx:11](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/StreamCall/StreamCall.tsx#L11)

___

### StreamMeeting

▸ **StreamMeeting**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `PropsWithChildren`<[`StreamMeetingProps`](modules/#streammeetingprops)\> |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/StreamMeeting/StreamMeeting.tsx:15](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/StreamMeeting/StreamMeeting.tsx#L15)

___

### ToggleAudioOutputButton

▸ **ToggleAudioOutputButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ToggleAudioOutputButtonProps`](modules/#toggleaudiooutputbuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleAudioOutputButton.tsx:6](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleAudioOutputButton.tsx#L6)

___

### ToggleAudioPreviewButton

▸ **ToggleAudioPreviewButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ToggleAudioPreviewButtonProps`](modules/#toggleaudiopreviewbuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleAudioButton.tsx:10](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleAudioButton.tsx#L10)

___

### ToggleAudioPublishingButton

▸ **ToggleAudioPublishingButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ToggleAudioPublishingButtonProps`](modules/#toggleaudiopublishingbuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleAudioButton.tsx:33](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleAudioButton.tsx#L33)

___

### ToggleCameraPreviewButton

▸ **ToggleCameraPreviewButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ToggleCameraPreviewButtonProps`](modules/#togglecamerapreviewbuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleCameraButton.tsx:11](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleCameraButton.tsx#L11)

___

### ToggleCameraPublishingButton

▸ **ToggleCameraPublishingButton**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ToggleCameraPublishingButtonProps` |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleCameraButton.tsx:34](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleCameraButton.tsx#L34)

___

### ToggleParticipantListButton

▸ **ToggleParticipantListButton**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`ToggleParticipantListButtonProps`](modules/#toggleparticipantlistbuttonprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/CallControls/ToggleParticipantListButton.tsx:8](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/CallControls/ToggleParticipantListButton.tsx#L8)

___

### Tooltip

▸ **Tooltip**<`T`\>(`«destructured»`): ``null`` \| `Element`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `HTMLElement`<`T`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`TooltipProps`](modules/#tooltipprops)<`T`\> |

#### Returns

``null`` \| `Element`

#### Defined in

[packages/react-sdk/src/components/Tooltip/Tooltip.tsx:18](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Tooltip/Tooltip.tsx#L18)

___

### Video

▸ **Video**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `ClassAttributes`<`HTMLVideoElement`\> & `VideoHTMLAttributes`<`HTMLVideoElement`\> & { `call`: `Call` ; `kind`: ``"video"`` \| ``"screen"`` ; `participant`: `StreamVideoParticipant` ; `setVideoElementRef?`: (`element`: ``null`` \| `HTMLElement`) => `void`  } |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Video/Video.tsx:18](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Video/Video.tsx#L18)

___

### VideoPlaceholder

▸ **VideoPlaceholder**(`props`): ``null`` \| `ReactElement`<`any`, `string` \| `JSXElementConstructor`<`any`\>\>

**NOTE**: Exotic components are not callable.

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`VideoPlaceholderProps`](modules/#videoplaceholderprops) & `RefAttributes`<`HTMLDivElement`\> |

#### Returns

``null`` \| `ReactElement`<`any`, `string` \| `JSXElementConstructor`<`any`\>\>

#### Defined in

node_modules/@types/react/index.d.ts:351

___

### VideoPreview

▸ **VideoPreview**(`«destructured»`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`VideoPreviewProps`](modules/#videopreviewprops) |

#### Returns

`Element`

#### Defined in

[packages/react-sdk/src/components/Video/VideoPreview.tsx:42](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/components/Video/VideoPreview.tsx#L42)

___

### useAudioPublisher

▸ **useAudioPublisher**(`«destructured»`): () => `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`AudioPublisherInit`](modules/#audiopublisherinit) |

#### Returns

`fn`

▸ (): `Promise`<`void`\>

##### Returns

`Promise`<`void`\>

#### Defined in

[packages/react-sdk/src/hooks/useAudioPublisher.ts:18](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/hooks/useAudioPublisher.ts#L18)

___

### useCreateStreamVideoClient

▸ **useCreateStreamVideoClient**(`«destructured»`): `StreamVideoClient`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`StreamVideoClientInit`](modules/#streamvideoclientinit) |

#### Returns

`StreamVideoClient`

#### Defined in

[packages/react-sdk/src/hooks/useCreateStreamVideoClient.ts:18](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/hooks/useCreateStreamVideoClient.ts#L18)

___

### useLocalMediaStreamsContext

▸ **useLocalMediaStreamsContext**(): `MediaStreamsContextType`

#### Returns

`MediaStreamsContextType`

#### Defined in

[packages/react-sdk/src/contexts/LocalMediaStreamsContext.tsx:128](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/contexts/LocalMediaStreamsContext.tsx#L128)

___

### useMediaDevices

▸ **useMediaDevices**(): [`MediaDevicesContextAPI`](modules/#mediadevicescontextapi)

#### Returns

[`MediaDevicesContextAPI`](modules/#mediadevicescontextapi)

#### Defined in

[packages/react-sdk/src/contexts/MediaDevicesContext.tsx:261](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/contexts/MediaDevicesContext.tsx#L261)

___

### useVideoPublisher

▸ **useVideoPublisher**(`«destructured»`): () => `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`VideoPublisherInit`](modules/#videopublisherinit) |

#### Returns

`fn`

▸ (): `Promise`<`void`\>

##### Returns

`Promise`<`void`\>

#### Defined in

[packages/react-sdk/src/hooks/useVideoPublisher.ts:19](https://github.com/GetStream/stream-video-js/blob/cbba12b2/packages/react-sdk/src/hooks/useVideoPublisher.ts#L19)

[@stream-io/video-react-native-sdk](../README) / [Modules](../modules.md) / contexts

# contexts

## Table of contents

### Interfaces

- [SDKStreamVideoStore](../interfaces/contexts.SDKStreamVideoStore.md)

### Functions

- [Provider](contexts.md#provider)
- [StreamVideo](contexts.md#streamvideo)
- [useStreamVideoStoreSetState](contexts.md#usestreamvideostoresetstate)
- [useStreamVideoStoreValue](contexts.md#usestreamvideostorevalue)

## Functions

### Provider

▸ **Provider**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `Object` |

#### Returns

`Element`

#### Defined in

[src/contexts/createStoreContext.tsx:66](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-native-sdk/src/contexts/createStoreContext.tsx#L66)

___

### StreamVideo

▸ **StreamVideo**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`StreamVideoProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/@types/react/index.d.ts:543

___

### useStreamVideoStoreSetState

▸ **useStreamVideoStoreSetState**(): `SetStateFuncType`

#### Returns

`SetStateFuncType`

#### Defined in

[src/contexts/createStoreContext.tsx:92](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-native-sdk/src/contexts/createStoreContext.tsx#L92)

___

### useStreamVideoStoreValue

▸ **useStreamVideoStoreValue**<`SelectorOutput`\>(`selector`): `SelectorOutput`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `SelectorOutput` | extends `undefined` \| `boolean` \| `default` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `selector` | (`store`: `StoreType`) => `SelectorOutput` |

#### Returns

`SelectorOutput`

#### Defined in

[src/contexts/createStoreContext.tsx:75](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-native-sdk/src/contexts/createStoreContext.tsx#L75)

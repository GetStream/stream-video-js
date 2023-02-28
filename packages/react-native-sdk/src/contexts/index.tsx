import { useStoreValue, useStoreSetState } from './StreamVideoContext';

// FIXME: these two hooks should not be exported out, rather we must export individual hooks
export const useStreamVideoStoreValue = useStoreValue;
export const useStreamVideoStoreSetState = useStoreSetState;

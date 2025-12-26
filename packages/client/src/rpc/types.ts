export type RpcInvocationMeta = {
  attempt: number;
};

declare module '@protobuf-ts/runtime-rpc' {
  // instead of casting, we extend the default interface with
  // an additional payload provided by our `retryable` implementation
  interface RpcOptions {
    invocationMeta?: RpcInvocationMeta;
  }
}

export class JoinCanceledError extends Error {
  constructor(message = 'Join canceled because call.leave() was called') {
    super(message);
    this.name = 'JoinCanceledError';
  }
}

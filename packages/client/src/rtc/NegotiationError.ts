import { Error as SfuError } from '../gen/video/sfu/models/models';

/**
 * NegotiationError is thrown when there is an error during the negotiation process.
 * It extends the built-in Error class and includes an SfuError object for more details.
 */
export class NegotiationError extends Error {
  /**
   * The SfuError object that contains details about the error.
   */
  error: SfuError;

  /**
   * Creates an instance of NegotiationError.
   */
  constructor(error: SfuError) {
    super(error.message);
    this.name = 'NegotiationError';
    this.error = error;
  }
}

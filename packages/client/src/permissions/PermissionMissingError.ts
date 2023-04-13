import { OwnCapability } from '../gen/coordinator';

/**
 * A specific Error instance which is thrown when the current user attempts
 * to perform an action for which they don't have the required permission.
 */
export class PermissionMissingError extends Error {
  constructor(permission: OwnCapability) {
    super(`Permission missing: ${permission}`);
  }
}

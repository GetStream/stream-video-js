import { Secret } from 'jsonwebtoken';
import { JWTServerToken, JWTUserToken, UserFromToken } from './signing';
import { isFunction } from './utils';
import type { TokenOrProvider, User } from './types';

/**
 * TokenManager
 *
 * Handles all the operations around user token.
 */
export class TokenManager {
  loadTokenPromise: Promise<string> | null;
  type: 'static' | 'provider';
  secret?: Secret;
  token?: string;
  tokenProvider?: TokenOrProvider;
  user?: User;
  /**
   * Constructor
   *
   * @param {Secret} secret
   */
  constructor(secret?: Secret) {
    this.loadTokenPromise = null;
    if (secret) {
      this.secret = secret;
    }

    this.type = 'static';

    if (this.secret) {
      this.token = JWTServerToken(this.secret);
    }
  }

  /**
   * Set the static string token or token provider.
   * Token provider should return a token string or a promise which resolves to string token.
   *
   * @param {TokenOrProvider} tokenOrProvider - the token or token provider.
   * @param {UserResponse} user - the user object.
   * @param {boolean} isAnonymous - whether the user is anonymous or not.
   */
  setTokenOrProvider = async (
    tokenOrProvider: TokenOrProvider,
    user: User,
    isAnonymous: boolean,
  ) => {
    this.validateToken(tokenOrProvider, user, isAnonymous);
    this.user = user;

    if (isFunction(tokenOrProvider)) {
      this.tokenProvider = tokenOrProvider;
      this.type = 'provider';
    }

    if (typeof tokenOrProvider === 'string') {
      this.token = tokenOrProvider;
      this.type = 'static';
    }

    if (!tokenOrProvider && this.user && this.secret) {
      this.token = JWTUserToken(this.secret, user.id, {}, {});
      this.type = 'static';
    }

    await this.loadToken();
  };

  /**
   * Resets the token manager.
   * Useful for client disconnection or switching user.
   */
  reset = () => {
    this.token = undefined;
    this.user = undefined;
    this.loadTokenPromise = null;
  };

  // Validates the user token.
  validateToken = (
    tokenOrProvider: TokenOrProvider,
    user: User,
    isAnonymous: boolean,
  ) => {
    // allow empty token for anon user
    if (user && isAnonymous && !tokenOrProvider) return;

    // Don't allow empty token for non-server side client.
    if (!this.secret && !tokenOrProvider) {
      throw new Error('User token can not be empty');
    }

    if (
      tokenOrProvider &&
      typeof tokenOrProvider !== 'string' &&
      !isFunction(tokenOrProvider)
    ) {
      throw new Error('user token should either be a string or a function');
    }

    if (typeof tokenOrProvider === 'string') {
      // Allow empty token for anonymous users
      if (isAnonymous && tokenOrProvider === '') return;

      const tokenUserId = UserFromToken(tokenOrProvider);
      if (
        tokenOrProvider != null &&
        (tokenUserId == null ||
          tokenUserId === '' ||
          (!isAnonymous && tokenUserId !== user.id))
      ) {
        throw new Error(
          'userToken does not have a user_id or is not matching with user.id',
        );
      }
    }
  };

  // Resolves when token is ready. This function is simply to check if loadToken is in progress, in which
  // case a function should wait.
  tokenReady = () => this.loadTokenPromise;

  // Fetches a token from tokenProvider function and sets in tokenManager.
  // In case of static token, it will simply resolve to static token.
  loadToken = () => {
    // eslint-disable-next-line no-async-promise-executor
    this.loadTokenPromise = new Promise(async (resolve, reject) => {
      if (this.type === 'static') {
        return resolve(this.token as string);
      }

      if (this.tokenProvider && typeof this.tokenProvider !== 'string') {
        try {
          this.token = await this.tokenProvider();
        } catch (e) {
          return reject(
            new Error(`Call to tokenProvider failed with message: ${e}`),
          );
        }
        resolve(this.token);
      }
    });

    return this.loadTokenPromise;
  };

  // Returns a current token
  getToken = () => {
    if (this.token) {
      return this.token;
    }

    if (this.user && !this.token) {
      return this.token;
    }

    if (this.secret) {
      return JWTServerToken(this.secret);
    }

    throw new Error(
      `Both secret and user tokens are not set. Either client.connectUser wasn't called or client.disconnect was called`,
    );
  };

  isStatic = () => this.type === 'static';
}

import { getUserFromToken } from './signing';
import { isFunction } from './utils';
import type { TokenOrProvider, UserWithId } from './types';

/**
 * TokenManager
 *
 * Handles all the operations around user token.
 */
export class TokenManager {
  private loadTokenPromise: Promise<string> | null = null;
  private type: 'static' | 'provider' = 'static';
  private readonly secret?: string;
  private token?: string;
  private tokenProvider?: TokenOrProvider;
  private user?: UserWithId;
  private isAnonymous?: boolean;

  constructor(secret?: string) {
    this.secret = secret;
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
    user: UserWithId,
    isAnonymous: boolean,
  ) => {
    this.user = user;
    this.isAnonymous = isAnonymous;
    this.validateToken(tokenOrProvider);

    if (isFunction(tokenOrProvider)) {
      this.tokenProvider = tokenOrProvider;
      this.type = 'provider';
    }

    if (typeof tokenOrProvider === 'string') {
      this.token = tokenOrProvider;
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
    this.tokenProvider = undefined;
    this.type = 'static';
    this.user = undefined;
    this.loadTokenPromise = null;
  };

  // Validates the user token.
  validateToken = (tokenOrProvider: TokenOrProvider) => {
    // allow empty token for anon user
    if (this.user && this.isAnonymous && !tokenOrProvider) return;

    // Don't allow empty token for non-server side client.
    if (!this.secret && !tokenOrProvider) {
      throw new Error('User token can not be empty');
    }

    if (typeof tokenOrProvider !== 'string' && !isFunction(tokenOrProvider)) {
      throw new Error('User token should either be a string or a function');
    }

    if (typeof tokenOrProvider === 'string') {
      // Allow empty token for anonymous users
      if (this.isAnonymous && tokenOrProvider === '') return;

      const tokenUserId = getUserFromToken(tokenOrProvider);
      if (
        tokenOrProvider != null &&
        (tokenUserId == null ||
          tokenUserId === '' ||
          (!this.isAnonymous && tokenUserId !== this.user!.id))
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
    this.loadTokenPromise = new Promise(async (resolve, reject) => {
      if (this.type === 'static') {
        return resolve(this.token as string);
      }

      if (this.tokenProvider && typeof this.tokenProvider !== 'string') {
        try {
          const token = await this.tokenProvider();
          this.validateToken(token);
          this.token = token;
        } catch (e) {
          return reject(
            new Error(`Call to tokenProvider failed with message: ${e}`, {
              cause: e,
            }),
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

    throw new Error(
      `User token is not set. Either client.connectUser wasn't called or client.disconnect was called`,
    );
  };

  isStatic = () => this.type === 'static';
}

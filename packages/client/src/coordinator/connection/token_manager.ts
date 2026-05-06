import { getUserFromToken } from './signing';
import type { TokenOrProvider, UserWithId } from './types';

/**
 * TokenManager
 *
 * Handles all the operations around user token.
 */
export class TokenManager {
  private readonly secret?: string;
  private type: 'static' | 'provider' = 'static';
  private token?: string;
  private tokenProvider?: TokenOrProvider;
  private user?: UserWithId;
  private isAnonymous = false;
  private loadInFlight: Promise<string | undefined> | null = null;

  constructor(secret?: string) {
    this.secret = secret;
  }

  setTokenOrProvider = async (
    tokenOrProvider: TokenOrProvider,
    user: UserWithId,
    isAnonymous: boolean,
  ): Promise<void> => {
    this.user = user;
    this.isAnonymous = isAnonymous;
    this.validateToken(tokenOrProvider);

    if (typeof tokenOrProvider === 'function') {
      this.tokenProvider = tokenOrProvider;
      this.type = 'provider';
    } else if (typeof tokenOrProvider === 'string') {
      this.token = tokenOrProvider;
      this.type = 'static';
    }

    await this.loadToken();
  };

  /**
   * Resets the token manager.
   * Useful for client disconnection or switching user.
   */
  reset = (): void => {
    this.token = undefined;
    this.tokenProvider = undefined;
    this.type = 'static';
    this.user = undefined;
    this.loadInFlight = null;
  };

  /**
   * Resolves when token is ready. Returns the in-flight promise (or null when no
   * load is in progress). Callers may `await` the return value directly — `await null`
   * resolves to null, which preserves the legacy contract.
   */
  tokenReady = (): Promise<string | undefined> | null => this.loadInFlight;

  /**
   * Fetches a token from tokenProvider function and sets it in the manager.
   * For static tokens, resolves to the cached token immediately.
   *
   * Concurrent calls share the same in-flight promise (the provider is invoked
   * exactly once per cycle). The in-flight slot is cleared after settlement so a
   * subsequent call triggers a fresh provider invocation.
   */
  loadToken = (): Promise<string | undefined> => {
    if (this.loadInFlight) return this.loadInFlight;
    this.loadInFlight = (async () => {
      if (this.type === 'static') return this.token;
      if (!this.tokenProvider || typeof this.tokenProvider !== 'function') {
        return undefined;
      }
      try {
        const token = await this.tokenProvider();
        this.validateToken(token);
        this.token = token;
        return token;
      } catch (e) {
        throw new Error(`Call to tokenProvider failed with message: ${e}`, {
          cause: e,
        });
      }
    })().finally(() => {
      this.loadInFlight = null;
    });
    return this.loadInFlight;
  };

  /** Returns the current cached token, or undefined when none has been loaded. */
  getToken = (): string | undefined => this.token;

  isStatic = (): boolean => this.type === 'static';

  validateToken = (tokenOrProvider: TokenOrProvider): void => {
    if (this.user && this.isAnonymous && !tokenOrProvider) return;

    if (!this.secret && !tokenOrProvider) {
      throw new Error('User token can not be empty');
    }

    if (
      typeof tokenOrProvider !== 'string' &&
      typeof tokenOrProvider !== 'function'
    ) {
      throw new Error('User token should either be a string or a function');
    }

    if (typeof tokenOrProvider === 'string') {
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
}

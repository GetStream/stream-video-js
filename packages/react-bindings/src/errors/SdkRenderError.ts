/**
 * Shared across copies of this package, so that `instanceof SdkRenderError`
 * also matches errors created by another copy in the same app.
 */
const BRAND = Symbol.for('@stream-io/video-react-bindings/SdkRenderError');

/**
 * Thrown by `<StreamCall>` on React 17 and 18 when a component under it
 * throws during render. React 17/18 lose the original component stack when an
 * error boundary rethrows, so the SDK rethrows the original error wrapped in
 * this class instead:
 *
 * - `cause` is the original thrown value.
 * - `componentStack` is the original React component stack.
 * - `name`, `message`, `stack` and the original's own enumerable properties
 *   (such as `digest` or `code`) are copied over.
 *
 * On React 19 the original error is rethrown unchanged and this class is
 * never thrown.
 *
 * @example
 * const original = error instanceof SdkRenderError ? error.cause : error;
 */
export class SdkRenderError extends Error {
  /**
   * The React component stack captured where the original error was thrown.
   */
  componentStack: string;

  constructor(original: unknown, componentStack: string) {
    const error = original instanceof Error ? original : undefined;
    super(error ? error.message : String(original));
    if (typeof original === 'object' && original !== null) {
      Object.assign(this, original);
    }
    this.name = error ? error.name : 'SdkRenderError';
    if (error?.stack) this.stack = error.stack;
    this.cause = original;
    this.componentStack = componentStack;
    Object.defineProperty(this, BRAND, { value: true });
  }
}

// Not a `static [Symbol.hasInstance]` field: some Babel setups compile it to an
// assignment, which throws because the inherited property is read-only.
Object.defineProperty(SdkRenderError, Symbol.hasInstance, {
  value: (value: unknown) =>
    typeof value === 'object' && value !== null && BRAND in value,
});

import jscodeshift from 'jscodeshift';

/**
 * Maps parser name to file extension.
 */
export function extensionForParser(parser) {
  switch (parser) {
    case 'ts':
    case 'tsx':
      return parser;
    case 'flow':
      return 'js';
    default:
      return 'js';
  }
}

/**
 * Runs a jscodeshift transform on the provided source code.
 *
 * @param {Function} transform - The jscodeshift transform function
 * @param {string} source - The source code to transform
 * @param {object} [options] - Optional configuration
 * @param {string} [options.path] - The file path to use (affects parser inference)
 * @param {string} [options.parser] - Parser to use ('tsx', 'ts', 'babel', 'flow'). Defaults to transform.parser or 'tsx'
 * @returns {string} The transformed source code
 */
export function runTransform(transform, source, options = {}) {
  const parser = options.parser || 'tsx';
  const extension = extensionForParser(parser);
  const path = options.path || `input.${extension}`;

  const j = jscodeshift.withParser(parser);
  const api = {
    jscodeshift: j,
    j: jscodeshift,
    stats: () => {},
    report: () => {},
  };

  return transform({ path, source }, api, {});
}

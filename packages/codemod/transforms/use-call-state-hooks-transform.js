/**
 * Codemod to transform useCallStateHooks usage for React Compiler compatibility.
 *
 * Transforms:
 *   import { useCallStateHooks } from "@stream-io/video-react-sdk";
 *   const MyComponent = () => {
 *     const { useCallCallingState, useParticipants } = useCallStateHooks();
 *     ...
 *   };
 *
 * To:
 *   import { useCallStateHooks as getCallStateHooks } from "@stream-io/video-react-sdk";
 *   const { useCallCallingState, useParticipants } = getCallStateHooks();
 *   const MyComponent = () => {
 *     ...
 *   };
 */

const SDK_PACKAGES = [
  '@stream-io/video-react-sdk',
  '@stream-io/video-react-bindings',
  '@stream-io/video-react-native-sdk',
];

const ORIGINAL_NAME = 'useCallStateHooks';
const ALIAS_NAME = 'getCallStateHooks';

function closest(path, predicate) {
  let current = path.parent;
  while (current) {
    if (predicate(current)) return current;
    current = current.parent;
  }
  return null;
}

module.exports = function (fileInfo, api) {
  if (
    fileInfo.path.endsWith('.d.ts') ||
    fileInfo.path.includes('node_modules') ||
    fileInfo.path.includes('/dist/')
  ) {
    return fileInfo.source;
  }

  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  let hasChanges = false;
  let localImportName = null;
  let importDeclaration = null;

  root.find(j.ImportDeclaration).forEach((path) => {
    if (!SDK_PACKAGES.includes(path.node.source.value)) return;

    for (const specifier of path.node.specifiers ?? []) {
      if (
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.type === 'Identifier' &&
        specifier.imported.name === ORIGINAL_NAME
      ) {
        localImportName = specifier.local?.name ?? ORIGINAL_NAME;
        importDeclaration = path;
        return;
      }
    }
  });

  if (!localImportName || !importDeclaration) {
    return fileInfo.source;
  }

  const destructuredHooks = new Map();
  const callsToRemove = [];

  let firstFunctionStatement = null;
  let hasUnsupportedPattern = false;

  root.find(j.VariableDeclaration).forEach((path) => {
    path.node.declarations.forEach((decl, index) => {
      if (
        decl.init &&
        decl.init.type === 'CallExpression' &&
        decl.init.callee.type === 'Identifier' &&
        decl.init.callee.name === localImportName &&
        decl.id.type === 'ObjectPattern'
      ) {
        const fnPath = closest(
          path,
          (p) =>
            p.node.type === 'FunctionDeclaration' ||
            p.node.type === 'FunctionExpression' ||
            p.node.type === 'ArrowFunctionExpression',
        );

        if (!fnPath) return;

        if (path.parent.node !== fnPath.node.body) {
          hasUnsupportedPattern = true;
          return;
        }

        let stmtPath = fnPath;
        while (
          stmtPath &&
          stmtPath.parent &&
          stmtPath.parent.node.type !== 'Program'
        ) {
          stmtPath = stmtPath.parent;
        }
        const functionStatementPath = stmtPath;

        if (!firstFunctionStatement && functionStatementPath) {
          firstFunctionStatement = functionStatementPath;
        }

        decl.id.properties.forEach((prop) => {
          if (prop.type === 'RestElement') {
            hasUnsupportedPattern = true;
            return;
          }

          if (
            (prop.type === 'ObjectProperty' || prop.type === 'Property') &&
            prop.key.type === 'Identifier'
          ) {
            if (prop.value && prop.value.type !== 'Identifier') {
              hasUnsupportedPattern = true;
              return;
            }

            const originalName = prop.key.name;
            const localName =
              prop.value && prop.value.type === 'Identifier'
                ? prop.value.name
                : originalName;

            if (!destructuredHooks.has(originalName)) {
              destructuredHooks.set(originalName, localName);
            }
          }
        });

        callsToRemove.push({ path, index, decl });
        hasChanges = true;
      }
    });
  });

  if (hasUnsupportedPattern || !hasChanges) {
    return fileInfo.source;
  }

  j(importDeclaration)
    .find(j.ImportSpecifier)
    .filter((path) => path.node.imported.name === ORIGINAL_NAME)
    .forEach((path) => {
      j(path).replaceWith(
        j.importSpecifier(
          j.identifier(ORIGINAL_NAME),
          j.identifier(ALIAS_NAME),
        ),
      );
    });

  callsToRemove
    .sort((a, b) => b.index - a.index)
    .forEach(({ path, index }) => {
      const declarations = path.node.declarations;
      if (declarations.length === 1) {
        j(path).remove();
      } else {
        declarations.splice(index, 1);
      }
    });

  if (destructuredHooks.size > 0) {
    const properties = Array.from(destructuredHooks.entries()).map(
      ([originalName, localName]) => {
        const prop = j.property(
          'init',
          j.identifier(originalName),
          j.identifier(localName),
        );
        prop.shorthand = originalName === localName;
        return prop;
      },
    );

    const moduleDeclaration = j.variableDeclaration('const', [
      j.variableDeclarator(
        j.objectPattern(properties),
        j.callExpression(j.identifier(ALIAS_NAME), []),
      ),
    ]);

    if (firstFunctionStatement) {
      j(firstFunctionStatement).insertBefore(moduleDeclaration);
    } else {
      const imports = root.find(j.ImportDeclaration);
      if (imports.length > 0) {
        const lastImport = imports.at(-1);
        lastImport.insertAfter(moduleDeclaration);
      }
    }
  }

  return root.toSource({ quote: 'single' });
};

module.exports.parser = 'tsx';

/**
 * Minimal Node.js ESM loader that enables importing extensionless .ts files
 * and bare .json imports (without `with { type: 'json' }` attribute).
 *
 * Usage:
 *   node --experimental-strip-types --loader ./tests/unit/ts-loader.mjs \
 *        --test tests/unit/*.test.mjs
 */

import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';

export async function resolve(specifier, context, nextResolve) {
  // Resolve extensionless relative specifiers to .ts (or .json)
  if (specifier.startsWith('.') && !specifier.match(/\.[a-z]+$/i) && context.parentURL) {
    const parentPath = fileURLToPath(context.parentURL);
    for (const ext of ['.ts', '.json']) {
      const fullPath = resolvePath(parentPath, '..', specifier + ext);
      if (existsSync(fullPath)) {
        const resolved = await nextResolve(pathToFileURL(fullPath).href, context);
        // Inject JSON type attribute if resolving to a .json file
        if (ext === '.json') {
          return { ...resolved, importAttributes: { type: 'json' } };
        }
        return resolved;
      }
    }
  }

  // Inject JSON type attribute for any .json URL that lacks it
  if (specifier.endsWith('.json') || (context.parentURL && !context.importAttributes?.type)) {
    const resolved = await nextResolve(specifier, context);
    if (resolved.url.endsWith('.json')) {
      return { ...resolved, importAttributes: { type: 'json' } };
    }
    return resolved;
  }

  return nextResolve(specifier, context);
}

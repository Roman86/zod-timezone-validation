import { type ZodType, z } from 'zod';
import { findCustomMapping, getConfig, isCustomCanonical } from './config';
import {
  getCanonicalNamesLowerCase,
  getIanaCanonicalName,
  ianaCanonicalMappingsLowerKeys,
} from './ianaCanonical';

const runtimeCanonicalTzNamesLowerCaseSet = new Set(
  Intl.supportedValuesOf('timeZone').map((tz) => tz.toLowerCase()),
);

/**
 * Resolves a timezone via Intl. Not memoized — config can change at any time,
 * and Intl calls are cheap enough for a validation library.
 */
function resolveViaRuntime(tz: string): string | null {
  try {
    const formatter = Intl.DateTimeFormat(undefined, { timeZone: tz });
    return formatter.resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/**
 * Gets the canonical timezone name based on the current configuration mode.
 * Custom mappings from configuration take precedence.
 */
function getCanonicalName(tz: string): string | null {
  const customMapped = findCustomMapping(tz);
  if (customMapped) {
    return customMapped;
  }
  if (getConfig().canonicalMode === 'iana') {
    return getIanaCanonicalName(tz);
  }

  // runtime mode
  const resolved = resolveViaRuntime(tz);
  if (resolved) {
    const customResolvedMapped = findCustomMapping(resolved);
    if (customResolvedMapped) {
      return customResolvedMapped;
    }
  }
  return resolved;
}

/**
 * Checks if a timezone is strictly canonical based on the current configuration mode.
 */
function isStrictlyCanonical(tz: string): boolean {
  const lowerTz = tz.toLowerCase();
  const { canonicalMode } = getConfig();

  if (isCustomCanonical(tz)) {
    return true;
  }

  if (canonicalMode === 'iana') {
    return (
      getCanonicalNamesLowerCase().has(lowerTz) &&
      !ianaCanonicalMappingsLowerKeys.has(lowerTz)
    );
  }

  // runtime mode
  return runtimeCanonicalTzNamesLowerCaseSet.has(lowerTz);
}

/**
 * Checks if a timezone is valid (canonical or non-canonical).
 */
function isValidTimezone(tz: string): boolean {
  return resolveViaRuntime(tz) != null;
}

const errorSuffix = 'Refer to the latest IANA time zone database';

export const makeTimeZoneValidator = (
  nonCanonicalStrategy:
    | 'changeToCanonical'
    | 'keepNonCanonical'
    | 'assumeInvalid',
): ZodType<string> => {
  if (nonCanonicalStrategy === 'assumeInvalid') {
    return z.string().refine((val) => isStrictlyCanonical(val), {
      error: (e) =>
        `Non-canonical time zone name "${String(e.input)}". ${errorSuffix}`,
    });
  } else if (nonCanonicalStrategy === 'changeToCanonical') {
    return z.string().transform((v, ctx) => {
      const canonical = getCanonicalName(v);
      if (canonical == null) {
        ctx.issues.push({
          code: 'invalid_value',
          message: `Invalid time zone name "${v}". ${errorSuffix}`,
          values: [v],
          input: v,
        });
        return z.NEVER;
      }
      return canonical;
    });
  }

  // otherwise keepNonCanonical
  return z.string().refine((val) => isValidTimezone(val), {
    error: (e) =>
      `Invalid time zone name "${String(e.input)}" (refer to IANA time zone database)`,
  });
};

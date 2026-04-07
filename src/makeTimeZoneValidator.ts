import { type ZodType, z } from 'zod';
import type { ResolvedConfig } from './config';
import {
  getIanaCanonicalName,
  getIanaMappings,
  getRuntimeCanonicalSet,
} from './ianaCanonical';

function resolveViaRuntime(tz: string): string | null {
  try {
    const formatter = Intl.DateTimeFormat(undefined, { timeZone: tz });
    return formatter.resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

function getCanonicalName(
  tz: string,
  config: ResolvedConfig,
  canonicalNames: ReadonlyMap<string, string>,
): string | null {
  const lowerTz = tz.toLowerCase();
  const customMapped = config.customMappingsLowerKeys.get(lowerTz);
  if (customMapped) {
    return customMapped;
  }

  if (config.canonicalMode === 'iana') {
    return getIanaCanonicalName(lowerTz, config, canonicalNames);
  }

  // runtime mode
  const resolved = resolveViaRuntime(tz);
  if (resolved) {
    const customResolvedMapped = config.customMappingsLowerKeys.get(
      resolved.toLowerCase(),
    );
    if (customResolvedMapped) {
      return customResolvedMapped;
    }
  }
  return resolved;
}

function isStrictlyCanonical(
  tz: string,
  config: ResolvedConfig,
  canonicalNames: ReadonlyMap<string, string>,
): boolean {
  const lowerTz = tz.toLowerCase();

  if (config.customCanonicalNamesLowerCase.has(lowerTz)) {
    return true;
  }

  if (config.canonicalMode === 'iana') {
    return (
      canonicalNames.has(lowerTz) &&
      !getIanaMappings().has(lowerTz)
    );
  }

  // runtime mode
  return getRuntimeCanonicalSet().has(lowerTz);
}

function isValidTimezone(tz: string): boolean {
  return resolveViaRuntime(tz) != null;
}

const errorSuffix = 'Refer to the latest IANA time zone database';

export const makeTimeZoneValidator = (
  nonCanonicalStrategy:
    | 'changeToCanonical'
    | 'keepNonCanonical'
    | 'assumeInvalid',
  config: ResolvedConfig,
  canonicalNames: ReadonlyMap<string, string>,
): ZodType<string> => {
  if (nonCanonicalStrategy === 'assumeInvalid') {
    return z.string().refine(
      (val) => isStrictlyCanonical(val, config, canonicalNames),
      {
        error: (e) =>
          `Non-canonical time zone name "${String(e.input)}". ${errorSuffix}`,
      },
    );
  } else if (nonCanonicalStrategy === 'changeToCanonical') {
    return z.string().transform((v, ctx) => {
      const canonical = getCanonicalName(v, config, canonicalNames);
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

  // keepNonCanonical
  return z.string().refine((val) => isValidTimezone(val), {
    error: (e) =>
      `Invalid time zone name "${String(e.input)}" (refer to IANA time zone database)`,
  });
};

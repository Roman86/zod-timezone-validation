import type z from 'zod';
import {
  type TimezoneSchemaOptions,
  resolveConfig,
} from './config';
import { buildCanonicalNamesMap } from './ianaCanonical';
import { makeTimeZoneValidator } from './makeTimeZoneValidator';

export type {
  CanonicalMode,
  TimezoneMapping,
  TimezoneSchemaOptions,
} from './config';


/**
 * Creates a set of timezone validation schemas with the given configuration.
 *
 * @example
 * ```typescript
 * import { createTimezoneSchemas } from 'zod-timezone-validation';
 *
 * // Default: IANA mode, no custom mappings
 * const { CoercedCanonicalTimezoneSchema } = createTimezoneSchemas();
 *
 * // Runtime mode with custom mappings
 * const { CanonicalTimezoneSchema } = createTimezoneSchemas({
 *   canonicalMode: 'runtime',
 *   customMappings: [
 *     ['Asia/Calcutta', 'Asia/Kolkata'],
 *     ['legacy/zone', 'My/New/Canonical'],
 *   ],
 * });
 * ```
 */
export function createTimezoneSchemas(
  options?: TimezoneSchemaOptions,
) {
  const config = resolveConfig(options);
  const canonicalNames = buildCanonicalNamesMap(config);

  return {
    /** Validates and transforms to canonical form (e.g. `US/Eastern` → `America/New_York`). */
    CoercedCanonicalTimezoneSchema: makeTimeZoneValidator(
      'changeToCanonical',
      config,
      canonicalNames,
    ).brand('CanonicalTimezone'),
    /** Accepts only strictly canonical names. Rejects valid but non-canonical aliases. */
    CanonicalTimezoneSchema: makeTimeZoneValidator(
      'assumeInvalid',
      config,
      canonicalNames,
    ).brand('CanonicalTimezone'),
    /** Accepts any valid timezone — canonical or non-canonical — without transformation. */
    TimezoneSchema: makeTimeZoneValidator(
      'keepNonCanonical',
      config,
      canonicalNames,
    ).brand('Timezone'),
  };
}

/** The return type of `createTimezoneSchemas`. */
export type TimezoneSchemas = ReturnType<typeof createTimezoneSchemas>;

/** Branded string type for a canonical timezone (inferred from schema output). */
export type CanonicalTimezone = z.infer<TimezoneSchemas['CoercedCanonicalTimezoneSchema']>;

/** Branded string type for any valid timezone (inferred from schema output). */
export type Timezone = z.infer<TimezoneSchemas['TimezoneSchema']>;

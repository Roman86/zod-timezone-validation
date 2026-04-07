import { z } from 'zod';

/**
 * Defines how "canonical" timezone names are determined.
 *
 * - `'iana'` (default): Uses a strict IANA-compliant list where only the latest canonical names are accepted.
 *   Provides consistent behavior across all environments.
 *
 * - `'runtime'`: Uses the runtime's `Intl` implementation to determine canonical names.
 *   Results may vary between environments (e.g., Chromium considers `Asia/Calcutta`
 *   canonical, while Node.js and Firefox use `Asia/Kolkata`).
 */
export type CanonicalMode = 'runtime' | 'iana';

/**
 * A tuple representing a custom timezone mapping.
 * [0] - The non-canonical name (will be matched case-insensitively)
 * [1] - The canonical name to map to (preserved as-is, treated as canonical)
 */
export type TimezoneMapping = readonly [
  nonCanonical: string,
  canonical: string,
];

const TimezoneMappingSchema = z.tuple([
  z.string().min(1, 'Non-canonical timezone name cannot be empty'),
  z.string().min(1, 'Canonical timezone name cannot be empty'),
]);

const CustomMappingsSchema = z.array(
  TimezoneMappingSchema.transform(([k, v]) => [k.toLowerCase(), v] as const),
);

export interface TimezoneSchemaOptions {
  /**
   * Determines how canonical timezone names are resolved.
   * @default 'iana'
   */
  canonicalMode?: CanonicalMode;
  /**
   * Custom timezone mappings that override built-in mappings.
   * Array of tuples: [nonCanonicalName, canonicalName]
   *
   * Keys are matched case-insensitively.
   * Values are treated as canonical names — if the value doesn't exist
   * in the built-in canonical sets, it becomes a new valid canonical name.
   */
  customMappings?: TimezoneMapping[];
}

/**
 * Immutable resolved configuration. Created once per factory call.
 */
export interface ResolvedConfig {
  readonly canonicalMode: CanonicalMode;
  readonly customMappingsLowerKeys: ReadonlyMap<string, string>;
  readonly customCanonicalNamesLowerCase: ReadonlySet<string>;
}

export function resolveConfig(options?: TimezoneSchemaOptions): ResolvedConfig {
  const canonicalMode = options?.canonicalMode ?? 'iana';

  if (!options?.customMappings?.length) {
    return {
      canonicalMode,
      customMappingsLowerKeys: new Map(),
      customCanonicalNamesLowerCase: new Set(),
    };
  }

  const parsed = CustomMappingsSchema.parse(options.customMappings);

  return {
    canonicalMode,
    customMappingsLowerKeys: new Map(parsed),
    customCanonicalNamesLowerCase: new Set(
      parsed.map(([, canonical]) => canonical.toLowerCase()),
    ),
  };
}

import { z } from 'zod';

/**
 * Defines how "canonical" timezone names are determined.
 *
 * - `'runtime'` (default): Uses the runtime's `Intl` implementation to determine canonical names.
 *   This means results may vary between environments (e.g., Chromium considers `Asia/Calcutta`
 *   canonical, while Node.js and Firefox use `Asia/Kolkata`).
 *
 * - `'iana'`: Uses a strict IANA-compliant list where only the latest canonical names are accepted.
 *   This provides consistent behavior across all environments but requires maintaining a list
 *   of known canonical mappings.
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

/**
 * Zod schema for validating a single timezone mapping tuple.
 */
const TimezoneMappingSchema = z.tuple([
  z.string().min(1, 'Non-canonical timezone name cannot be empty'),
  z.string().min(1, 'Canonical timezone name cannot be empty'),
]);

/**
 * Zod schema for validating an array of timezone mapping tuples.
 */
const CustomMappingsSchema = z.array(
  TimezoneMappingSchema.transform(([k, v]) => [k.toLowerCase(), v] as const),
);

interface Config {
  canonicalMode: CanonicalMode;
  customMappingsLowerKeys: Map<string, string>;
  /**
   * Set of custom canonical names (lowercase) introduced via customMappings values.
   * These are names that don't exist in the built-in canonical sets.
   */
  customCanonicalNamesLowerCase: Set<string>;
}

const defaultConfig = (): Config => ({
  canonicalMode: 'runtime',
  customMappingsLowerKeys: new Map(),
  customCanonicalNamesLowerCase: new Set(),
});

let config: Config = defaultConfig();

const onChangeListeners: Array<() => void> = [];

export interface ConfigureOptions {
  /**
   * Determines how canonical timezone names are resolved:
   * - `'runtime'` (default): Uses the runtime's `Intl` implementation. Results may vary between
   *   environments (e.g., Chromium vs Node.js may disagree on which name is canonical).
   * - `'iana'`: Uses strict IANA-compliant canonical names. Provides consistent behavior
   *   across all environments.
   */
  canonicalMode?: CanonicalMode;
  /**
   * Custom timezone mappings that override built-in mappings.
   * Array of tuples: [nonCanonicalName, canonicalName]
   *
   * - Keys (nonCanonicalName) are matched case-insensitively.
   * - Values (canonicalName) are treated as canonical names. If the value doesn't exist
   *   in the built-in canonical sets, it becomes a new valid canonical name.
   *
   * @example
   * ```TypeScript
   * configureTimezoneSchema({
   *   customMappings: [
   *     ['My/Custom/Zone', 'America/New_York'],  // Map to existing canonical
   *     ['Asia/Calcutta', 'Asia/Kolkata'],       // Force specific mapping
   *     ['legacy/zone', 'My/New/Canonical'],     // Introduce new canonical name
   *   ]
   * });
   * ```
   */
  customMappings?: TimezoneMapping[];
}

/**
 * Configures the global behavior of timezone validation.
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * import { configureTimezoneSchema } from 'zod-timezone-validation';
 *
 * // Use strict IANA canonical names (consistent across environments)
 * configureTimezoneSchema({ canonicalMode: 'iana' });
 *
 * // Use runtime's Intl implementation (default, may vary by environment)
 * configureTimezoneSchema({ canonicalMode: 'runtime' });
 *
 * // Add custom mappings (array of tuples, case-insensitive keys)
 * configureTimezoneSchema({
 *   customMappings: [
 *     ['Asia/Calcutta', 'Asia/Kolkata'],
 *     ['my/legacy/zone', 'America/New_York'],
 *   ]
 * });
 * ```
 */
export function configureTimezoneSchema(options: ConfigureOptions): void {
  if (options.canonicalMode) {
    config.canonicalMode = options.canonicalMode;
  }
  if (options.customMappings) {
    const parsed = CustomMappingsSchema.parse(options.customMappings);

    config.customMappingsLowerKeys = new Map(parsed);

    config.customCanonicalNamesLowerCase = new Set(
      parsed.map(([, canonical]) => canonical.toLowerCase()),
    );
  }
  for (const listener of onChangeListeners) {
    listener();
  }
}

/**
 * Resets configuration to defaults. Useful for testing.
 */
export function resetConfig(): void {
  config = defaultConfig();
  for (const listener of onChangeListeners) {
    listener();
  }
}

/**
 * Register a callback to be notified when config changes.
 */
export function onConfigChange(listener: () => void): void {
  onChangeListeners.push(listener);
}

/**
 * Returns the current configuration.
 */
export function getConfig(): Readonly<Config> {
  return config;
}

/**
 * Looks up a timezone in custom mappings (case-insensitive).
 * Returns the canonical name if found, undefined otherwise.
 */
export function findCustomMapping(timezone: string): string | undefined {
  return config.customMappingsLowerKeys.get(timezone.toLowerCase());
}

/**
 * Checks if a timezone name is a custom canonical name (case-insensitive).
 */
export function isCustomCanonical(timezone: string): boolean {
  return config.customCanonicalNamesLowerCase.has(timezone.toLowerCase());
}

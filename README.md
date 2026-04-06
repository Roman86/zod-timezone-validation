# Zod Timezone Validation

[![npm version](https://badge.fury.io/js/zod-timezone-validation.svg)](https://badge.fury.io/js/zod-timezone-validation)


A lightweight and robust Zod schema for validating [IANA](https://www.iana.org/time-zones) timezone strings, with flexible handling of canonical and non-canonical names.

This library leverages the native `Intl` API, ensuring that timezone validation is always up-to-date with the user's environment without needing to bundle large timezone databases.

## Key Features

-   **Three Validation Strategies**:
    -   Strictly canonical names only.
    -   Allow valid, but non-canonical names.
    -   Transform non-canonical names to their canonical equivalents (e.g., `Asia/Calcutta` -> `Asia/Kolkata`).
-   **Configurable Canonical Mode**: Choose between runtime-based (`Intl`) or strict IANA canonical names (solves runtime-related discrepancies) for consistent cross-environment behavior.
-   **Custom Mappings**: Override or extend timezone mappings for edge cases.
-   **Zero Dependencies**: Relies only on `zod` as a peer dependency.
-   **Lightweight**: No bundled timezone data, uses the environment's native `Intl` API.
-   **Fully Typed**: Written in TypeScript with branded types for extra type safety.

### Brief Overview of Exports

-   `CoercedCanonicalTimezoneSchema`: Validates a timezone and **transforms** it to its canonical form (e.g., `US/Eastern` becomes `America/New_York`). Infers a branded type `CanonicalTimezone`.
-   `CanonicalTimezoneSchema`: Ensures a timezone is **strictly** in its canonical form. Rejects valid but non-canonical names. Infers a branded type `CanonicalTimezone`.
-   `TimezoneSchema`: Validates any valid timezone, **allowing both canonical and non-canonical names** without transformation. Infers a branded type `Timezone`.
-   `configureTimezoneSchema(options)`: Configure global behavior (canonical mode, custom mappings).
-   `CanonicalTimezone`: The branded `string` type for a canonical timezone.
-   `Timezone`: The branded `string` type for any valid timezone.
-   `CanonicalMode`: Type for the canonical mode option (`'runtime'` | `'iana'`).
-   `ConfigureOptions`: Type for the configuration options object.
-   `TimezoneMapping`: Type for a custom mapping tuple `[nonCanonical, canonical]`.

Using branded types provides extra type safety, ensuring that you don't accidentally assign a plain `string` where a validated timezone is expected. You can use the exported types in your function signatures and interfaces.

### ❤️ Enjoying this package? Consider buying me a coffee as a token of appreciation!

[<img src="https://raw.githubusercontent.com/Roman86/assets/main/img/bmc_qr_240.png" alt="Buy Me A Coffee" width="120" height="120">](https://www.buymeacoffee.com/romanjs)


## Installation

```bash
npm install zod-timezone-validation
```

or

```bash
yarn add zod-timezone-validation
```

**Note:** `zod` is a peer dependency and must be installed in your project.

## Usage

The library exports three pre-configured Zod schemas to cover the most common use cases.

### `CoercedCanonicalTimezoneSchema`

This schema validates that a string is a valid IANA timezone. If a non-canonical name is provided, it automatically transforms it into its canonical equivalent.

```typescript
import { CoercedCanonicalTimezoneSchema } from 'zod-timezone-validation';

// Transforms non-canonical to canonical
const result1 = CoercedCanonicalTimezoneSchema.parse('Asia/Calcutta');
console.log(result1); // => 'Asia/Kolkata'

// Keeps canonical names as they are
const result2 = CoercedCanonicalTimezoneSchema.parse('America/New_York');
console.log(result2); // => 'America/New_York'

// Throws an error for invalid timezones
try {
  CoercedCanonicalTimezoneSchema.parse('Invalid/Timezone');
} catch (e) {
  console.error(e); // ZodError
}
```

### `CanonicalTimezoneSchema`

This schema ensures the provided string is a **strictly canonical** IANA timezone name. It will reject any valid but non-canonical names.

```typescript
import { CanonicalTimezoneSchema } from 'zod-timezone-validation';

// Accepts canonical names
const result = CanonicalTimezoneSchema.parse('Europe/London');
console.log(result); // => 'Europe/London'

// Rejects non-canonical names
try {
  CanonicalTimezoneSchema.parse('GB'); // 'GB' is a non-canonical alias for 'Europe/London'
} catch (e) {
  console.error(e); // ZodError
}
```

### `TimezoneSchema`

This schema is more lenient and validates that a string is a valid IANA timezone, allowing both canonical and non-canonical names without transformation (use CoercedCanonicalTimezoneSchema if you need to transform).

```typescript
import { TimezoneSchema } from 'zod-timezone-validation';

// Accepts canonical names
const result1 = TimezoneSchema.parse('Australia/Sydney');
console.log(result1); // => 'Australia/Sydney'

// Also accepts non-canonical names
const result2 = TimezoneSchema.parse('US/Eastern');
console.log(result2); // => 'US/Eastern'

// Throws an error for invalid timezones
try {
  TimezoneSchema.parse('Mars/Olympus_Mons');
} catch (e) {
  console.error(e); // ZodError
}
```

## Configuration

### Canonical Mode

Different JavaScript runtimes (browsers, Node.js) may disagree on what constitutes a "canonical" timezone name. For example, Chromium-based browsers may consider `Asia/Calcutta` canonical, while Node.js and Firefox use `Asia/Kolkata`.

To ensure consistent behavior across all environments, you can configure the library to use strict IANA canonical names:

```typescript
import { configureTimezoneSchema, CoercedCanonicalTimezoneSchema } from 'zod-timezone-validation';

// Use strict IANA canonical names (consistent across environments)
configureTimezoneSchema({ canonicalMode: 'iana' });

// Now Asia/Calcutta will always become Asia/Kolkata, regardless of the runtime
const result = CoercedCanonicalTimezoneSchema.parse('Asia/Calcutta');
console.log(result); // => 'Asia/Kolkata'

// Use runtime's Intl implementation (default, may vary by environment)
configureTimezoneSchema({ canonicalMode: 'runtime' });
```

**Available modes:**
- `'runtime'` (default): Uses the runtime's `Intl` implementation. Results may vary between environments.
- `'iana'`: Uses strict IANA-compliant canonical names (`Intl` with conflicts resolution layer). Provides consistent behavior across all environments.

### Custom Mappings

You can provide custom timezone mappings that override the built-in behavior. Mappings are defined as an array of case-insensitive tuples `[nonCanonicalName, canonicalName]`:

```typescript
import { configureTimezoneSchema, CoercedCanonicalTimezoneSchema } from 'zod-timezone-validation';

configureTimezoneSchema({
  // case-insensitive keys and values
  customMappings: [
    // Force a specific mapping
    ['Asia/Calcutta', 'Asia/Kolkata'],
    // Add a custom alias
    ['my/customzone', 'America/New_York'],
    // Introduce a new timezone name (will be assumed valid and canonical)
    ['legacy/zone', 'My/New/Canonical'],
  ]
});

const result1 = CoercedCanonicalTimezoneSchema.parse('My/CustomZone');
console.log(result1); // => 'America/New_York'

const result2 = CoercedCanonicalTimezoneSchema.parse('Legacy/Zone');
console.log(result2); // => 'My/New/Canonical'
```

**Key features:**
- Keys (non-canonical names) are matched **case-insensitively**.
- Values (canonical names) are treated as valid canonical names. If the value doesn't exist in the built-in canonical sets, it becomes a new valid canonical name.
- Custom mappings take precedence over both IANA and runtime mappings.

## Getting a List of Timezones

While this library focuses on *validating* timezone strings, it doesn't provide an exhaustive list of them. The environment already provides a way to get a list of all supported IANA timezone names through the native `Intl` API.

You can get an array of all available timezones like this:

```typescript
const availableTimezones = Intl.supportedValuesOf('timeZone');

console.log(availableTimezones);
// => ['Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', ..., 'Zulu']
```

This approach ensures that you are working with the timezones supported by the user's runtime environment (browser or server), without needing to bundle a large, static list.

## License

This project is licensed under the MIT License.


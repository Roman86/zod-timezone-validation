# Zod Timezone Validation

[![npm version](https://badge.fury.io/js/zod-timezone-validation.svg)](https://badge.fury.io/js/zod-timezone-validation)


A lightweight and robust Zod schema for validating IANA timezone strings, with flexible handling of canonical and non-canonical names.

This library leverages the native `Intl` API, ensuring that timezone validation is always up-to-date with the user's environment without needing to bundle large timezone databases.

## Key Features

-   **Three Validation Strategies**:
    -   Strictly canonical names only.
    -   Allow non-canonical names.
    -   Transform non-canonical names to their canonical equivalents (e.g., `Asia/Calcutta` -> `Asia/Kolkata`).
-   **Zero Dependencies**: Relies only on `zod` as a peer dependency.
-   **Lightweight**: No bundled timezone data, uses the environment's native `Intl` API.
-   **Fully Typed**: Written in TypeScript.

### Brief Overview of Exports

-   `zIANACanonicalTimezone`: A `ZodType<string>` that validates and transforms to canonical timezone names.
-   `zIANAStrictlyCanonicalTimezone`: A `ZodType<string>` that validates for strictly canonical timezone names.
-   `zIANATimezone`: A `ZodType<string>` that validates for any valid (canonical or non-canonical) timezone name (doesn't convert to canonical, unlike zIANACanonicalTimezone).

### ❤️ Enjoying this package? Consider buying me a coffee as a token of appreciation!

[<img src="src/bmc_qr.png" alt="Buy Me A Coffee" width="120" height="120">](https://www.buymeacoffee.com/romanjs)


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

### `zIANACanonicalTimezone`

This schema validates that a string is a valid IANA timezone. If a non-canonical name is provided, it automatically transforms it into its canonical equivalent.

```typescript
import { zIANACanonicalTimezone } from 'zod-timezone-validation';

// Transforms non-canonical to canonical
const result1 = zIANACanonicalTimezone.parse('Asia/Calcutta');
console.log(result1); // => 'Asia/Kolkata'

// Keeps canonical names as they are
const result2 = zIANACanonicalTimezone.parse('America/New_York');
console.log(result2); // => 'America/New_York'

// Throws an error for invalid timezones
try {
  zIANACanonicalTimezone.parse('Invalid/Timezone');
} catch (e) {
  console.error(e); // ZodError
}
```

### `zIANAStrictlyCanonicalTimezone`

This schema ensures the provided string is a **strictly canonical** IANA timezone name. It will reject any valid but non-canonical names.

```typescript
import { zIANAStrictlyCanonicalTimezone } from 'zod-timezone-validation';

// Accepts canonical names
const result = zIANAStrictlyCanonicalTimezone.parse('Europe/London');
console.log(result); // => 'Europe/London'

// Rejects non-canonical names
try {
  zIANAStrictlyCanonicalTimezone.parse('GB'); // 'GB' is a non-canonical alias for 'Europe/London'
} catch (e) {
  console.error(e); // ZodError
}
```

### `zIANATimezone`

This schema is more lenient and validates that a string is a valid IANA timezone, allowing both canonical and non-canonical names without transformation (use zIANACanonicalTimezone if you need to transform).

```typescript
import { zIANATimezone } from 'zod-timezone-validation';

// Accepts canonical names
const result1 = zIANATimezone.parse('Australia/Sydney');
console.log(result1); // => 'Australia/Sydney'

// Also accepts non-canonical names
const result2 = zIANATimezone.parse('US/Eastern');
console.log(result2); // => 'US/Eastern'

// Throws an error for invalid timezones
try {
  zIANATimezone.parse('Mars/Olympus_Mons');
} catch (e) {
  console.error(e); // ZodError
}
```

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


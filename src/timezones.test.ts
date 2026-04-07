import { createTimezoneSchemas } from './index';

describe('Runtime (CLDR/ICU) mode — default', () => {
  const { CoercedCanonicalTimezoneSchema, CanonicalTimezoneSchema, TimezoneSchema } =
    createTimezoneSchemas();

  const canonicalTZ = 'America/Chicago';
  const nonCanonicalAlias = 'US/Central';
  const nonCanonicalAliasLowerCase = 'us/central';
  const nonsense = 'nonsense';

  test('TimezoneSchema accepts canonical names', () => {
    expect(TimezoneSchema.parse(canonicalTZ)).toBe(canonicalTZ);
  });

  test('TimezoneSchema accepts non-canonical names as-is', () => {
    expect(TimezoneSchema.parse(nonCanonicalAlias)).toBe(nonCanonicalAlias);
    expect(TimezoneSchema.parse(nonCanonicalAliasLowerCase)).toBe(
      nonCanonicalAliasLowerCase,
    );
  });

  test('TimezoneSchema rejects invalid timezones', () => {
    expect(() => TimezoneSchema.parse(nonsense)).toThrow();
  });

  test('CoercedCanonicalTimezoneSchema transforms non-canonical to canonical', () => {
    expect(CoercedCanonicalTimezoneSchema.parse(nonCanonicalAlias)).toBe(
      canonicalTZ,
    );
    expect(
      CoercedCanonicalTimezoneSchema.parse(nonCanonicalAliasLowerCase),
    ).toBe(canonicalTZ);
  });

  test('CoercedCanonicalTimezoneSchema keeps canonical names', () => {
    expect(CoercedCanonicalTimezoneSchema.parse(canonicalTZ)).toBe(canonicalTZ);
  });

  test('CoercedCanonicalTimezoneSchema rejects invalid timezones', () => {
    expect(() => CoercedCanonicalTimezoneSchema.parse(nonsense)).toThrow();
  });

  test('CanonicalTimezoneSchema accepts canonical names', () => {
    expect(CanonicalTimezoneSchema.parse(canonicalTZ)).toBe(canonicalTZ);
  });

  test('CanonicalTimezoneSchema rejects non-canonical names', () => {
    expect(() => CanonicalTimezoneSchema.parse(nonCanonicalAlias)).toThrow();
    expect(() =>
      CanonicalTimezoneSchema.parse(nonCanonicalAliasLowerCase),
    ).toThrow();
  });

  test('CanonicalTimezoneSchema rejects invalid timezones', () => {
    expect(() => CanonicalTimezoneSchema.parse(nonsense)).toThrow();
  });
});

describe('IANA canonical mode', () => {
  const { CoercedCanonicalTimezoneSchema, CanonicalTimezoneSchema } =
    createTimezoneSchemas({ canonicalMode: 'iana' });

  test('CoercedCanonicalTimezoneSchema maps to IANA canonical names', () => {
    expect(CoercedCanonicalTimezoneSchema.parse('Asia/Calcutta')).toBe(
      'Asia/Kolkata',
    );
    expect(CoercedCanonicalTimezoneSchema.parse('Europe/Kiev')).toBe(
      'Europe/Kyiv',
    );
    expect(CoercedCanonicalTimezoneSchema.parse('US/Eastern')).toBe(
      'America/New_York',
    );
  });

  test('CoercedCanonicalTimezoneSchema handles case-insensitive input', () => {
    expect(CoercedCanonicalTimezoneSchema.parse('asia/calcutta')).toBe(
      'Asia/Kolkata',
    );
    expect(CoercedCanonicalTimezoneSchema.parse('europe/kiev')).toBe(
      'Europe/Kyiv',
    );
  });

  test('CoercedCanonicalTimezoneSchema normalizes casing of canonical names', () => {
    expect(CoercedCanonicalTimezoneSchema.parse('america/new_york')).toBe(
      'America/New_York',
    );
    expect(CoercedCanonicalTimezoneSchema.parse('EUROPE/LONDON')).toBe(
      'Europe/London',
    );
  });

  test('CanonicalTimezoneSchema rejects IANA non-canonical names', () => {
    expect(() => CanonicalTimezoneSchema.parse('Asia/Calcutta')).toThrow();
    expect(() => CanonicalTimezoneSchema.parse('Europe/Kiev')).toThrow();
    expect(() => CanonicalTimezoneSchema.parse('US/Eastern')).toThrow();
  });

  test('CanonicalTimezoneSchema accepts IANA canonical names', () => {
    expect(CanonicalTimezoneSchema.parse('Asia/Kolkata')).toBe('Asia/Kolkata');
    expect(CanonicalTimezoneSchema.parse('Europe/Kyiv')).toBe('Europe/Kyiv');
    expect(CanonicalTimezoneSchema.parse('America/New_York')).toBe(
      'America/New_York',
    );
  });

  test('CoercedCanonicalTimezoneSchema handles legacy abbreviations', () => {
    expect(CoercedCanonicalTimezoneSchema.parse('GB')).toBe('Europe/London');
    expect(CoercedCanonicalTimezoneSchema.parse('Japan')).toBe('Asia/Tokyo');
    expect(CoercedCanonicalTimezoneSchema.parse('Egypt')).toBe('Africa/Cairo');
  });

  test('CoercedCanonicalTimezoneSchema handles Etc zones', () => {
    expect(CoercedCanonicalTimezoneSchema.parse('UTC')).toBe('Etc/UTC');
    expect(CoercedCanonicalTimezoneSchema.parse('GMT')).toBe('Etc/GMT');
    expect(CoercedCanonicalTimezoneSchema.parse('Zulu')).toBe('Etc/UTC');
  });
});

describe('Custom mappings', () => {
  test('custom mappings override default behavior in runtime mode', () => {
    const { CoercedCanonicalTimezoneSchema } = createTimezoneSchemas({
      customMappings: [['America/Chicago', 'Custom/Chicago']],
    });

    expect(CoercedCanonicalTimezoneSchema.parse('America/Chicago')).toBe(
      'Custom/Chicago',
    );
    expect(CoercedCanonicalTimezoneSchema.parse('America/New_York')).toBe(
      'America/New_York',
    );
  });

  test('custom mappings are case-insensitive for keys', () => {
    const { CoercedCanonicalTimezoneSchema } = createTimezoneSchemas({
      customMappings: [['america/chicago', 'Custom/Chicago']],
    });

    expect(CoercedCanonicalTimezoneSchema.parse('America/Chicago')).toBe(
      'Custom/Chicago',
    );
    expect(CoercedCanonicalTimezoneSchema.parse('AMERICA/CHICAGO')).toBe(
      'Custom/Chicago',
    );
    expect(CoercedCanonicalTimezoneSchema.parse('america/chicago')).toBe(
      'Custom/Chicago',
    );
  });

  test('custom mappings override built-in IANA mappings', () => {
    const { CoercedCanonicalTimezoneSchema } = createTimezoneSchemas({
      canonicalMode: 'iana',
      customMappings: [['Asia/Calcutta', 'Custom/India']],
    });

    expect(CoercedCanonicalTimezoneSchema.parse('Asia/Calcutta')).toBe(
      'Custom/India',
    );
    expect(CoercedCanonicalTimezoneSchema.parse('Europe/Kiev')).toBe(
      'Europe/Kyiv',
    );
  });

  test('custom mappings chain through runtime resolution', () => {
    const { CoercedCanonicalTimezoneSchema } = createTimezoneSchemas({
      canonicalMode: 'runtime',
      customMappings: [['America/Chicago', 'My/Central']],
    });

    // US/Central -> America/Chicago (via runtime) -> My/Central (via custom)
    expect(CoercedCanonicalTimezoneSchema.parse('US/Central')).toBe(
      'My/Central',
    );
  });

  test('custom canonical names are accepted by CanonicalTimezoneSchema', () => {
    const { CanonicalTimezoneSchema } = createTimezoneSchemas({
      customMappings: [['legacy/zone', 'My/New/Canonical']],
    });

    expect(CanonicalTimezoneSchema.parse('My/New/Canonical')).toBe(
      'My/New/Canonical',
    );
  });

  test('custom mappings coerce to custom canonical names', () => {
    const { CoercedCanonicalTimezoneSchema } = createTimezoneSchemas({
      customMappings: [['legacy/zone', 'My/New/Canonical']],
    });

    expect(CoercedCanonicalTimezoneSchema.parse('Legacy/Zone')).toBe(
      'My/New/Canonical',
    );
  });

  test('custom mappings validate input — rejects empty strings', () => {
    expect(() =>
      createTimezoneSchemas({ customMappings: [['', 'America/Chicago']] }),
    ).toThrow();
    expect(() =>
      createTimezoneSchemas({ customMappings: [['US/Central', '']] }),
    ).toThrow();
  });
});

describe('Isolation — different configs do not interfere', () => {
  test('two instances with different modes are independent', () => {
    const runtime = createTimezoneSchemas({ canonicalMode: 'runtime' });
    const iana = createTimezoneSchemas({ canonicalMode: 'iana' });

    // Asia/Calcutta is canonical in some runtimes, non-canonical in IANA
    expect(() => iana.CanonicalTimezoneSchema.parse('Asia/Calcutta')).toThrow();
    // Runtime mode depends on environment, but shouldn't throw for valid tz
    expect(runtime.TimezoneSchema.parse('Asia/Calcutta')).toBe('Asia/Calcutta');
  });

  test('custom mappings in one instance do not affect another', () => {
    const withCustom = createTimezoneSchemas({
      customMappings: [['America/Chicago', 'Custom/Chicago']],
    });
    const withoutCustom = createTimezoneSchemas();

    expect(withCustom.CoercedCanonicalTimezoneSchema.parse('America/Chicago')).toBe(
      'Custom/Chicago',
    );
    expect(
      withoutCustom.CoercedCanonicalTimezoneSchema.parse('America/Chicago'),
    ).toBe('America/Chicago');
  });
});


describe('Edge cases', () => {
  const { CoercedCanonicalTimezoneSchema, CanonicalTimezoneSchema, TimezoneSchema } =
    createTimezoneSchemas();

  test('handles empty string input', () => {
    expect(() => TimezoneSchema.parse('')).toThrow();
    expect(() => CanonicalTimezoneSchema.parse('')).toThrow();
    expect(() => CoercedCanonicalTimezoneSchema.parse('')).toThrow();
  });

  test('handles non-string input', () => {
    expect(() => TimezoneSchema.parse(123)).toThrow();
    expect(() => TimezoneSchema.parse(null)).toThrow();
    expect(() => TimezoneSchema.parse(undefined)).toThrow();
  });

  test('case-insensitive validation for canonical check in IANA mode', () => {
    const { CanonicalTimezoneSchema } = createTimezoneSchemas({
      canonicalMode: 'iana',
    });
    expect(CanonicalTimezoneSchema.parse('america/new_york')).toBe(
      'america/new_york',
    );
  });

  test('no-args createTimezoneSchemas uses iana mode defaults', () => {
    const { CoercedCanonicalTimezoneSchema } = createTimezoneSchemas();
    // Should not throw for valid timezones
    expect(CoercedCanonicalTimezoneSchema.parse('America/New_York')).toBe(
      'America/New_York',
    );
  });
});

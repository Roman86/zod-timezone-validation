import {
  CanonicalTimezoneSchema,
  CoercedCanonicalTimezoneSchema,
  configureTimezoneSchema,
  getCanonicalNamesLowerCase,
  resetConfig,
  TimezoneSchema,
} from './index';

afterEach(() => {
  resetConfig();
});

describe('Runtime (CLDR/ICU) mode', () => {
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
  beforeEach(() => {
    configureTimezoneSchema({ canonicalMode: 'iana' });
  });

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
    configureTimezoneSchema({
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
    configureTimezoneSchema({
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
    configureTimezoneSchema({
      canonicalMode: 'iana',
      customMappings: [['Asia/Calcutta', 'Custom/India']],
    });

    expect(CoercedCanonicalTimezoneSchema.parse('Asia/Calcutta')).toBe(
      'Custom/India',
    );
    // Other IANA mappings should still work
    expect(CoercedCanonicalTimezoneSchema.parse('Europe/Kiev')).toBe(
      'Europe/Kyiv',
    );
  });

  test('custom mappings chain through runtime resolution', () => {
    configureTimezoneSchema({
      customMappings: [['America/Chicago', 'My/Central']],
    });

    // US/Central -> America/Chicago (via runtime) -> My/Central (via custom)
    expect(CoercedCanonicalTimezoneSchema.parse('US/Central')).toBe(
      'My/Central',
    );
  });

  test('custom canonical names are accepted by CanonicalTimezoneSchema', () => {
    configureTimezoneSchema({
      customMappings: [['legacy/zone', 'My/New/Canonical']],
    });

    expect(CanonicalTimezoneSchema.parse('My/New/Canonical')).toBe(
      'My/New/Canonical',
    );
  });

  test('custom mappings coerce to custom canonical names', () => {
    configureTimezoneSchema({
      customMappings: [['legacy/zone', 'My/New/Canonical']],
    });

    expect(CoercedCanonicalTimezoneSchema.parse('Legacy/Zone')).toBe(
      'My/New/Canonical',
    );
  });

  test('clearing custom mappings restores default behavior', () => {
    configureTimezoneSchema({
      customMappings: [['America/Chicago', 'Custom/Chicago']],
    });
    expect(CoercedCanonicalTimezoneSchema.parse('America/Chicago')).toBe(
      'Custom/Chicago',
    );

    resetConfig();
    expect(CoercedCanonicalTimezoneSchema.parse('America/Chicago')).toBe(
      'America/Chicago',
    );
  });

  test('custom mappings validate input — rejects empty strings', () => {
    expect(() =>
      configureTimezoneSchema({ customMappings: [['', 'America/Chicago']] }),
    ).toThrow();
    expect(() =>
      configureTimezoneSchema({ customMappings: [['US/Central', '']] }),
    ).toThrow();
  });
});

describe('Merged canonical names set', () => {
  test('includes IANA canonical names', () => {
    const names = getCanonicalNamesLowerCase();
    expect(names.has('america/new_york')).toBe(true);
    expect(names.has('europe/london')).toBe(true);
    expect(names.has('asia/tokyo')).toBe(true);
  });

  test('does not include non-canonical aliases', () => {
    const names = getCanonicalNamesLowerCase();
    expect(names.has('us/eastern')).toBe(false);
    expect(names.has('gb')).toBe(false);
  });

  test('includes custom canonical names after configure', () => {
    configureTimezoneSchema({
      customMappings: [['legacy/zone', 'My/Custom/Canonical']],
    });

    const names = getCanonicalNamesLowerCase();
    expect(names.has('my/custom/canonical')).toBe(true);
  });

  test('removes custom canonical names after reset', () => {
    configureTimezoneSchema({
      customMappings: [['legacy/zone', 'My/Custom/Canonical']],
    });
    resetConfig();

    const names = getCanonicalNamesLowerCase();
    expect(names.has('my/custom/canonical')).toBe(false);
  });
});

describe('Edge cases', () => {
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
    configureTimezoneSchema({ canonicalMode: 'iana' });

    // Lowercase input of a canonical name should still be accepted
    expect(CanonicalTimezoneSchema.parse('america/new_york')).toBe(
      'america/new_york',
    );
  });

  test('multiple configure calls are additive for mode but replace mappings', () => {
    configureTimezoneSchema({ canonicalMode: 'iana' });
    configureTimezoneSchema({
      customMappings: [['foo/bar', 'Baz/Qux']],
    });

    // Mode should still be iana
    expect(CoercedCanonicalTimezoneSchema.parse('Asia/Calcutta')).toBe(
      'Asia/Kolkata',
    );
    // Custom mapping should work
    expect(CanonicalTimezoneSchema.parse('Baz/Qux')).toBe('Baz/Qux');
  });
});

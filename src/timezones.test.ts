import {
  CanonicalTimezoneSchema,
  CoercedCanonicalTimezoneSchema,
  TimezoneSchema,
} from './index';

describe('timezones test', () => {
  const canonicalTZ = 'America/Chicago';
  const nonCanonicalAlias = 'US/Central';
  const nonCanonicalAliasLowerCase = 'us/central';
  const nonsense = 'nonsense';

  test('non-canonical (flexible)', () => {
    expect(TimezoneSchema.parse(nonCanonicalAlias)).toBe(nonCanonicalAlias);
    expect(TimezoneSchema.parse(nonCanonicalAliasLowerCase)).toBe(
      nonCanonicalAliasLowerCase,
    );
    expect(TimezoneSchema.parse(canonicalTZ)).toBe(canonicalTZ);
    expect(() => TimezoneSchema.parse(nonsense)).toThrow();
  });
  test('convert to canonical', () => {
    expect(
      CoercedCanonicalTimezoneSchema.parse(nonCanonicalAliasLowerCase),
    ).toBe(canonicalTZ);
    expect(CoercedCanonicalTimezoneSchema.parse(nonCanonicalAlias)).toBe(
      canonicalTZ,
    );
    expect(CoercedCanonicalTimezoneSchema.parse(canonicalTZ)).toBe(canonicalTZ);
    expect(() => CoercedCanonicalTimezoneSchema.parse(nonsense)).toThrow();
  });
  test('strictly canonical', () => {
    expect(CanonicalTimezoneSchema.parse(canonicalTZ)).toBe(canonicalTZ);
    expect(() => CanonicalTimezoneSchema.parse(nonCanonicalAlias)).toThrow();
    expect(() =>
      CanonicalTimezoneSchema.parse(nonCanonicalAliasLowerCase),
    ).toThrow();
    expect(() => CanonicalTimezoneSchema.parse(nonsense)).toThrow();
  });
});

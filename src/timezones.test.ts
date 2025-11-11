import {
  zIANACanonicalTimezone,
  zIANAStrictlyCanonicalTimezone,
  zIANATimezone,
} from './index';

describe('timezones test', () => {
  const canonicalTZ = 'America/Chicago';
  const nonCanonicalAlias = 'US/Central';
  const nonCanonicalAliasLowerCase = 'us/central';
  const nonsense = 'nonsense';

  test('non-canonical (flexible)', () => {
    expect(zIANATimezone.parse(nonCanonicalAlias)).toBe(nonCanonicalAlias);
    expect(zIANATimezone.parse(nonCanonicalAliasLowerCase)).toBe(
      nonCanonicalAliasLowerCase,
    );
    expect(zIANATimezone.parse(canonicalTZ)).toBe(canonicalTZ);
    expect(() => zIANATimezone.parse(nonsense)).toThrow();
  });
  test('convert to canonical', () => {
    expect(zIANACanonicalTimezone.parse(nonCanonicalAliasLowerCase)).toBe(
      canonicalTZ,
    );
    expect(zIANACanonicalTimezone.parse(nonCanonicalAlias)).toBe(canonicalTZ);
    expect(zIANACanonicalTimezone.parse(canonicalTZ)).toBe(canonicalTZ);
    expect(() => zIANACanonicalTimezone.parse(nonsense)).toThrow();
  });
  test('strictly canonical', () => {
    expect(zIANAStrictlyCanonicalTimezone.parse(canonicalTZ)).toBe(canonicalTZ);
    expect(() =>
      zIANAStrictlyCanonicalTimezone.parse(nonCanonicalAlias),
    ).toThrow();
    expect(() =>
      zIANAStrictlyCanonicalTimezone.parse(nonCanonicalAliasLowerCase),
    ).toThrow();
    expect(() => zIANAStrictlyCanonicalTimezone.parse(nonsense)).toThrow();
  });
});

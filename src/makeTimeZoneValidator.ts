import { type ZodType, z } from 'zod';
import { primitiveMemo } from './primitiveMemo';

const canonicalTzNamesLowerCaseSet = new Set(
  Intl.supportedValuesOf('timeZone').map((tz) => tz.toLowerCase()),
);

const tzAdapter = primitiveMemo((tz: string, returnCanonical: boolean) => {
  // Accept common legacy aliases that are not in the IANA time zone database
  try {
    // Intl.DateTimeFormat accepts non-canonical, while the supportedValuesOf only returns canonical
    const formatter = Intl.DateTimeFormat(undefined, { timeZone: tz });
    if (returnCanonical) {
      return formatter.resolvedOptions().timeZone;
    }
    return tz;
  } catch (_e) {
    return null;
  }
});

const errorSuffix = 'Refer to the latest IANA time zone database';

export const makeTimeZoneValidator = (
  nonCanonicalStrategy:
    | 'changeToCanonical'
    | 'keepNonCanonical'
    | 'assumeInvalid',
): ZodType<string> => {
  if (nonCanonicalStrategy === 'assumeInvalid') {
    return z
      .string()
      .refine((val) => canonicalTzNamesLowerCaseSet.has(val.toLowerCase()), {
        error: (e) =>
          `Non-canonical time zone name "${String(e.input)}". ${errorSuffix}`,
      });
  } else if (nonCanonicalStrategy === 'changeToCanonical') {
    // assume invalid
    return z.string().transform((v, ctx) => {
      const canonical = tzAdapter(v, true);
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

  // otherwise keepNonCanonical
  return z
    .string()
    .refine(
      (val) =>
        canonicalTzNamesLowerCaseSet.has(val) || tzAdapter(val, true) != null,
      {
        error: (e) =>
          `Invalid time zone name "${String(e.input)}" (refer to IANA time zone database)`,
      },
    );
};

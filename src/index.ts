import type z from 'zod';
import { makeTimeZoneValidator } from './makeTimeZoneValidator';

export const zIANACanonicalTimezone = makeTimeZoneValidator(
  'changeToCanonical',
).brand('IANACanonicalTimezone');
export const zIANAStrictlyCanonicalTimezone = makeTimeZoneValidator(
  'assumeInvalid',
).brand('IANACanonicalTimezone');

export const zIANATimezone =
  makeTimeZoneValidator('keepNonCanonical').brand('IANATimezone');

export type IANACanonicalTimezone = z.infer<typeof zIANACanonicalTimezone>;
export type IANATimezone = z.infer<typeof zIANATimezone>;

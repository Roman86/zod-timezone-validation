import type z from 'zod';
import { makeTimeZoneValidator } from './makeTimeZoneValidator';

export const CoercedCanonicalTimezoneSchema =
  makeTimeZoneValidator('changeToCanonical').brand('CanonicalTimezone');
export const CanonicalTimezoneSchema =
  makeTimeZoneValidator('assumeInvalid').brand('CanonicalTimezone');

export const TimezoneSchema =
  makeTimeZoneValidator('keepNonCanonical').brand('Timezone');

export type CanonicalTimezone = z.infer<typeof CanonicalTimezoneSchema>;
export type Timezone = z.infer<typeof TimezoneSchema>;

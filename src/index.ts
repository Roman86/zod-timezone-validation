import type z from 'zod';
import { makeTimeZoneValidator } from './makeTimeZoneValidator';

export {
  type CanonicalMode,
  type ConfigureOptions,
  configureTimezoneSchema,
  resetConfig,
  type TimezoneMapping,
} from './config';

export {
  getCanonicalNamesLowerCase,
  ianaCanonicalMappingsLowerKeys,
} from './ianaCanonical';

export const CoercedCanonicalTimezoneSchema =
  makeTimeZoneValidator('changeToCanonical').brand('CanonicalTimezone');
export const CanonicalTimezoneSchema =
  makeTimeZoneValidator('assumeInvalid').brand('CanonicalTimezone');

export const TimezoneSchema =
  makeTimeZoneValidator('keepNonCanonical').brand('Timezone');

export type CanonicalTimezone = z.infer<typeof CanonicalTimezoneSchema>;
export type Timezone = z.infer<typeof TimezoneSchema>;

import { findCustomMapping, getConfig, onConfigChange } from './config';

/**
 * Mapping of non-canonical timezone names to their IANA canonical equivalents.
 * Keys are lowercase for case-insensitive lookup.
 *
 * Source: IANA Time Zone Database (https://www.iana.org/time-zones)
 */
export const ianaCanonicalMappingsLowerKeys: ReadonlyMap<string, string> =
  new Map(
    [
      // Asia
      ['Asia/Calcutta', 'Asia/Kolkata'],
      ['Asia/Saigon', 'Asia/Ho_Chi_Minh'],
      ['Asia/Katmandu', 'Asia/Kathmandu'],
      ['Asia/Rangoon', 'Asia/Yangon'],
      ['Asia/Chongqing', 'Asia/Shanghai'],
      ['Asia/Chungking', 'Asia/Shanghai'],
      ['Asia/Harbin', 'Asia/Shanghai'],
      ['Asia/Kashgar', 'Asia/Urumqi'],
      ['Asia/Dacca', 'Asia/Dhaka'],
      ['Asia/Thimbu', 'Asia/Thimphu'],
      ['Asia/Ujung_Pandang', 'Asia/Makassar'],
      ['Asia/Ulan_Bator', 'Asia/Ulaanbaatar'],
      ['Asia/Macao', 'Asia/Macau'],
      ['Asia/Tel_Aviv', 'Asia/Jerusalem'],
      ['Asia/Ashkhabad', 'Asia/Ashgabat'],

      // Europe
      ['Europe/Kiev', 'Europe/Kyiv'],
      ['Europe/Uzhgorod', 'Europe/Kyiv'],
      ['Europe/Zaporozhye', 'Europe/Kyiv'],

      // Atlantic
      ['Atlantic/Faeroe', 'Atlantic/Faroe'],

      // Pacific
      ['Pacific/Ponape', 'Pacific/Pohnpei'],
      ['Pacific/Truk', 'Pacific/Chuuk'],
      ['Pacific/Yap', 'Pacific/Chuuk'],
      ['Pacific/Enderbury', 'Pacific/Kanton'],
      ['Pacific/Johnston', 'Pacific/Honolulu'],

      // America
      ['America/Buenos_Aires', 'America/Argentina/Buenos_Aires'],
      ['America/Catamarca', 'America/Argentina/Catamarca'],
      ['America/Cordoba', 'America/Argentina/Cordoba'],
      ['America/Jujuy', 'America/Argentina/Jujuy'],
      ['America/Mendoza', 'America/Argentina/Mendoza'],
      ['America/Porto_Acre', 'America/Rio_Branco'],
      ['America/Rosario', 'America/Argentina/Cordoba'],
      ['America/Santa_Isabel', 'America/Tijuana'],
      ['America/Virgin', 'America/St_Thomas'],
      ['America/Atka', 'America/Adak'],
      ['America/Ensenada', 'America/Tijuana'],
      ['America/Fort_Wayne', 'America/Indiana/Indianapolis'],
      ['America/Indianapolis', 'America/Indiana/Indianapolis'],
      ['America/Knox_IN', 'America/Indiana/Knox'],
      ['America/Louisville', 'America/Kentucky/Louisville'],
      ['America/Shiprock', 'America/Denver'],
      ['America/Montreal', 'America/Toronto'],
      ['America/Nipigon', 'America/Toronto'],
      ['America/Pangnirtung', 'America/Iqaluit'],
      ['America/Rainy_River', 'America/Winnipeg'],
      ['America/Thunder_Bay', 'America/Toronto'],
      ['America/Yellowknife', 'America/Edmonton'],

      // Africa
      ['Africa/Asmera', 'Africa/Asmara'],
      ['Africa/Timbuktu', 'Africa/Abidjan'],

      // Antarctica
      ['Antarctica/South_Pole', 'Pacific/Auckland'],

      // Legacy abbreviations
      ['US/Alaska', 'America/Anchorage'],
      ['US/Aleutian', 'America/Adak'],
      ['US/Arizona', 'America/Phoenix'],
      ['US/Central', 'America/Chicago'],
      ['US/East-Indiana', 'America/Indiana/Indianapolis'],
      ['US/Eastern', 'America/New_York'],
      ['US/Hawaii', 'Pacific/Honolulu'],
      ['US/Indiana-Starke', 'America/Indiana/Knox'],
      ['US/Michigan', 'America/Detroit'],
      ['US/Mountain', 'America/Denver'],
      ['US/Pacific', 'America/Los_Angeles'],
      ['US/Samoa', 'Pacific/Pago_Pago'],

      // Other common aliases
      ['GB', 'Europe/London'],
      ['GB-Eire', 'Europe/London'],
      ['Eire', 'Europe/Dublin'],
      ['Hongkong', 'Asia/Hong_Kong'],
      ['Iceland', 'Atlantic/Reykjavik'],
      ['Iran', 'Asia/Tehran'],
      ['Israel', 'Asia/Jerusalem'],
      ['Jamaica', 'America/Jamaica'],
      ['Japan', 'Asia/Tokyo'],
      ['Kwajalein', 'Pacific/Kwajalein'],
      ['Libya', 'Africa/Tripoli'],
      ['Poland', 'Europe/Warsaw'],
      ['Portugal', 'Europe/Lisbon'],
      ['Singapore', 'Asia/Singapore'],
      ['Turkey', 'Europe/Istanbul'],
      ['ROC', 'Asia/Taipei'],
      ['ROK', 'Asia/Seoul'],
      ['W-SU', 'Europe/Moscow'],
      ['PRC', 'Asia/Shanghai'],
      ['Egypt', 'Africa/Cairo'],
      ['Cuba', 'America/Havana'],

      // Etc zones (some runtimes handle these inconsistently)
      ['GMT', 'Etc/GMT'],
      ['GMT+0', 'Etc/GMT'],
      ['GMT-0', 'Etc/GMT'],
      ['GMT0', 'Etc/GMT'],
      ['Greenwich', 'Etc/GMT'],
      ['UCT', 'Etc/UTC'],
      ['UTC', 'Etc/UTC'],
      ['Universal', 'Etc/UTC'],
      ['Zulu', 'Etc/UTC'],
    ].map(([key, value]) => [key.toLowerCase(), value] as const),
  );

/**
 * Base IANA canonical names (lowercase) — computed once from static mappings + runtime.
 */
const baseIanaCanonicalNamesLowerCase: ReadonlySet<string> = new Set([
  ...Array.from(new Set(ianaCanonicalMappingsLowerKeys.values())).map((tz) =>
    tz.toLowerCase(),
  ),
  ...Intl.supportedValuesOf('timeZone')
    .filter((tz) => !ianaCanonicalMappingsLowerKeys.has(tz.toLowerCase()))
    .map((tz) => tz.toLowerCase()),
]);

/**
 * Merged set: base IANA canonical names + custom canonical names from config.
 * Rebuilt when config changes.
 */
let canonicalNamesLowerCase: ReadonlySet<string> =
  baseIanaCanonicalNamesLowerCase;

function rebuildCanonicalNames(): void {
  const { customCanonicalNamesLowerCase } = getConfig();
  if (customCanonicalNamesLowerCase.size === 0) {
    canonicalNamesLowerCase = baseIanaCanonicalNamesLowerCase;
    return;
  }
  canonicalNamesLowerCase = new Set([
    ...baseIanaCanonicalNamesLowerCase,
    ...customCanonicalNamesLowerCase,
  ]);
}

onConfigChange(rebuildCanonicalNames);

/**
 * Returns the merged set of canonical timezone names (lowercase).
 * Includes both IANA canonical names and custom canonical names from config.
 */
export function getCanonicalNamesLowerCase(): ReadonlySet<string> {
  return canonicalNamesLowerCase;
}

/**
 * Returns the IANA canonical name for a given timezone, or the input if already canonical.
 * Custom mappings take precedence over built-in mappings.
 */
export function getIanaCanonicalName(timezone: string): string | null {
  const lowerTz = timezone.toLowerCase();

  // Check custom mappings first (highest priority)
  const customMapped = findCustomMapping(timezone);
  if (customMapped) {
    return customMapped;
  }

  // Check if it's a known non-canonical name
  const mapped = ianaCanonicalMappingsLowerKeys.get(lowerTz);
  if (mapped) {
    return mapped;
  }

  // Check if it's already a canonical name
  if (canonicalNamesLowerCase.has(lowerTz)) {
    return timezone;
  }

  // Try to resolve via Intl as a fallback
  try {
    const formatter = Intl.DateTimeFormat(undefined, { timeZone: timezone });
    const resolved = formatter.resolvedOptions().timeZone;
    const customResolvedMapped = findCustomMapping(resolved);
    if (customResolvedMapped) {
      return customResolvedMapped;
    }
    return (
      ianaCanonicalMappingsLowerKeys.get(resolved.toLowerCase()) ?? resolved
    );
  } catch {
    return null;
  }
}

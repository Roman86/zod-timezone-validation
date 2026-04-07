import type { ResolvedConfig } from './config';

const ianaCanonicalEntries: readonly (readonly [string, string])[] = [
  // Asia
  ['asia/calcutta', 'Asia/Kolkata'],
  ['asia/saigon', 'Asia/Ho_Chi_Minh'],
  ['asia/katmandu', 'Asia/Kathmandu'],
  ['asia/rangoon', 'Asia/Yangon'],
  ['asia/chongqing', 'Asia/Shanghai'],
  ['asia/chungking', 'Asia/Shanghai'],
  ['asia/harbin', 'Asia/Shanghai'],
  ['asia/kashgar', 'Asia/Urumqi'],
  ['asia/dacca', 'Asia/Dhaka'],
  ['asia/thimbu', 'Asia/Thimphu'],
  ['asia/ujung_pandang', 'Asia/Makassar'],
  ['asia/ulan_bator', 'Asia/Ulaanbaatar'],
  ['asia/macao', 'Asia/Macau'],
  ['asia/tel_aviv', 'Asia/Jerusalem'],
  ['asia/ashkhabad', 'Asia/Ashgabat'],

  // Europe
  ['europe/kiev', 'Europe/Kyiv'],
  ['europe/uzhgorod', 'Europe/Kyiv'],
  ['europe/zaporozhye', 'Europe/Kyiv'],

  // Atlantic
  ['atlantic/faeroe', 'Atlantic/Faroe'],

  // Pacific
  ['pacific/ponape', 'Pacific/Pohnpei'],
  ['pacific/truk', 'Pacific/Chuuk'],
  ['pacific/yap', 'Pacific/Chuuk'],
  ['pacific/enderbury', 'Pacific/Kanton'],
  ['pacific/johnston', 'Pacific/Honolulu'],

  // America
  ['america/buenos_aires', 'America/Argentina/Buenos_Aires'],
  ['america/catamarca', 'America/Argentina/Catamarca'],
  ['america/cordoba', 'America/Argentina/Cordoba'],
  ['america/jujuy', 'America/Argentina/Jujuy'],
  ['america/mendoza', 'America/Argentina/Mendoza'],
  ['america/porto_acre', 'America/Rio_Branco'],
  ['america/rosario', 'America/Argentina/Cordoba'],
  ['america/santa_isabel', 'America/Tijuana'],
  ['america/virgin', 'America/St_Thomas'],
  ['america/atka', 'America/Adak'],
  ['america/ensenada', 'America/Tijuana'],
  ['america/fort_wayne', 'America/Indiana/Indianapolis'],
  ['america/indianapolis', 'America/Indiana/Indianapolis'],
  ['america/knox_in', 'America/Indiana/Knox'],
  ['america/louisville', 'America/Kentucky/Louisville'],
  ['america/shiprock', 'America/Denver'],
  ['america/montreal', 'America/Toronto'],
  ['america/nipigon', 'America/Toronto'],
  ['america/pangnirtung', 'America/Iqaluit'],
  ['america/rainy_river', 'America/Winnipeg'],
  ['america/thunder_bay', 'America/Toronto'],
  ['america/yellowknife', 'America/Edmonton'],

  // Africa
  ['africa/asmera', 'Africa/Asmara'],
  ['africa/timbuktu', 'Africa/Abidjan'],

  // Antarctica
  ['antarctica/south_pole', 'Pacific/Auckland'],

  // Legacy abbreviations
  ['us/alaska', 'America/Anchorage'],
  ['us/aleutian', 'America/Adak'],
  ['us/arizona', 'America/Phoenix'],
  ['us/central', 'America/Chicago'],
  ['us/east-indiana', 'America/Indiana/Indianapolis'],
  ['us/eastern', 'America/New_York'],
  ['us/hawaii', 'Pacific/Honolulu'],
  ['us/indiana-starke', 'America/Indiana/Knox'],
  ['us/michigan', 'America/Detroit'],
  ['us/mountain', 'America/Denver'],
  ['us/pacific', 'America/Los_Angeles'],
  ['us/samoa', 'Pacific/Pago_Pago'],

  // Other common aliases
  ['gb', 'Europe/London'],
  ['gb-eire', 'Europe/London'],
  ['eire', 'Europe/Dublin'],
  ['hongkong', 'Asia/Hong_Kong'],
  ['iceland', 'Atlantic/Reykjavik'],
  ['iran', 'Asia/Tehran'],
  ['israel', 'Asia/Jerusalem'],
  ['jamaica', 'America/Jamaica'],
  ['japan', 'Asia/Tokyo'],
  ['kwajalein', 'Pacific/Kwajalein'],
  ['libya', 'Africa/Tripoli'],
  ['poland', 'Europe/Warsaw'],
  ['portugal', 'Europe/Lisbon'],
  ['singapore', 'Asia/Singapore'],
  ['turkey', 'Europe/Istanbul'],
  ['roc', 'Asia/Taipei'],
  ['rok', 'Asia/Seoul'],
  ['w-su', 'Europe/Moscow'],
  ['prc', 'Asia/Shanghai'],
  ['egypt', 'Africa/Cairo'],
  ['cuba', 'America/Havana'],

  // Etc zones (some runtimes handle these inconsistently)
  ['gmt', 'Etc/GMT'],
  ['gmt+0', 'Etc/GMT'],
  ['gmt-0', 'Etc/GMT'],
  ['gmt0', 'Etc/GMT'],
  ['greenwich', 'Etc/GMT'],
  ['uct', 'Etc/UTC'],
  ['utc', 'Etc/UTC'],
  ['universal', 'Etc/UTC'],
  ['zulu', 'Etc/UTC'],
];

let _ianaMap: ReadonlyMap<string, string> | null = null;
let _canonicalNamesMap: ReadonlyMap<string, string> | null = null;
let _runtimeSet: ReadonlySet<string> | null = null;

/**
 * Non-canonical → canonical IANA mappings. Keys lowercase.
 * Lazily initialized.
 */
export function getIanaMappings(): ReadonlyMap<string, string> {
  if (!_ianaMap) {
    _ianaMap = new Map(ianaCanonicalEntries);
  }
  return _ianaMap;
}

/**
 * Runtime canonical timezone names (lowercase). Lazily initialized.
 * Single source of truth for `Intl.supportedValuesOf('timeZone')`.
 */
export function getRuntimeCanonicalSet(): ReadonlySet<string> {
  if (!_runtimeSet) {
    _runtimeSet = new Set(
      Intl.supportedValuesOf('timeZone').map((tz) => tz.toLowerCase()),
    );
  }
  return _runtimeSet;
}

/**
 * Map of lowercase canonical name → properly cased canonical name.
 * Merges IANA mapping targets + runtime Intl names. Lazily initialized.
 */
function getBaseCanonicalNamesMap(): ReadonlyMap<string, string> {
  if (!_canonicalNamesMap) {
    const mappings = getIanaMappings();
    const map = new Map<string, string>();

    // IANA mapping targets (proper casing from our static data)
    for (const canonical of new Set(mappings.values())) {
      map.set(canonical.toLowerCase(), canonical);
    }

    // Runtime Intl names (proper casing from Intl, skip those already covered by IANA)
    for (const tz of Intl.supportedValuesOf('timeZone')) {
      const lower = tz.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, tz);
      }
    }

    _canonicalNamesMap = map;
  }
  return _canonicalNamesMap;
}

/**
 * Builds the merged canonical names map for a given config.
 * Returns Map<lowercase, ProperCase>.
 */
export function buildCanonicalNamesMap(
  config: ResolvedConfig,
): ReadonlyMap<string, string> {
  const base = getBaseCanonicalNamesMap();
  if (config.customCanonicalNamesLowerCase.size === 0) {
    return base;
  }
  const merged = new Map(base);
  for (const lowerName of config.customCanonicalNamesLowerCase) {
    if (!merged.has(lowerName)) {
      // Custom canonical names: use the original casing from customMappings values
      const properCase = findCustomCanonicalProperCase(config, lowerName);
      merged.set(lowerName, properCase ?? lowerName);
    }
  }
  return merged;
}

function findCustomCanonicalProperCase(
  config: ResolvedConfig,
  lowerName: string,
): string | undefined {
  for (const value of config.customMappingsLowerKeys.values()) {
    if (value.toLowerCase() === lowerName) {
      return value;
    }
  }
  return undefined;
}

/**
 * Returns the properly-cased IANA canonical name for a given timezone.
 * Custom mappings take precedence over built-in mappings.
 * The lowerTz parameter avoids redundant toLowerCase() calls.
 */
export function getIanaCanonicalName(
  lowerTz: string,
  config: ResolvedConfig,
  canonicalNames: ReadonlyMap<string, string>,
): string | null {
  const mapped = getIanaMappings().get(lowerTz);
  if (mapped) {
    return mapped;
  }

  const properCased = canonicalNames.get(lowerTz);
  if (properCased) {
    return properCased;
  }

  // Fallback: resolve via Intl for unknown timezones
  try {
    const formatter = Intl.DateTimeFormat(undefined, { timeZone: lowerTz });
    const resolved = formatter.resolvedOptions().timeZone;
    const resolvedLower = resolved.toLowerCase();
    const customResolvedMapped = config.customMappingsLowerKeys.get(resolvedLower);
    if (customResolvedMapped) {
      return customResolvedMapped;
    }
    return getIanaMappings().get(resolvedLower) ?? resolved;
  } catch {
    return null;
  }
}

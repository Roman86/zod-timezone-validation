/**
 * Audit script for timezone mappings.
 * Run this in different runtimes (Node.js, browser console) to find redundant entries.
 *
 * Usage:
 *   Node.js: node scripts/audit-mappings.js
 *   Browser: Copy-paste this entire file into browser console
 */

const ianaCanonicalMappings = [
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
];

/**
 * Audits timezone mappings to find entries that are redundant in the current runtime.
 */
function auditIanaMappings(mappings) {
  const runtimeOk = []; // Runtime returns IANA canonical
  const needsOverride = []; // Runtime returns different canonical (old name)
  const passthrough = []; // Runtime returns input unchanged (no canonicalization)
  const invalid = [];

  for (const [nonCanonical, expectedCanonical] of mappings) {
    try {
      const formatter = Intl.DateTimeFormat(undefined, {
        timeZone: nonCanonical,
      });
      const runtimeCanonical = formatter.resolvedOptions().timeZone;

      if (runtimeCanonical === expectedCanonical) {
        // Runtime already returns the correct IANA canonical name
        runtimeOk.push({
          from: nonCanonical,
          to: expectedCanonical,
        });
      } else if (runtimeCanonical === nonCanonical) {
        // Runtime returns the input unchanged (doesn't canonicalize)
        passthrough.push({
          from: nonCanonical,
          to: expectedCanonical,
          runtimeResolvesTo: runtimeCanonical,
        });
      } else {
        // Runtime returns a different canonical name
        needsOverride.push({
          from: nonCanonical,
          to: expectedCanonical,
          runtimeResolvesTo: runtimeCanonical,
        });
      }
    } catch (e) {
      invalid.push({
        from: nonCanonical,
        to: expectedCanonical,
        error: e.message || String(e),
      });
    }
  }

  return { runtimeOk, needsOverride, passthrough, invalid };
}

// Run the audit
const result = auditIanaMappings(ianaCanonicalMappings);

// Detect runtime
const runtime =
  typeof process !== 'undefined' && process.versions?.node
    ? `Node.js ${process.versions.node}`
    : typeof navigator !== 'undefined'
      ? navigator.userAgent.split(' ').pop()
      : 'Unknown';

// Check if we're in a browser (has console.groupCollapsed)
const isBrowser = typeof window !== 'undefined';

console.log(`\n=== Timezone Mappings Audit ===`);
console.log(`Runtime: ${runtime}`);
console.log(`Total mappings: ${ianaCanonicalMappings.length}\n`);

// Runtime OK - runtime already returns the IANA canonical name
if (isBrowser) {
  console.groupCollapsed(
    `%c✓ Runtime OK (${result.runtimeOk.length})%c — runtime already returns IANA canonical`,
    'color: green; font-weight: bold',
    'color: gray',
  );
} else {
  console.log(`--- Runtime OK (${result.runtimeOk.length}) ---`);
  console.log(
    'Runtime already returns IANA canonical (mapping not needed here):',
  );
}
if (result.runtimeOk.length === 0) {
  console.log('  (none)');
} else {
  if (isBrowser) {
    console.table(result.runtimeOk);
  } else {
    result.runtimeOk.forEach((r) => {
      console.log(`  ${r.from} → ${r.to}`);
    });
  }
}
if (isBrowser) console.groupEnd();

// Passthrough - runtime returns input unchanged (doesn't canonicalize at all)
if (isBrowser) {
  console.groupCollapsed(
    `%c⚡ Passthrough (${result.passthrough.length})%c — runtime doesn't canonicalize`,
    'color: blue; font-weight: bold',
    'color: gray',
  );
} else {
  console.log(`\n--- Passthrough (${result.passthrough.length}) ---`);
  console.log('Runtime returns input unchanged (no canonicalization):');
}
if (result.passthrough.length === 0) {
  console.log('  (none)');
} else {
  if (isBrowser) {
    console.table(result.passthrough);
  } else {
    result.passthrough.forEach((r) => {
      console.log(
        `  ${r.from} → ${r.to} (runtime returns: ${r.runtimeResolvesTo})`,
      );
    });
  }
}
if (isBrowser) console.groupEnd();

// Needs override - runtime returns a different (old) canonical name
if (isBrowser) {
  console.groupCollapsed(
    `%c⚠ Different canonical (${result.needsOverride.length})%c — runtime returns different canonical`,
    'color: orange; font-weight: bold',
    'color: gray',
  );
} else {
  console.log(`\n--- Different canonical (${result.needsOverride.length}) ---`);
  console.log('Runtime returns different canonical name (mapping needed):');
}
if (result.needsOverride.length === 0) {
  console.log('  (none)');
} else {
  if (isBrowser) {
    console.table(result.needsOverride);
  } else {
    result.needsOverride.forEach((r) => {
      console.log(
        `  ${r.from} → ${r.to} (runtime returns: ${r.runtimeResolvesTo})`,
      );
    });
  }
}
if (isBrowser) console.groupEnd();

// Invalid entries
if (isBrowser) {
  console.groupCollapsed(
    `%c✗ Invalid (${result.invalid.length})%c — not recognized`,
    'color: red; font-weight: bold',
    'color: gray',
  );
} else {
  console.log(`\n--- Invalid (${result.invalid.length}) ---`);
  console.log('These timezones are not recognized:');
}
if (result.invalid.length === 0) {
  console.log('  (none)');
} else {
  if (isBrowser) {
    console.table(result.invalid);
  } else {
    result.invalid.forEach((r) => {
      console.log(`  ${r.from}: ${r.error}`);
    });
  }
}
if (isBrowser) console.groupEnd();

// Return result for programmatic use
if (typeof module !== 'undefined') {
  module.exports = { auditIanaMappings, ianaCanonicalMappings, result };
}

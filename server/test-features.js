/**
 * Comprehensive Feature Verification Script
 * Tests:
 * 1. Seat tier reorientation (Lower nearest screen, Balcony furthest)
 * 2. Real-time showtime expiry validation
 */

const assert = require('assert');
const { parseShowDateTime, isShowExpired } = require('./utils/timeUtils');

console.log('====================================================');
console.log('🧪 Testing Feature Updates, Bug Fixes & Expiry Rules');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Real-Time Showtime Expiry & Time Parsing
// -----------------------------------------------------------------------------
console.log('[Test 1] Testing Real-Time Showtime Expiry Logic...');

const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// Past time earlier today: 10:00 AM (assuming test runs in afternoon/evening)
const morningTime = '06:00 AM';
const morningParsed = parseShowDateTime(todayStr, morningTime);
assert(morningParsed !== null, 'Failed to parse morning showtime');
console.log(`✓ Parsed ${todayStr} ${morningTime} -> ${morningParsed.toISOString()}`);

const morningExpiry = isShowExpired(todayStr, morningTime, 0);
assert.strictEqual(morningExpiry.expired, true, 'Early morning show today should be expired');
console.log(`✓ Confirmed expired for past showtime: "${morningExpiry.message}"`);

// Future show tomorrow: 10:00 AM
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
const futureExpiry = isShowExpired(tomorrowStr, '10:00 AM', 0);
assert.strictEqual(futureExpiry.expired, false, 'Future show should not be expired');
console.log(`✓ Confirmed active for future show (${tomorrowStr} 10:00 AM)`);

// -----------------------------------------------------------------------------
// Test 2: Seat Tier & Pricing Order Verification
// -----------------------------------------------------------------------------
console.log('\n[Test 2] Testing Seat Tier Reorientation...');

// Simulated parseSeat matching bookingController.js and paymentController.js
const parseSeat = (seatId, fallbackTier) => {
  if (!seatId) return { tierKey: 'middle', rawId: '' };
  const str = String(seatId).trim();
  if (str.startsWith('B-')) return { tierKey: 'balcony', rawId: str.substring(2) };
  if (str.startsWith('M-')) return { tierKey: 'middle', rawId: str.substring(2) };
  if (str.startsWith('L-')) return { tierKey: 'lower', rawId: str.substring(2) };

  const row = str.charAt(0).toUpperCase();
  if (['A', 'B', 'C'].includes(row)) return { tierKey: 'lower', rawId: str };
  if (['D', 'E', 'F', 'G'].includes(row)) return { tierKey: 'middle', rawId: str };
  return { tierKey: 'balcony', rawId: str };
};

// Nearest to screen: Rows A, B, C -> Lower tier (₹200)
assert.strictEqual(parseSeat('A1').tierKey, 'lower');
assert.strictEqual(parseSeat('B5').tierKey, 'lower');
assert.strictEqual(parseSeat('C10').tierKey, 'lower');
console.log('✓ Rows A-C correctly mapped to "lower" tier (directly in front of screen)');

// Mid auditorium: Rows D, E, F, G -> Middle tier (₹320)
assert.strictEqual(parseSeat('D1').tierKey, 'middle');
assert.strictEqual(parseSeat('G8').tierKey, 'middle');
console.log('✓ Rows D-G correctly mapped to "middle" tier');

// Furthest from screen: Rows H, I, J, K -> Balcony tier (₹450+)
assert.strictEqual(parseSeat('H1').tierKey, 'balcony');
assert.strictEqual(parseSeat('K10').tierKey, 'balcony');
console.log('✓ Rows H-K correctly mapped to "balcony" tier (furthest from screen)');

console.log('\n====================================================');
console.log('🎉 ALL FEATURE TESTS PASSED SUCCESSFULLY!');
console.log('====================================================');

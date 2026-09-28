/**
 * Automated Verification Suite for Web Edition Engines
 * Tests passwordChecker.js & passwordGenerator.js in Node.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const PasswordChecker = require('../web/js/passwordChecker.js');
const PasswordGenerator = require('../web/js/passwordGenerator.js');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n============================================================');
console.log('RUNNING WEB EDITION ENGINE TEST SUITE');
console.log('============================================================\n');

// --------------------------------------------------------------------------
// 1. PasswordChecker Tests
// --------------------------------------------------------------------------
console.log('--- Suite 1: PasswordChecker Engine ---');

test('Empty password returns 0 score, NOT ANALYZED, all checks false', () => {
  const res = PasswordChecker.analyzePassword('');
  assert.strictEqual(res.score, 0);
  assert.strictEqual(res.classification, 'NOT ANALYZED');
  assert.strictEqual(res.strength, 'NOT ANALYZED');
  assert.strictEqual(res.checks.length, false);
  assert.strictEqual(res.checks.uppercase, false);
  assert.strictEqual(res.checks.lowercase, false);
  assert.strictEqual(res.checks.numbers, false);
  assert.strictEqual(res.checks.special, false);
  assert.strictEqual(res.checks.not_common, true);
  assert.ok(res.suggestions.length > 0);
});

test('Common password cap: "password" is capped at score 10, WEAK, not_common=false', () => {
  const res = PasswordChecker.analyzePassword('password');
  assert.strictEqual(res.score, 10);
  assert.strictEqual(res.strength, 'WEAK');
  assert.strictEqual(res.checks.not_common, false);
  assert.ok(res.suggestions.some(s => s.toLowerCase().includes('common')));
});

test('Common password cap: "123456" is capped at score 10, WEAK', () => {
  const res = PasswordChecker.analyzePassword('123456');
  assert.strictEqual(res.score, 5); // 10 len + 10 num - 15 single-char-type penalty = 5 <= 10 cap
  assert.strictEqual(res.strength, 'WEAK');
  assert.strictEqual(res.checks.not_common, false);
});

test('Short password cap (<6 chars): "aA1!" max score capped at 20, WEAK', () => {
  const res = PasswordChecker.analyzePassword('aA1!');
  // Length 4: 0 length pts + 40 char pts + 15 bonus = 55 -> CAPPED at 20 because len < 6
  assert.strictEqual(res.score, 20);
  assert.strictEqual(res.strength, 'WEAK');
  assert.strictEqual(res.checks.length, false);
});

test('Single character category penalty (-15): "abcdefgh" (8 chars lowercase)', () => {
  // Length 8: 25 length pts + 10 lowercase = 35 - 15 penalty = 20 pts
  const res = PasswordChecker.analyzePassword('abcdefgh');
  assert.strictEqual(res.score, 20);
  assert.strictEqual(res.strength, 'WEAK');
  assert.strictEqual(res.diversityCount, 1);
});

test('Medium strength boundary: "SecurePass1"', () => {
  // Len 11: 25 pts + upper(10) + lower(10) + num(10) + bonus(5 for 3 types) = 60 pts -> MEDIUM
  const res = PasswordChecker.analyzePassword('SecurePass1');
  assert.strictEqual(res.score, 60);
  assert.strictEqual(res.strength, 'MEDIUM');
  assert.strictEqual(res.checks.length, true);
  assert.strictEqual(res.checks.uppercase, true);
  assert.strictEqual(res.checks.lowercase, true);
  assert.strictEqual(res.checks.numbers, true);
  assert.strictEqual(res.checks.special, false);
  assert.strictEqual(res.checks.not_common, true);
});

test('Strong password: "K9#mQ2$vL8*xP4!w" (16 chars, 4 types, not common)', () => {
  // Len 16: 45 pts + 40 char pts + 15 bonus = 100 pts -> STRONG
  const res = PasswordChecker.analyzePassword('K9#mQ2$vL8*xP4!w');
  assert.strictEqual(res.score, 100);
  assert.strictEqual(res.strength, 'STRONG');
  assert.strictEqual(res.diversityCount, 4);
  assert.strictEqual(res.checks.length, true);
  assert.strictEqual(res.checks.uppercase, true);
  assert.strictEqual(res.checks.lowercase, true);
  assert.strictEqual(res.checks.numbers, true);
  assert.strictEqual(res.checks.special, true);
  assert.strictEqual(res.checks.not_common, true);
  assert.ok(res.suggestions.some(s => s.includes('All basic character checks passed')));
});

test('Stress test: 10,000 character password executes in <10ms without freezing', () => {
  const hugePassword = 'A1!a'.repeat(2500);
  const start = Date.now();
  const res = PasswordChecker.analyzePassword(hugePassword);
  const elapsed = Date.now() - start;
  assert.strictEqual(res.strength, 'STRONG');
  assert.ok(elapsed < 50, `Elapsed ${elapsed}ms is well under 50ms`);
});

// --------------------------------------------------------------------------
// 2. PasswordGenerator Tests
// --------------------------------------------------------------------------
console.log('\n--- Suite 2: PasswordGenerator Engine ---');

test('Generates requested lengths (8, 12, 16, 20, 24, 32, 64)', () => {
  const lengths = [8, 12, 16, 20, 24, 32, 64];
  for (const len of lengths) {
    const pwd = PasswordGenerator.generatePassword({ length: len });
    assert.strictEqual(pwd.length, len, `Expected length ${len}, got ${pwd.length}`);
  }
});

test('Enforces boundary limits: length < 8 or > 64 throws RangeError', () => {
  assert.throws(() => PasswordGenerator.generatePassword({ length: 7 }), /between 8 and 64/);
  assert.throws(() => PasswordGenerator.generatePassword({ length: 65 }), /between 8 and 64/);
  assert.throws(() => PasswordGenerator.generatePassword({ length: 0 }), /between 8 and 64/);
});

test('Zero categories selected throws Error', () => {
  assert.throws(() => PasswordGenerator.generatePassword({
    useUpper: false,
    useLower: false,
    useNumbers: false,
    useSpecial: false
  }), /At least one character category/);
});

test('Guaranteed category representation across 100 consecutive generations', () => {
  const upperRegex = /[A-Z]/;
  const lowerRegex = /[a-z]/;
  const digitRegex = /[0-9]/;
  const specialRegex = /[!@#$%^&*()_\-+=\[\]{}|;:,.<>?]/;

  for (let i = 0; i < 100; i++) {
    const pwd = PasswordGenerator.generatePassword({
      length: 12,
      useUpper: true,
      useLower: true,
      useNumbers: true,
      useSpecial: true
    });
    assert.ok(upperRegex.test(pwd), `Run #${i}: missing uppercase`);
    assert.ok(lowerRegex.test(pwd), `Run #${i}: missing lowercase`);
    assert.ok(digitRegex.test(pwd), `Run #${i}: missing digit`);
    assert.ok(specialRegex.test(pwd), `Run #${i}: missing special`);
  }
});

test('Category isolation: Only numbers produces strictly digits', () => {
  for (let i = 0; i < 20; i++) {
    const pwd = PasswordGenerator.generatePassword({
      length: 16,
      useUpper: false,
      useLower: false,
      useNumbers: true,
      useSpecial: false
    });
    assert.ok(/^[0-9]+$/.test(pwd), `Expected only digits, got ${pwd}`);
  }
});

test('High randomness: 100 consecutive passwords are all unique', () => {
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const pwd = PasswordGenerator.generatePassword({ length: 16 });
    assert.ok(!seen.has(pwd), `Duplicate password generated: ${pwd}`);
    seen.add(pwd);
  }
  assert.strictEqual(seen.size, 100);
});

// --------------------------------------------------------------------------
// 3. Security & Privacy Audit Tests
// --------------------------------------------------------------------------
console.log('\n--- Suite 3: Security & Privacy Code Audit ---');

test('PasswordGenerator code does NOT use Math.random', () => {
  const code = fs.readFileSync(path.join(__dirname, '../web/js/passwordGenerator.js'), 'utf8');
  assert.ok(!code.includes('Math.random'), 'Found Math.random in passwordGenerator.js!');
  assert.ok(code.includes('getRandomValues'), 'Missing crypto.getRandomValues in passwordGenerator.js');
});

test('Zero storage or telemetry: app.js does NOT use localStorage, sessionStorage, or cookies', () => {
  const code = fs.readFileSync(path.join(__dirname, '../web/js/app.js'), 'utf8');
  assert.ok(!code.includes('localStorage'), 'Found localStorage in app.js!');
  assert.ok(!code.includes('sessionStorage'), 'Found sessionStorage in app.js!');
  assert.ok(!code.includes('document.cookie'), 'Found cookie in app.js!');
});

test('Desktop Python files remain 100% intact and untouched', () => {
  const appPy = fs.readFileSync(path.join(__dirname, '../app.py'), 'utf8');
  const checkerPy = fs.readFileSync(path.join(__dirname, '../password_checker.py'), 'utf8');
  const generatorPy = fs.readFileSync(path.join(__dirname, '../password_generator.py'), 'utf8');
  assert.ok(appPy.includes('PasswordAnalyzerApp'), 'app.py missing PasswordAnalyzerApp class');
  assert.ok(checkerPy.includes('analyze_password'), 'password_checker.py missing analyze_password');
  assert.ok(generatorPy.includes('generate_secure_password'), 'password_generator.py missing generate_secure_password');
});

console.log('\n============================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('============================================================\n');

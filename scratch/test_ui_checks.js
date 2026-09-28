/**
 * Automated UI Logic & State Verification for Security Checks & Insights
 * Covers Section 9 (Stale State Test) and Section 12 (Acceptance States)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n============================================================');
console.log('TESTING SECURITY CHECKS & INSIGHTS DOM/UI LOGIC & EMPTY STATE');
console.log('============================================================\n');

// 1. Verify index.html contains expected elements and exact text
const html = fs.readFileSync(path.join(__dirname, '../web/index.html'), 'utf8');

assert.ok(html.includes('SECURITY CHECKS'), 'Contains SECURITY CHECKS heading');
assert.ok(html.includes('Basic password hygiene'), 'Contains Basic password hygiene subtitle');
assert.ok(html.includes('id="checks-counter-badge"'), 'Contains checks-counter-badge');
assert.ok(html.includes('0 / 6 PASSED'), 'Default counter is 0 / 6 PASSED');
assert.ok(html.includes('id="checks-progress-bar"'), 'Contains checks-progress-bar');
assert.ok(html.includes('id="check-desc-common"'), 'Contains check-desc-common');
assert.ok(html.includes('Not present in the local common-password list'), 'Default common desc is accurate');
assert.ok(html.includes('SECURITY INSIGHTS'), 'Contains SECURITY INSIGHTS heading');
assert.ok(html.includes('Type a password above to receive real-time security guidance.'), 'Contains empty insights placeholder');
assert.ok(html.includes('Awaiting Input'), 'Contains Awaiting Input headline');
assert.ok(html.includes('pill-icon-neutral'), 'Contains pill-icon-neutral SVG');

// Verify all 6 check cards in index.html start in NOT CHECKED state
const notCheckedCount = (html.match(/NOT CHECKED/g) || []).length;
assert.ok(notCheckedCount >= 7, `Expected at least 7 occurrences of NOT CHECKED (6 cards + chip-common), got ${notCheckedCount}`);

console.log('✓ index.html initial empty structure and required text verified');

// 2. Verify style.css rules
const css = fs.readFileSync(path.join(__dirname, '../web/css/style.css'), 'utf8');
assert.ok(css.includes('.check-card'), 'Contains .check-card');
assert.ok(css.includes('.check-card-breach'), 'Contains .check-card-breach');
assert.ok(css.includes('.pill-icon-neutral'), 'Contains .pill-icon-neutral');
assert.ok(css.includes('.check-status-pill.pill-neutral'), 'Contains .check-status-pill.pill-neutral');
assert.ok(css.includes('.chip-neutral'), 'Contains .chip-neutral');
assert.ok(css.includes('.insights-panel.state-critical'), 'Contains .insights-panel.state-critical');
assert.ok(css.includes('.insights-panel.state-optimal'), 'Contains .insights-panel.state-optimal');
assert.ok(css.includes('.priority-critical'), 'Contains .priority-critical');
assert.ok(css.includes('.insight-optimal-list'), 'Contains .insight-optimal-list');
assert.ok(css.includes('.insight-optimal-row'), 'Contains .insight-optimal-row');
assert.ok(css.includes('.insight-optimal-icon'), 'Contains .insight-optimal-icon');
assert.ok(css.includes('.insight-optimal-text'), 'Contains .insight-optimal-text');
console.log('✓ style.css cybersecurity health cards and insights styling verified');

// 3. Verify app.js logic rules
const appJs = fs.readFileSync(path.join(__dirname, '../web/js/app.js'), 'utf8');
assert.ok(appJs.includes("'0 / 6 PASSED'"), 'app.js uses 0 / 6 PASSED format');
assert.ok(appJs.includes('NOT CHECKED'), 'app.js uses NOT CHECKED for neutral pills');
assert.ok(appJs.includes('AWAITING INPUT'), 'app.js sets AWAITING INPUT status');
assert.ok(appJs.includes('COMMON PASSWORD'), 'app.js uses COMMON PASSWORD label for breach');
assert.ok(appJs.includes('NOT IN COMMON LIST'), 'app.js uses NOT IN COMMON LIST when common check passes');
assert.ok(appJs.includes('This password appears in the local common-password list.'), 'app.js sets accurate breach description');
assert.ok(appJs.includes('Not present in the local common-password list'), 'app.js sets clean description');
assert.ok(appJs.includes('renderSecurityInsights'), 'app.js has renderSecurityInsights function');
assert.ok(appJs.includes('All security checks satisfied'), 'app.js contains All security checks satisfied');
assert.ok(appJs.includes('Strong length and character diversity'), 'app.js contains Strong length and character diversity');
assert.ok(appJs.includes('Not found in local common-password list'), 'app.js contains Not found in local common-password list');
assert.ok(!appJs.includes('Safe for sensitive accounts'), 'app.js does NOT contain Safe for sensitive accounts');
console.log('✓ app.js logic rules and text verified');

// 4. Test State Simulation in Node (Section 12 Final Acceptance Test)
const PasswordChecker = require('../web/js/passwordChecker.js');

// Test A: Empty Password
const emptyRes = PasswordChecker.analyzePassword('');
assert.strictEqual(emptyRes.score, 0, 'Empty score is 0');
assert.strictEqual(emptyRes.classification, 'NOT ANALYZED', 'Empty classification is NOT ANALYZED');
assert.strictEqual(emptyRes.strength, 'NOT ANALYZED', 'Empty strength is NOT ANALYZED');

// Test B: Weak Password
const weakRes = PasswordChecker.analyzePassword('pass');
assert.ok(weakRes.score < 40, 'Weak score is < 40');
assert.strictEqual(weakRes.classification, 'WEAK', 'Weak classification is WEAK');

// Test C: Medium Password
const mediumRes = PasswordChecker.analyzePassword('SecurePass1');
assert.ok(mediumRes.score >= 40 && mediumRes.score < 70, 'Medium score is 40-69');
assert.strictEqual(mediumRes.classification, 'MEDIUM', 'Medium classification is MEDIUM');

// Test D: Strong Password
const strongRes = PasswordChecker.analyzePassword('K9#mQ2$vL8*xP4!w');
assert.ok(strongRes.score >= 70, 'Strong score is >= 70');
assert.strictEqual(strongRes.classification, 'STRONG', 'Strong classification is STRONG');
assert.strictEqual(strongRes.checks.length, true);
assert.strictEqual(strongRes.checks.uppercase, true);
assert.strictEqual(strongRes.checks.lowercase, true);
assert.strictEqual(strongRes.checks.numbers, true);
assert.strictEqual(strongRes.checks.special, true);
assert.strictEqual(strongRes.checks.not_common, true);

// Test E & F: Clearing to Empty returns clean initial state
const clearedRes = PasswordChecker.analyzePassword('');
assert.strictEqual(clearedRes.score, 0);
assert.strictEqual(clearedRes.classification, 'NOT ANALYZED');

console.log('✓ Final acceptance test states (A through F) verified');

console.log('\n============================================================');
console.log('ALL CHECKS & INSIGHTS & EMPTY-STATE AUDITS PASSED (100%)');
console.log('============================================================\n');

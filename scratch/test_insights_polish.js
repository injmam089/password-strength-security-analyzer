/**
 * Detailed verification of the Security Insights Polish
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '../web/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../web/css/style.css'), 'utf8');
const passwordCheckerJs = fs.readFileSync(path.join(__dirname, '../web/js/passwordChecker.js'), 'utf8');
const passwordGeneratorJs = fs.readFileSync(path.join(__dirname, '../web/js/passwordGenerator.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../web/js/app.js'), 'utf8');

console.log('\n============================================================');
console.log('TESTING SECURITY INSIGHTS REFINEMENT & RESPONSIVENESS');
console.log('============================================================\n');

// 1. Verify CSS specifications
console.log('Test 1: CSS Layout & Spacing Rules');
assert.ok(css.includes('.insight-optimal-list'), 'Contains .insight-optimal-list');
assert.ok(css.includes('.insight-optimal-row'), 'Contains .insight-optimal-row');
assert.ok(css.includes('.insight-optimal-icon'), 'Contains .insight-optimal-icon');
assert.ok(css.includes('.insight-optimal-text'), 'Contains .insight-optimal-text');

// Ensure no absolute positioning in insight-optimal-row or text
const optimalRowRule = css.slice(css.indexOf('.insight-optimal-row'), css.indexOf('.insight-optimal-icon'));
assert.ok(!optimalRowRule.includes('position: absolute'), 'No absolute positioning in insight row');
assert.ok(optimalRowRule.includes('gap: 10px') || optimalRowRule.includes('gap: 8px') || optimalRowRule.includes('gap: 12px'), 'Consistent 8-12px gap in row');
assert.ok(optimalRowRule.includes('line-height: 22px'), 'Line height around 20-24px');

const optimalIconRule = css.slice(css.indexOf('.insight-optimal-icon'), css.indexOf('.insight-optimal-text'));
assert.ok(optimalIconRule.includes('flex-shrink: 0'), 'Icon has flex-shrink: 0 to prevent shrinking/overlapping');
assert.ok(optimalIconRule.includes('color: var(--success-solid)'), 'Icon has emerald success color');

const optimalTextRule = css.slice(css.indexOf('.insight-optimal-text'), css.indexOf('.insight-strong-banner'));
assert.ok(optimalTextRule.includes('overflow-wrap: break-word') || optimalTextRule.includes('word-break'), 'Text has responsive wrapping rules');

console.log('  ✓ Clean flexbox styling without text-colliding absolute positioning verified');

// 2. DOM & Dynamic Content Verification
function createDOM() {
  const elements = {};
  function makeEl(id, tagName = 'div', isSvg = false) {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      attributes: {},
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] || null; },
      textContent: '',
      innerHTML: '',
      value: '',
      type: 'text',
      checked: true,
      style: {},
      listeners: {},
      addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
      },
      dispatchEvent(evt) {
        const t = typeof evt === 'string' ? evt : evt.type;
        if (this.listeners[t]) this.listeners[t].forEach(fn => fn(evt));
      },
      click() {
        if (this.listeners['click']) this.listeners['click'].forEach(fn => fn({ type: 'click' }));
      },
      querySelector(sel) {
        if (sel === '.pill-label') return this._pillLabel || (this._pillLabel = makeEl('', 'span'));
        if (sel === '.icon-eye' || sel === '.icon-eye-off') return makeEl('', 'svg', true);
        return null;
      },
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); el.className = Array.from(this._set).join(' '); },
        remove(c) { this._set.delete(c); el.className = Array.from(this._set).join(' '); },
        contains(c) { return this._set.has(c); }
      },
      focus() {}
    };

    if (isSvg) {
      Object.defineProperty(el, 'className', {
        get() { return this.attributes['class'] || ''; },
        set() { throw new TypeError("Cannot assign to read only property 'className' of SVGElement"); }
      });
    } else {
      el.className = '';
    }

    if (id) elements[id] = el;
    return el;
  }

  const ids = [
    'analyzer-input', 'toggle-analyzer-visibility', 'clear-analyzer-btn',
    'char-counter', 'score-display-box', 'score-number',
    'score-badge', 'score-badge-text', 'score-headline', 'score-summary',
    'chip-length', 'chip-diversity', 'chip-common', 'chip-entropy',
    'checks-counter-badge', 'checks-progress-bar', 'check-desc-common',
    'suggestions-box', 'suggestions-list', 'insights-header-icon',
    'length-slider', 'slider-length-val', 'gen-opt-upper', 'gen-opt-lower',
    'gen-opt-numbers', 'gen-opt-special', 'category-error', 'generate-btn',
    'generated-password-display', 'toggle-gen-visibility', 'copy-btn',
    'copy-btn-text', 'copy-status', 'analyze-generated-btn', 'clear-generated-btn',
    'entropy-estimate', 'check-status-length', 'check-status-upper',
    'check-status-lower', 'check-status-number', 'check-status-special',
    'check-status-common'
  ];
  ids.forEach(id => makeEl(id));
  makeEl('gauge-progress', 'circle', true);

  const checkItemsMap = {
    length: makeEl('check-item-length'),
    upper: makeEl('check-item-upper'),
    lower: makeEl('check-item-lower'),
    number: makeEl('check-item-number'),
    special: makeEl('check-item-special'),
    common: makeEl('check-item-common')
  };

  const doc = {
    getElementById(id) { return elements[id] || makeEl(id); },
    querySelector(sel) {
      const match = sel.match(/\.check-item\[data-check="(\w+)"\]/);
      if (match && checkItemsMap[match[1]]) return checkItemsMap[match[1]];
      return null;
    },
    querySelectorAll() { return []; }
  };

  const win = {
    document: doc,
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    crypto: require('crypto').webcrypto,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    innerWidth: 1200,
    Event: function (type) { this.type = type; },
    console: console
  };
  win.window = win;

  return { win, elements };
}

const { win, elements } = createDOM();
const ctx = vm.createContext(win);
vm.runInContext(passwordCheckerJs, ctx);
vm.runInContext(passwordGeneratorJs, ctx);
vm.runInContext(appJs, ctx);

const input = elements['analyzer-input'];
const suggestionsBox = elements['suggestions-box'];
const suggestionsList = elements['suggestions-list'];

// Test 2: Empty State
console.log('\nTest 2: Empty State Insights');
assert.strictEqual(suggestionsBox.className, 'insights-panel state-empty');
assert.ok(suggestionsList.innerHTML.includes('Type a password above to receive real-time security guidance.'));
console.log('  ✓ Empty state displays placeholder guidance');

// Test 3: Weak Password Insights
console.log('\nTest 3: Weak Password Insights ("weakpass")');
input.value = 'weakpass';
input.dispatchEvent('input');
assert.ok(suggestionsBox.className.includes('state-warning') || suggestionsBox.className.includes('state-critical'));
assert.ok(!suggestionsList.innerHTML.includes('All security checks satisfied'), 'Does not show optimal banner for weak password');
assert.ok(suggestionsList.innerHTML.includes('Incorporate Diverse Character Types') || suggestionsList.innerHTML.includes('Missing'));
console.log('  ✓ Weak password shows actionable recommendations, never "All security checks satisfied"');

// Test 4: Strong Password Insights
console.log('\nTest 4: Strong Password Insights ("Injmam@089HHH")');
input.value = 'Injmam@089HHH';
input.dispatchEvent('input');
assert.strictEqual(suggestionsBox.className, 'insights-panel state-optimal');

const inner = suggestionsList.innerHTML;
assert.ok(inner.includes('All security checks satisfied'), 'Contains Line 1: All security checks satisfied');
assert.ok(inner.includes('Strong length and character diversity'), 'Contains Line 2: Strong length and character diversity');
assert.ok(inner.includes('Not found in local common-password list'), 'Contains Line 3: Not found in local common-password list');
assert.ok(!inner.includes('Safe for sensitive accounts'), 'Does NOT contain "Safe for sensitive accounts"');

// Verify exactly 3 insight-optimal-row items
const rowMatches = (inner.match(/class="insight-optimal-row"/g) || []).length;
assert.strictEqual(rowMatches, 3, `Expected exactly 3 rows in strong state, found ${rowMatches}`);

// Verify exactly 3 SVG icons in the rows
const iconMatches = (inner.match(/class="insight-optimal-icon"/g) || []).length;
assert.strictEqual(iconMatches, 3, `Expected exactly 3 check icons, found ${iconMatches}`);

console.log('  ✓ Strong password renders EXACTLY 3 clean rows with emerald check icons');
console.log('  ✓ "Safe for sensitive accounts" is removed completely');

console.log('\n============================================================');
console.log('ALL SECURITY INSIGHTS POLISH TESTS PASSED (100%)');
console.log('============================================================\n');

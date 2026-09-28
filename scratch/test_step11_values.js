/**
 * Verification of Step 11 test cases and strict mode SVG element behavior
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const passwordCheckerJs = fs.readFileSync(path.join(__dirname, '../web/js/passwordChecker.js'), 'utf8');
const passwordGeneratorJs = fs.readFileSync(path.join(__dirname, '../web/js/passwordGenerator.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../web/js/app.js'), 'utf8');

function createStrictDOM() {
  const elements = {};

  function makeEl(id, tagName = 'div', isSvg = false) {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      className: '',
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); el.className = Array.from(this._set).join(' '); },
        remove(c) { this._set.delete(c); el.className = Array.from(this._set).join(' '); },
        contains(c) { return this._set.has(c); }
      },
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
      focus() {}
    };

    if (isSvg) {
      // In strict mode SVG elements, className is read-only (SVGAnimatedString)
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

  // gauge-progress is an SVG Circle with strict read-only className property!
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

  return { win, elements, checkItemsMap };
}

console.log('\n============================================================');
console.log('TESTING STEP 11 TEST CASES IN STRICT MODE WITH SVG PROTECTION');
console.log('============================================================\n');

const { win, elements, checkItemsMap } = createStrictDOM();
const ctx = vm.createContext(win);
vm.runInContext(passwordCheckerJs, ctx);
vm.runInContext(passwordGeneratorJs, ctx);
vm.runInContext(appJs, ctx);

const input = elements['analyzer-input'];

// Test A: Empty
console.log('Case A: Initial Empty');
assert.strictEqual(elements['char-counter'].textContent, '0 chars');
assert.strictEqual(elements['score-number'].textContent, '0');
assert.strictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '0 / 6 PASSED');
for (const k of Object.keys(checkItemsMap)) {
  assert.strictEqual(checkItemsMap[k].getAttribute('data-status'), 'neutral');
}
console.log('  ✓ Case A passed: 0 chars, 0 / 100, NOT ANALYZED, 0 / 6 PASSED, all checks NOT CHECKED');

// Test B: "a"
console.log('Case B: "a"');
input.value = 'a';
input.dispatchEvent('input');
assert.strictEqual(elements['char-counter'].textContent, '1 char');
assert.strictEqual(elements['score-badge-text'].textContent, 'WEAK');
assert.notStrictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '2 / 6 PASSED'); // lower + not_common
assert.strictEqual(checkItemsMap['lower'].getAttribute('data-status'), 'passed');
assert.strictEqual(checkItemsMap['length'].getAttribute('data-status'), 'failed');
console.log(`  ✓ Case B passed: 1 char, Score ${elements['score-number'].textContent}, WEAK, 2 / 6 PASSED`);

// Test C: "Password123!"
console.log('Case C: "Password123!"');
input.value = 'Password123!';
input.dispatchEvent('input');
assert.strictEqual(elements['char-counter'].textContent, `${'Password123!'.length} chars`);
assert.strictEqual(elements['score-badge-text'].textContent, 'STRONG');
assert.notStrictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '6 / 6 PASSED');
for (const k of Object.keys(checkItemsMap)) {
  assert.strictEqual(checkItemsMap[k].getAttribute('data-status'), 'passed');
}
console.log(`  ✓ Case C passed: ${'Password123!'.length} chars, Score ${elements['score-number'].textContent}, STRONG, 6 / 6 PASSED`);

// Test D: "Injmam@089HHH"
console.log('Case D: "Injmam@089HHH"');
input.value = 'Injmam@089HHH';
input.dispatchEvent('input');
assert.strictEqual(elements['char-counter'].textContent, '13 chars');
assert.strictEqual(String(elements['score-number'].textContent), '90');
assert.strictEqual(elements['score-badge-text'].textContent, 'STRONG');
assert.notStrictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '6 / 6 PASSED');
assert.notStrictEqual(elements['checks-counter-badge'].textContent, '0 / 6 PASSED');
for (const k of Object.keys(checkItemsMap)) {
  assert.strictEqual(checkItemsMap[k].getAttribute('data-status'), 'passed');
  assert.notStrictEqual(checkItemsMap[k].getAttribute('data-status'), 'neutral');
}
console.log(`  ✓ Case D passed: 13 chars, Score 90, STRONG, 6 / 6 PASSED, all checks evaluated and passed`);

// Test E: Clear input
console.log('Case E: Clear input');
elements['clear-analyzer-btn'].click();
assert.strictEqual(input.value, '');
assert.strictEqual(elements['char-counter'].textContent, '0 chars');
assert.strictEqual(elements['score-number'].textContent, '0');
assert.strictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '0 / 6 PASSED');
for (const k of Object.keys(checkItemsMap)) {
  assert.strictEqual(checkItemsMap[k].getAttribute('data-status'), 'neutral');
}
console.log('  ✓ Case E passed: reset to 0 chars, 0 / 100, NOT ANALYZED, 0 / 6 PASSED, all checks NOT CHECKED');

// Test F: Type again
console.log('Case F: Type again ("Secure#99")');
input.value = 'Secure#99';
input.dispatchEvent('input');
assert.strictEqual(elements['char-counter'].textContent, '9 chars');
assert.strictEqual(elements['score-badge-text'].textContent, 'STRONG');
assert.notStrictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '6 / 6 PASSED');
console.log(`  ✓ Case F passed: analysis resumes immediately, 9 chars, STRONG, 6 / 6 PASSED`);

console.log('\n============================================================');
console.log('ALL STEP 11 TEST CASES PASSED WITH 100% RELIABILITY');
console.log('============================================================\n');

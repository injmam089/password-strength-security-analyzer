/**
 * End-to-End State Synchronization Test
 * Verifies that analyzerInput.value is the single source of truth across all user actions
 * Uses zero external npm dependencies.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read files
const html = fs.readFileSync(path.join(__dirname, '../web/index.html'), 'utf8');
const passwordCheckerJs = fs.readFileSync(path.join(__dirname, '../web/js/passwordChecker.js'), 'utf8');
const passwordGeneratorJs = fs.readFileSync(path.join(__dirname, '../web/js/passwordGenerator.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../web/js/app.js'), 'utf8');

function createDOMEnvironment() {
  const elements = {};

  function createElement(id, tagName = 'div', classes = '') {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      className: classes,
      classList: {
        _classes: new Set(classes.split(' ').filter(Boolean)),
        add(c) { this._classes.add(c); el.className = Array.from(this._classes).join(' '); },
        remove(c) { this._classes.delete(c); el.className = Array.from(this._classes).join(' '); },
        contains(c) { return this._classes.has(c); }
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
        const type = typeof evt === 'string' ? evt : evt.type;
        if (this.listeners[type]) {
          this.listeners[type].forEach(fn => fn(evt));
        }
      },
      click() {
        if (this.listeners['click']) {
          this.listeners['click'].forEach(fn => fn({ type: 'click' }));
        }
      },
      querySelector(sel) {
        if (sel === '.pill-label') {
          return this._pillLabel || (this._pillLabel = createElement('', 'span'));
        }
        if (sel === '.icon-eye') {
          return this._iconEye || (this._iconEye = createElement('', 'svg'));
        }
        if (sel === '.icon-eye-off') {
          return this._iconEyeOff || (this._iconEyeOff = createElement('', 'svg'));
        }
        return null;
      },
      focus() {}
    };
    if (id) elements[id] = el;
    return el;
  }

  // Pre-create required elements from index.html
  const ids = [
    'analyzer-input', 'toggle-analyzer-visibility', 'clear-analyzer-btn',
    'char-counter', 'score-display-box', 'gauge-progress', 'score-number',
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

  ids.forEach(id => createElement(id));

  // Check card elements querySelector
  const checkItemsMap = {
    length: createElement('check-item-length'),
    upper: createElement('check-item-upper'),
    lower: createElement('check-item-lower'),
    number: createElement('check-item-number'),
    special: createElement('check-item-special'),
    common: createElement('check-item-common')
  };

  const doc = {
    getElementById(id) {
      return elements[id] || createElement(id);
    },
    querySelector(sel) {
      const match = sel.match(/\.check-item\[data-check="(\w+)"\]/);
      if (match && checkItemsMap[match[1]]) {
        return checkItemsMap[match[1]];
      }
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '.preset-pill') {
        return [8, 12, 16, 20, 24, 32].map(len => {
          const pill = createElement(`preset-${len}`, 'button');
          pill.setAttribute('data-len', len);
          return pill;
        });
      }
      return [];
    }
  };

  const win = {
    document: doc,
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve()
      }
    },
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
console.log('RUNNING DOM STATE SYNCHRONIZATION TEST SUITE');
console.log('============================================================\n');

const { win, elements, checkItemsMap } = createDOMEnvironment();

// Execute scripts inside simulated context
const context = vm.createContext(win);
vm.runInContext(passwordCheckerJs, context);
vm.runInContext(passwordGeneratorJs, context);
vm.runInContext(appJs, context);

// Test 1: True Initial Empty State on page load
console.log('Test 1: Initial Page Load (True Initial Empty State)');
assert.strictEqual(elements['analyzer-input'].value, '', 'Input starts empty');
assert.strictEqual(elements['char-counter'].textContent, '0 chars');
assert.strictEqual(elements['chip-length'].textContent, '0 chars');
assert.strictEqual(elements['score-number'].textContent, '0');
assert.strictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['score-headline'].textContent, 'Awaiting Input');
assert.strictEqual(elements['chip-diversity'].textContent, '0 / 4 Types');
assert.strictEqual(elements['chip-common'].textContent, 'NOT CHECKED');
assert.strictEqual(elements['chip-common'].className, 'chip-value chip-neutral');
assert.strictEqual(elements['checks-counter-badge'].textContent, '0 / 6 PASSED');
assert.strictEqual(elements['checks-progress-bar'].style.width, '0%');
assert.strictEqual(elements['generated-password-display'].value, '', 'Generator field starts empty');
assert.strictEqual(elements['entropy-estimate'].textContent, 'Estimated entropy: —');
for (const key of Object.keys(checkItemsMap)) {
  assert.strictEqual(checkItemsMap[key].getAttribute('data-status'), 'neutral', `Check ${key} must start neutral`);
}
console.log('  ✓ Initial state confirmed: 0 chars, 0 / 100, NOT ANALYZED, 0 / 6 PASSED, all checks NOT CHECKED');

// Test 2: Typing "Password123!"
console.log('\nTest 2: User types "Password123!"');
elements['analyzer-input'].value = 'Password123!';
elements['analyzer-input'].dispatchEvent('input');

assert.strictEqual(elements['char-counter'].textContent, '12 chars');
assert.strictEqual(elements['chip-length'].textContent, '12 chars');
assert.strictEqual(elements['score-badge-text'].textContent, 'STRONG');
assert.strictEqual(elements['chip-diversity'].textContent, '4 / 4 Types');
assert.strictEqual(elements['chip-common'].textContent, 'PASSED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '6 / 6 PASSED');
assert.strictEqual(elements['checks-progress-bar'].style.width, '100%');
for (const key of Object.keys(checkItemsMap)) {
  assert.strictEqual(checkItemsMap[key].getAttribute('data-status'), 'passed', `Check ${key} passed`);
}
console.log(`  ✓ Score: ${elements['score-number'].textContent} / 100, 12 chars, STRONG, 6 / 6 PASSED`);

// Test 3: Clear analyzer input
console.log('\nTest 3: User clicks Clear button');
elements['clear-analyzer-btn'].click();

assert.strictEqual(elements['analyzer-input'].value, '', 'Input cleared');
assert.strictEqual(elements['char-counter'].textContent, '0 chars');
assert.strictEqual(elements['chip-length'].textContent, '0 chars');
assert.strictEqual(elements['score-number'].textContent, '0');
assert.strictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['chip-common'].textContent, 'NOT CHECKED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '0 / 6 PASSED');
assert.strictEqual(elements['checks-progress-bar'].style.width, '0%');
for (const key of Object.keys(checkItemsMap)) {
  assert.strictEqual(checkItemsMap[key].getAttribute('data-status'), 'neutral', `Check ${key} returned to neutral`);
}
console.log('  ✓ Fully reset: 0 chars, 0 / 100, NOT ANALYZED, 0 / 6 PASSED, all checks NOT CHECKED');

// Test 4: Typing weak common password "123456"
console.log('\nTest 4: User types common password "123456"');
elements['analyzer-input'].value = '123456';
elements['analyzer-input'].dispatchEvent('input');

assert.strictEqual(elements['char-counter'].textContent, '6 chars');
assert.strictEqual(elements['score-badge-text'].textContent, 'WEAK');
assert.strictEqual(elements['chip-common'].textContent, 'WARNING');
assert.strictEqual(elements['checks-counter-badge'].textContent, '1 / 6 PASSED');
assert.strictEqual(checkItemsMap['common'].getAttribute('data-status'), 'failed');
console.log(`  ✓ Common password flagged: Score ${elements['score-number'].textContent}, WEAK, WARNING, 1 / 6 PASSED`);

// Test 5: Backspace each character until empty
console.log('\nTest 5: User backspaces to empty');
elements['analyzer-input'].value = '';
elements['analyzer-input'].dispatchEvent('input');

assert.strictEqual(elements['char-counter'].textContent, '0 chars');
assert.strictEqual(elements['score-number'].textContent, '0');
assert.strictEqual(elements['score-badge-text'].textContent, 'NOT ANALYZED');
assert.strictEqual(elements['chip-common'].textContent, 'NOT CHECKED');
assert.strictEqual(elements['checks-counter-badge'].textContent, '0 / 6 PASSED');
console.log('  ✓ Reset on empty keystroke verified');

// Test 6: Generator workflow
console.log('\nTest 6: Generator interaction and clear cycle');
assert.strictEqual(elements['generated-password-display'].value, '');
assert.strictEqual(elements['entropy-estimate'].textContent, 'Estimated entropy: —');

// User clicks Generate button
elements['generate-btn'].click();
assert.ok(elements['generated-password-display'].value.length >= 8, 'Generated password present');
assert.ok(elements['entropy-estimate'].textContent.startsWith('Estimated entropy: ~'), 'Entropy displayed');
console.log(`  ✓ Generated password: "${elements['generated-password-display'].value}", ${elements['entropy-estimate'].textContent}`);

// User clears generator
elements['clear-generated-btn'].click();
assert.strictEqual(elements['generated-password-display'].value, '', 'Generated password cleared');
assert.strictEqual(elements['entropy-estimate'].textContent, 'Estimated entropy: —', 'Entropy reset');
console.log('  ✓ Generator cleared cleanly back to empty state');

console.log('\n============================================================');
console.log('ALL WORKFLOW & STATE SYNCHRONIZATION TESTS PASSED (100%)');
console.log('============================================================\n');

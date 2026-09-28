const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '../web/index.html'), 'utf8');
const passwordCheckerJs = fs.readFileSync(path.join(__dirname, '../web/js/passwordChecker.js'), 'utf8');
const passwordGeneratorJs = fs.readFileSync(path.join(__dirname, '../web/js/passwordGenerator.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../web/js/app.js'), 'utf8');

// Minimal mock DOM
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
      return null;
    },
    querySelectorAll() { return []; },
    focus() {}
  };
  if (id) elements[id] = el;
  return el;
}

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

const context = vm.createContext(win);
vm.runInContext(passwordCheckerJs, context);
vm.runInContext(passwordGeneratorJs, context);
vm.runInContext(appJs, context);

console.log('--- Initial Load ---');
console.log('charCounter:', elements['char-counter'].textContent);
console.log('scoreNumber:', elements['score-number'].textContent);
console.log('scoreBadgeText:', elements['score-badge-text'].textContent);
console.log('checksCounterBadge:', elements['checks-counter-badge'].textContent);

console.log('\n--- Typing "Injmam@089HHH" ---');
elements['analyzer-input'].value = 'Injmam@089HHH';
elements['analyzer-input'].dispatchEvent('input');

console.log('charCounter:', elements['char-counter'].textContent);
console.log('scoreNumber:', elements['score-number'].textContent);
console.log('scoreBadgeText:', elements['score-badge-text'].textContent);
console.log('checksCounterBadge:', elements['checks-counter-badge'].textContent);
for (const key of Object.keys(checkItemsMap)) {
  console.log(`checkItem[${key}] data-status:`, checkItemsMap[key].getAttribute('data-status'));
}

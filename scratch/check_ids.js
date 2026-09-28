const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../web/index.html'), 'utf8');
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

let missing = 0;
ids.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    console.log('MISSING ID IN HTML:', id);
    missing++;
  }
});
if (missing === 0) {
  console.log('ALL IDs FOUND IN HTML!');
}

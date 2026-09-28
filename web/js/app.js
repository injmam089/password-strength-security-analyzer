/**
 * Password Strength & Security Analyzer — Web Edition
 * Main Application Orchestrator & UI Controller
 * 100% Client-Side, Zero-Knowledge Architecture
 */

(function () {
  'use strict';

  // --- DOM Element References ---
  // Analyzer Elements
  const analyzerInput = document.getElementById('analyzer-input');
  const toggleAnalyzerVisibilityBtn = document.getElementById('toggle-analyzer-visibility');
  const clearAnalyzerBtn = document.getElementById('clear-analyzer-btn');
  const charCounter = document.getElementById('char-counter');
  const scoreDisplayBox = document.getElementById('score-display-box');
  const gaugeProgress = document.getElementById('gauge-progress');
  const scoreNumber = document.getElementById('score-number');
  const scoreBadge = document.getElementById('score-badge');
  const scoreBadgeIcon = document.getElementById('score-badge-icon');
  const scoreBadgeText = document.getElementById('score-badge-text');
  const scoreHeadline = document.getElementById('score-headline');
  const scoreSummary = document.getElementById('score-summary');
  const chipLength = document.getElementById('chip-length');
  const chipDiversity = document.getElementById('chip-diversity');
  const chipCommon = document.getElementById('chip-common');
  const chipEntropy = document.getElementById('chip-entropy');
  const checksCounterBadge = document.getElementById('checks-counter-badge');
  const checksProgressBar = document.getElementById('checks-progress-bar');
  const checkDescCommon = document.getElementById('check-desc-common');
  const suggestionsBox = document.getElementById('suggestions-box');
  const suggestionsList = document.getElementById('suggestions-list');
  const insightsHeaderIcon = document.getElementById('insights-header-icon');

  // Generator Elements
  const lengthSlider = document.getElementById('length-slider');
  const sliderLengthVal = document.getElementById('slider-length-val');
  const presetPills = document.querySelectorAll('.preset-pill');
  const optUpper = document.getElementById('gen-opt-upper');
  const optLower = document.getElementById('gen-opt-lower');
  const optNumbers = document.getElementById('gen-opt-numbers');
  const optSpecial = document.getElementById('gen-opt-special');
  const categoryError = document.getElementById('category-error');
  const generateBtn = document.getElementById('generate-btn');
  const generatedDisplay = document.getElementById('generated-password-display');
  const toggleGenVisibilityBtn = document.getElementById('toggle-gen-visibility');
  const copyBtn = document.getElementById('copy-btn');
  const copyBtnText = document.getElementById('copy-btn-text');
  const copyStatus = document.getElementById('copy-status');
  const analyzeGeneratedBtn = document.getElementById('analyze-generated-btn');
  const clearGeneratedBtn = document.getElementById('clear-generated-btn');
  const entropyEstimate = document.getElementById('entropy-estimate');

  // Check Item Elements
  const checkItems = {
    length: document.querySelector('.check-item[data-check="length"]'),
    upper: document.querySelector('.check-item[data-check="upper"]'),
    lower: document.querySelector('.check-item[data-check="lower"]'),
    number: document.querySelector('.check-item[data-check="number"]'),
    special: document.querySelector('.check-item[data-check="special"]'),
    common: document.querySelector('.check-item[data-check="common"]')
  };

  const checkStatusTags = {
    length: document.getElementById('check-status-length'),
    upper: document.getElementById('check-status-upper'),
    lower: document.getElementById('check-status-lower'),
    number: document.getElementById('check-status-number'),
    special: document.getElementById('check-status-special'),
    common: document.getElementById('check-status-common')
  };

  // SVG Gauge constant: 2 * PI * 56 ~= 351.86
  const GAUGE_CIRCUMFERENCE = 351.86;
  let copyTimeoutId = null;
  function updateCheckCard(key, isPassed, isBreach = false, isNeutral = false) {
    const card = checkItems[key];
    const pill = checkStatusTags[key];
    if (!card || !pill) return;

    const pillLabel = pill.querySelector('.pill-label');

    if (isNeutral) {
      card.setAttribute('data-status', 'neutral');
      card.classList.remove('check-card-breach');
      pill.className = 'check-status-pill pill-neutral';
      if (pillLabel) pillLabel.textContent = 'NOT CHECKED';
      if (key === 'common' && checkDescCommon) {
        checkDescCommon.textContent = 'Not present in the local common-password list';
      }
      return;
    }

    if (key === 'common' && isBreach) {
      card.setAttribute('data-status', 'failed');
      card.classList.add('check-card-breach');
      pill.className = 'check-status-pill pill-fail';
      if (pillLabel) pillLabel.textContent = 'COMMON PASSWORD';
      if (checkDescCommon) {
        checkDescCommon.textContent = 'This password appears in the local common-password list.';
      }
      return;
    }

    if (key === 'common') {
      card.classList.remove('check-card-breach');
      card.setAttribute('data-status', isPassed ? 'passed' : 'failed');
      pill.className = isPassed ? 'check-status-pill pill-pass' : 'check-status-pill pill-fail';
      if (pillLabel) pillLabel.textContent = isPassed ? 'NOT IN COMMON LIST' : 'FAIL';
      if (checkDescCommon) {
        checkDescCommon.textContent = 'Not present in the local common-password list';
      }
      return;
    }

    if (isPassed) {
      card.setAttribute('data-status', 'passed');
      pill.className = 'check-status-pill pill-pass';
      if (pillLabel) pillLabel.textContent = 'PASS';
    } else {
      card.setAttribute('data-status', 'failed');
      pill.className = 'check-status-pill pill-fail';
      if (pillLabel) pillLabel.textContent = 'FAIL';
    }
  }

  function renderSecurityInsights(analysis, password, passedCount) {
    // Strong password positive state: all 6 checks passed AND score >= 70
    const isOptimal = passedCount === 6 && analysis.score >= 70;

    if (isOptimal) {
      suggestionsBox.className = 'insights-panel state-optimal';
      if (insightsHeaderIcon) {
        insightsHeaderIcon.innerHTML = `
          <svg class="insights-heading-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        `;
      }
      suggestionsList.innerHTML = `
        <div class="insight-optimal-list">
          <div class="insight-optimal-row">
            <svg class="insight-optimal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="insight-optimal-text">All security checks satisfied</span>
          </div>
          <div class="insight-optimal-row">
            <svg class="insight-optimal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="insight-optimal-text">Strong length and character diversity</span>
          </div>
          <div class="insight-optimal-row">
            <svg class="insight-optimal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="insight-optimal-text">Not found in local common-password list</span>
          </div>
        </div>
      `;
      return;
    }

    // Build prioritized insights
    const items = [];

    // 1. Critical: Common password warning
    if (analysis.is_common || !analysis.checks.not_common) {
      items.push({
        priority: 'critical',
        badge: `
          <svg class="insight-item-svg icon-critical" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        `,
        headline: 'Compromised / Common Password',
        desc: 'This password appears in the local common-password list. Choose a unique passphrase or randomly generated credential immediately.'
      });
    }

    // 2. High: Very short password (< 8 chars)
    if (password.length < 8) {
      items.push({
        priority: 'high',
        badge: `
          <svg class="insight-item-svg icon-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="16 12 12 8 8 12"></polyline>
            <line x1="12" y1="16" x2="12" y2="8"></line>
          </svg>
        `,
        headline: 'Increase Length to 8+ Characters',
        desc: `Current length is ${password.length} character${password.length === 1 ? '' : 's'}. Passwords with fewer than 8 characters are vulnerable to instant cracking.`
      });
    }

    // 3. Action: Missing character categories (combine or list clearly)
    const missingTypes = [];
    if (!analysis.checks.uppercase) missingTypes.push('uppercase letters (A–Z)');
    if (!analysis.checks.lowercase) missingTypes.push('lowercase letters (a–z)');
    if (!analysis.checks.numbers) missingTypes.push('numeric digits (0–9)');
    if (!analysis.checks.special) missingTypes.push('special symbols (!@#$%)');

    if (missingTypes.length > 0) {
      let missingPhrase = '';
      if (missingTypes.length === 1) {
        missingPhrase = missingTypes[0];
      } else if (missingTypes.length === 2) {
        missingPhrase = `${missingTypes[0]} and ${missingTypes[1]}`;
      } else {
        missingPhrase = `${missingTypes.slice(0, -1).join(', ')}, and ${missingTypes[missingTypes.length - 1]}`;
      }
      items.push({
        priority: 'action',
        badge: `
          <svg class="insight-item-svg icon-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="16 12 12 8 8 12"></polyline>
            <line x1="12" y1="16" x2="12" y2="8"></line>
          </svg>
        `,
        headline: 'Incorporate Diverse Character Types',
        desc: `Add ${missingPhrase} to expand character pool entropy and prevent dictionary attacks.`
      });
    }

    // 4. Tip: Expand to 12+ characters for stronger defense
    if (password.length >= 8 && password.length < 12) {
      items.push({
        priority: 'tip',
        badge: `
          <svg class="insight-item-svg icon-tip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
            <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path>
          </svg>
        `,
        headline: 'Expand to 12+ Characters',
        desc: 'Length is the single most critical factor in entropy. Aim for 12 to 16+ characters for maximum resistance.'
      });
    }

    // Fallback if no specific condition triggered but not fully optimal
    if (items.length === 0) {
      items.push({
        priority: 'tip',
        badge: `
          <svg class="insight-item-svg icon-tip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
            <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path>
          </svg>
        `,
        headline: 'Strengthen Credential Uniqueness',
        desc: 'Consider increasing password length or avoiding predictable sequences to reach optimal security.'
      });
    }

    // Determine panel styling state
    if (analysis.is_common || !analysis.checks.not_common) {
      suggestionsBox.className = 'insights-panel state-critical';
      if (insightsHeaderIcon) {
        insightsHeaderIcon.innerHTML = `
          <svg class="insights-heading-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        `;
      }
    } else {
      suggestionsBox.className = 'insights-panel state-warning';
      if (insightsHeaderIcon) {
        insightsHeaderIcon.innerHTML = `
          <svg class="insights-heading-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        `;
      }
    }

    // Render items
    suggestionsList.innerHTML = items.map(function (item) {
      const safeHeadline = item.headline.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeDesc = item.desc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <div class="insight-item priority-${item.priority}">
          <span class="insight-badge-icon" aria-hidden="true">${item.badge}</span>
          <div class="insight-text-group">
            <span class="insight-headline">${safeHeadline}</span>
            <span class="insight-desc">${safeDesc}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================================
  // Password Analyzer Logic (Unified Single Source of Truth)
  // ==========================================================================

  // ==========================================================================
  // Password Analyzer Data Flow (Input -> Analyze -> Render)
  // ==========================================================================

  function renderAnalyzer(result) {
    // 1. True Empty State: when no result or input length is 0
    if (!result || result.isEmpty || result.length === 0) {
      charCounter.textContent = '0 chars';
      chipLength.textContent = '0 chars';
      scoreNumber.textContent = '0';
      scoreNumber.className = 'score-value state-empty';
      gaugeProgress.style.strokeDashoffset = GAUGE_CIRCUMFERENCE;
      gaugeProgress.setAttribute('class', 'gauge-progress state-empty');
      if (scoreDisplayBox) {
        scoreDisplayBox.className = 'score-display-box score-state-empty';
      }

      scoreBadge.className = 'badge badge-neutral';
      if (scoreBadgeIcon) {
        scoreBadgeIcon.innerHTML = `
          <svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5"></circle>
          </svg>
        `;
      }
      if (scoreBadgeText) {
        scoreBadgeText.textContent = 'NOT ANALYZED';
      } else {
        scoreBadge.textContent = 'NOT ANALYZED';
      }
      scoreBadge.setAttribute('data-classification', 'NOT ANALYZED');
      scoreBadge.setAttribute('data-status', 'AWAITING INPUT');
      scoreHeadline.textContent = 'Awaiting Input';
      scoreSummary.textContent = 'Enter a password to inspect security';

      chipDiversity.textContent = '0 / 4 Types';
      chipCommon.textContent = 'NOT CHECKED';
      chipCommon.className = 'chip-value chip-neutral';
      chipEntropy.textContent = 'Minimal';

      checksCounterBadge.textContent = '0 / 6 PASSED';
      checksProgressBar.style.width = '0%';
      checksProgressBar.style.backgroundColor = '#CBD5E1';

      for (const key of Object.keys(checkItems)) {
        updateCheckCard(key, false, false, true);
      }

      suggestionsBox.className = 'insights-panel state-empty';
      if (insightsHeaderIcon) {
        insightsHeaderIcon.innerHTML = `
          <svg class="insights-heading-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        `;
      }
      suggestionsList.innerHTML = '<p class="insights-placeholder">Type a password above to receive real-time security guidance.</p>';
      return;
    }

    // 2. Active Analyzed State: strictly derived from result
    const len = result.length;
    charCounter.textContent = `${len} char${len === 1 ? '' : 's'}`;
    chipLength.textContent = `${len} char${len === 1 ? '' : 's'}`;

    const score = result.score;
    const classification = result.classification || result.strength;

    scoreNumber.textContent = score;
    const offset = GAUGE_CIRCUMFERENCE * (1 - score / 100);
    gaugeProgress.style.strokeDashoffset = Math.max(0, offset);

    let boxClass = 'score-display-box ';
    let gaugeClass = 'gauge-progress ';
    let badgeClass = 'badge ';
    let scoreNumClass = 'score-value ';

    if (classification === 'STRONG') {
      boxClass += 'score-state-strong';
      gaugeClass += 'state-strong';
      badgeClass += 'badge-strong';
      scoreNumClass += 'state-strong';
      scoreHeadline.textContent = 'High Security Standard';
      scoreSummary.textContent = 'Resilient against rapid dictionary matching and automated brute-force attacks.';
      if (scoreBadgeIcon) {
        scoreBadgeIcon.innerHTML = `
          <svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 12 11 14 15 10"></polyline>
          </svg>
        `;
      }
    } else if (classification === 'MEDIUM') {
      boxClass += 'score-state-medium';
      gaugeClass += 'state-medium';
      badgeClass += 'badge-medium';
      scoreNumClass += 'state-medium';
      scoreHeadline.textContent = 'Moderate Security';
      scoreSummary.textContent = 'Acceptable baseline, but consider applying the hardening guidance below.';
      if (scoreBadgeIcon) {
        scoreBadgeIcon.innerHTML = `
          <svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        `;
      }
    } else {
      boxClass += 'score-state-weak';
      gaugeClass += 'state-weak';
      badgeClass += 'badge-weak';
      scoreNumClass += 'state-weak';
      scoreHeadline.textContent = 'Critical Security Weakness';
      scoreSummary.textContent = 'Vulnerable to rapid cracking or dictionary lookup. Hardening required.';
      if (scoreBadgeIcon) {
        scoreBadgeIcon.innerHTML = `
          <svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        `;
      }
    }

    if (scoreDisplayBox) {
      scoreDisplayBox.className = boxClass;
    }
    gaugeProgress.setAttribute('class', gaugeClass);
    scoreNumber.className = scoreNumClass;
    scoreBadge.className = badgeClass;
    if (scoreBadgeText) {
      scoreBadgeText.textContent = classification;
    } else {
      scoreBadge.textContent = classification;
    }
    scoreBadge.setAttribute('data-classification', classification);
    scoreBadge.setAttribute('data-status', classification);

    chipDiversity.textContent = `${result.diversityCount} / 4 Types`;

    if (result.checks.not_common) {
      chipCommon.textContent = 'PASSED';
      chipCommon.className = 'chip-value chip-clean';
    } else {
      chipCommon.textContent = 'WARNING';
      chipCommon.className = 'chip-value chip-breached';
    }

    if (score >= 85) {
      chipEntropy.textContent = 'Very High';
    } else if (score >= 70) {
      chipEntropy.textContent = 'High';
    } else if (score >= 45) {
      chipEntropy.textContent = 'Moderate';
    } else if (score >= 20) {
      chipEntropy.textContent = 'Low';
    } else {
      chipEntropy.textContent = 'Minimal';
    }

    // Update all 6 check cards
    updateCheckCard('length', result.checks.length);
    updateCheckCard('upper', result.checks.uppercase);
    updateCheckCard('lower', result.checks.lowercase);
    updateCheckCard('number', result.checks.numbers);
    updateCheckCard('special', result.checks.special);
    updateCheckCard('common', result.checks.not_common, !result.checks.not_common);

    // Calculate passed count dynamically from the 6 checks
    const checkResults = [
      result.checks.length,
      result.checks.uppercase,
      result.checks.lowercase,
      result.checks.numbers,
      result.checks.special,
      result.checks.not_common
    ];
    const passedCount = checkResults.filter(Boolean).length;
    checksCounterBadge.textContent = `${passedCount} / 6 PASSED`;

    const pct = Math.round((passedCount / 6) * 100);
    checksProgressBar.style.width = `${pct}%`;
    if (passedCount <= 2) {
      checksProgressBar.style.backgroundColor = 'var(--danger-solid)';
    } else if (passedCount <= 4) {
      checksProgressBar.style.backgroundColor = 'var(--warning-solid)';
    } else {
      checksProgressBar.style.backgroundColor = 'var(--success-solid)';
    }

    const currentPassword = analyzerInput ? analyzerInput.value : '';
    renderSecurityInsights(result, currentPassword, passedCount);
  }

  function handleAnalyzerInput() {
    const password = analyzerInput ? analyzerInput.value : '';
    const result = window.PasswordChecker.analyzePassword(password);
    renderAnalyzer(result);
  }

  // Compatibility wrappers
  function updateAnalyzer(result) {
    if (result) {
      renderAnalyzer(result);
    } else {
      handleAnalyzerInput();
    }
  }

  function runAnalyzer() {
    handleAnalyzerInput();
  }

  function renderEmptyAnalyzer() {
    if (analyzerInput) analyzerInput.value = '';
    handleAnalyzerInput();
  }

  // ==========================================================================
  // Password Generator Logic
  // ==========================================================================

  function calculateEntropyEstimate(length, useUpper, useLower, useNumbers, useSpecial) {
    let poolSize = 0;
    if (useUpper) poolSize += 26;
    if (useLower) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSpecial) poolSize += 32;

    if (poolSize === 0 || length <= 0) return 0;
    return Math.round(length * (Math.log(poolSize) / Math.LN2));
  }

  function getGeneratorOptions() {
    return {
      length: parseInt(lengthSlider.value, 10) || 16,
      useUpper: optUpper.checked,
      useLower: optLower.checked,
      useNumbers: optNumbers.checked,
      useSpecial: optSpecial.checked
    };
  }

  function validateCategories() {
    const opts = getGeneratorOptions();
    const hasCategory = opts.useUpper || opts.useLower || opts.useNumbers || opts.useSpecial;
    if (!hasCategory) {
      categoryError.classList.remove('hidden');
      generateBtn.disabled = true;
      generateBtn.style.opacity = '0.6';
      generateBtn.style.cursor = 'not-allowed';
      return false;
    } else {
      categoryError.classList.add('hidden');
      generateBtn.disabled = false;
      generateBtn.style.opacity = '1';
      generateBtn.style.cursor = 'pointer';
      return true;
    }
  }

  function runGenerator() {
    if (!validateCategories()) return;

    const opts = getGeneratorOptions();
    try {
      const password = window.PasswordGenerator.generatePassword(opts);
      generatedDisplay.value = password;

      // Update Entropy Display
      const bits = calculateEntropyEstimate(
        opts.length,
        opts.useUpper,
        opts.useLower,
        opts.useNumbers,
        opts.useSpecial
      );
      entropyEstimate.textContent = `Estimated entropy: ~${bits} bits`;
    } catch (err) {
      console.error('Password generation failed:', err);
      generatedDisplay.value = '';
      entropyEstimate.textContent = 'Estimated entropy: —';
    }
  }

  function syncPresetPills(lengthVal) {
    presetPills.forEach(function (pill) {
      const pillLen = parseInt(pill.getAttribute('data-len'), 10);
      if (pillLen === lengthVal) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // Event Listeners & Interactions
  // ==========================================================================

  // 1. Analyzer Input Live Typing & Mutation Events
  ['input', 'keyup', 'change', 'cut', 'paste', 'search'].forEach(function (evt) {
    analyzerInput.addEventListener(evt, function () {
      if (evt === 'cut' || evt === 'paste') {
        setTimeout(updateAnalyzer, 0);
      } else {
        updateAnalyzer();
      }
    });
  });

  // 2. Toggle Analyzer Visibility
  toggleAnalyzerVisibilityBtn.addEventListener('click', function () {
    const isPassword = analyzerInput.type === 'password';
    analyzerInput.type = isPassword ? 'text' : 'password';
    
    const eyeIcon = toggleAnalyzerVisibilityBtn.querySelector('.icon-eye');
    const eyeOffIcon = toggleAnalyzerVisibilityBtn.querySelector('.icon-eye-off');
    
    if (isPassword) {
      eyeIcon.classList.add('hidden');
      eyeOffIcon.classList.remove('hidden');
      toggleAnalyzerVisibilityBtn.setAttribute('aria-label', 'Hide password');
      toggleAnalyzerVisibilityBtn.setAttribute('aria-pressed', 'true');
    } else {
      eyeIcon.classList.remove('hidden');
      eyeOffIcon.classList.add('hidden');
      toggleAnalyzerVisibilityBtn.setAttribute('aria-label', 'Show password');
      toggleAnalyzerVisibilityBtn.setAttribute('aria-pressed', 'false');
    }
    updateAnalyzer();
  });

  // 3. Clear Analyzer Input (Immediate Reset)
  clearAnalyzerBtn.addEventListener('click', function () {
    analyzerInput.value = '';
    updateAnalyzer();
    analyzerInput.focus();
  });

  // 4. Generator Length Slider
  lengthSlider.addEventListener('input', function () {
    const val = parseInt(lengthSlider.value, 10);
    sliderLengthVal.textContent = `${val} characters`;
    syncPresetPills(val);
    if (generatedDisplay.value) {
      runGenerator();
    }
  });

  // 5. Preset Pills Click
  presetPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      const len = parseInt(pill.getAttribute('data-len'), 10);
      lengthSlider.value = len;
      sliderLengthVal.textContent = `${len} characters`;
      syncPresetPills(len);
      if (generatedDisplay.value) {
        runGenerator();
      }
    });
  });

  // 6. Character Type Toggles
  [optUpper, optLower, optNumbers, optSpecial].forEach(function (chk) {
    chk.addEventListener('change', function () {
      // Prevent user from unchecking the very last active category
      const activeCount = [optUpper, optLower, optNumbers, optSpecial].filter(function (c) {
        return c.checked;
      }).length;

      if (activeCount === 0) {
        chk.checked = true; // Revert
        categoryError.classList.remove('hidden');
        setTimeout(function () {
          categoryError.classList.add('hidden');
        }, 2000);
        return;
      }

      validateCategories();
      if (generatedDisplay.value) {
        runGenerator();
      }
    });
  });

  // 7. Generate Button Click
  generateBtn.addEventListener('click', runGenerator);

  // 8. Toggle Generated Password Visibility
  toggleGenVisibilityBtn.addEventListener('click', function () {
    const isMasked = generatedDisplay.type === 'password';
    generatedDisplay.type = isMasked ? 'text' : 'password';

    const eyeIcon = toggleGenVisibilityBtn.querySelector('.icon-eye');
    const eyeOffIcon = toggleGenVisibilityBtn.querySelector('.icon-eye-off');

    if (isMasked) {
      eyeIcon.classList.add('hidden');
      eyeOffIcon.classList.remove('hidden');
      toggleGenVisibilityBtn.setAttribute('aria-label', 'Hide generated password');
    } else {
      eyeIcon.classList.remove('hidden');
      eyeOffIcon.classList.add('hidden');
      toggleGenVisibilityBtn.setAttribute('aria-label', 'Show generated password');
    }
  });

  // 9. Copy Generated Password
  copyBtn.addEventListener('click', function () {
    const textToCopy = generatedDisplay.value;
    if (!textToCopy) return;

    function showCopiedFeedback() {
      copyBtnText.textContent = 'Copied!';
      copyStatus.classList.remove('hidden');

      if (copyTimeoutId) clearTimeout(copyTimeoutId);
      copyTimeoutId = setTimeout(function () {
        copyBtnText.textContent = 'Copy';
        copyStatus.classList.add('hidden');
      }, 2500);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(showCopiedFeedback)
        .catch(function () {
          fallbackCopyText(textToCopy);
          showCopiedFeedback();
        });
    } else {
      fallbackCopyText(textToCopy);
      showCopiedFeedback();
    }
  });

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('Fallback copy failed', e);
    }
    document.body.removeChild(textArea);
  }

  // 10. Clear Generated Credential
  clearGeneratedBtn.addEventListener('click', function () {
    generatedDisplay.value = '';
    entropyEstimate.textContent = 'Estimated entropy: —';
  });

  // 11. Analyze Generated Credential Bridge
  analyzeGeneratedBtn.addEventListener('click', function () {
    const generatedVal = generatedDisplay.value;
    if (!generatedVal) return;

    analyzerInput.value = generatedVal;
    updateAnalyzer();

    // Visual feedback: scroll to analyzer on mobile & focus input
    analyzerInput.focus();
    if (window.innerWidth <= 960) {
      analyzerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Flash border effect on analyzer input
    analyzerInput.style.borderColor = 'var(--primary-600)';
    analyzerInput.style.boxShadow = '0 0 0 4px var(--primary-glow)';
    setTimeout(function () {
      analyzerInput.style.borderColor = '';
      analyzerInput.style.boxShadow = '';
    }, 1200);
  });

  // ==========================================================================
  // Initialization
  // ==========================================================================

  // Attempt to dynamically fetch and merge the complete common passwords list
  if (window.PasswordChecker && typeof window.PasswordChecker.loadCommonPasswords === 'function') {
    window.PasswordChecker.loadCommonPasswords('data/common_passwords.txt')
      .then(function (loaded) {
        if (loaded) {
          // Re-run analyzer if user has already entered text
          if (analyzerInput && analyzerInput.value) {
            updateAnalyzer();
          }
        }
      })
      .catch(function () {
        // Fallback embedded set remains intact
      });
  }

  // Initial render: empty analyzer & empty generator state
  if (generatedDisplay) generatedDisplay.value = '';
  if (entropyEstimate) entropyEstimate.textContent = 'Estimated entropy: —';
  updateAnalyzer();

})();

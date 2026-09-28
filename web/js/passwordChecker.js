/**
 * passwordChecker.js - Client-Side Password Analysis Engine
 * ==============================================================================
 * Privacy-First, 100% In-Browser Password Security Intelligence.
 * Ported faithfully from Python password_checker.py to preserve exact
 * heuristic scoring rules, criteria evaluations, and educational suggestions.
 *
 * Security Rationale:
 * All evaluations execute strictly within the user's browser memory.
 * Passwords are NEVER sent over network interfaces, stored in web storage,
 * or logged to the console.
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js / CommonJS
    module.exports = factory();
  } else {
    // Browser global
    root.PasswordChecker = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Embedded fallback dictionary of top common passwords.
   * Ensures common-password detection works immediately even if the web app
   * is opened directly from disk via file:// protocol where fetch() is blocked by CORS.
   */
  const FALLBACK_COMMON_PASSWORDS = [
    '123456', '123456789', '12345678', '12345', '1234567', '1234', '111111',
    '123123', '1234567890', 'password', 'password1', 'password123', 'password@123',
    'pass123', 'qwerty', 'qwerty123', 'qwertyuiop', 'admin', 'admin123',
    'administrator', 'welcome', 'welcome1', 'welcome123', 'letmein', 'letmein123',
    'abc123', 'iloveyou', 'iloveyou1', 'monkey', 'dragon', 'football', 'baseball',
    'master', 'login', 'princess', 'sunshine', 'shadow', 'superman', 'batman',
    'trustno1', 'hunter2', 'starwars', 'secret', 'passcode', 'default', 'testing',
    'guest', 'root', 'toor', 'charlie', 'michael', 'jessica', 'thomas', 'ashley',
    'bailey', 'whatever', 'killer', 'mustang', 'access', 'hello', 'system',
    'oracle', 'killer1', 'test1234', 'freedom', 'computer', 'pepper', 'jordan',
    'harley', 'orange', 'cookie', 'george', 'barbie', 'soccer', 'cheese',
    'donald', 'merlin', 'thunder', 'magical', 'robert', 'matrix', 'summer',
    'winter', 'spring', 'autumn', 'flower', 'starfish', 'coffee', 'ninja',
    'pirate', 'monster', 'diamond', 'winner', 'superstar', 'champion', 'playstation',
    'super123', 'dragon123', 'football1', 'sunshine1', 'cookie123'
  ];

  // Active in-memory set for O(1) common-password lookups
  const commonPasswordsSet = new Set(FALLBACK_COMMON_PASSWORDS.map((p) => p.toLowerCase()));

  /**
   * Asynchronously load and merge the external common_passwords.txt file.
   * Handles file:// CORS restrictions gracefully.
   *
   * @param {string} [url='data/common_passwords.txt']
   * @returns {Promise<boolean>} True if loaded from static asset, False if using fallback.
   */
  async function loadCommonPasswords(url = 'data/common_passwords.txt') {
    if (typeof fetch === 'undefined') {
      return false;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return false;
      }
      const text = await response.text();
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          commonPasswordsSet.add(trimmed.toLowerCase());
        }
      }
      return true;
    } catch {
      // In file:// protocol or offline, the pre-populated embedded fallback set remains active
      return false;
    }
  }

  /**
   * Evaluate password length against educational thresholds.
   *
   * @param {string} password
   * @returns {{ length: number, category: string, is_acceptable: boolean }}
   */
  function checkLength(password) {
    const len = password ? password.length : 0;
    let category = 'Good length';
    let isAcceptable = true;

    if (len < 8) {
      category = 'Needs improvement';
      isAcceptable = false;
    } else if (len < 12) {
      category = 'Acceptable';
      isAcceptable = true;
    } else {
      category = 'Good length';
      isAcceptable = true;
    }

    return {
      length: len,
      category: category,
      is_acceptable: isAcceptable,
    };
  }

  /**
   * Check for at least one uppercase letter (A-Z).
   * @param {string} password
   * @returns {boolean}
   */
  function checkUppercase(password) {
    return /[A-Z]/.test(password);
  }

  /**
   * Check for at least one lowercase letter (a-z).
   * @param {string} password
   * @returns {boolean}
   */
  function checkLowercase(password) {
    return /[a-z]/.test(password);
  }

  /**
   * Check for at least one numeric digit (0-9).
   * @param {string} password
   * @returns {boolean}
   */
  function checkNumber(password) {
    return /[0-9]/.test(password);
  }

  /**
   * Check for at least one special character or symbol (non-alphanumeric).
   * Matches Python's `any(not char.isalnum() for char in password)`.
   * @param {string} password
   * @returns {boolean}
   */
  function checkSpecial(password) {
    return /[^A-Za-z0-9]/.test(password);
  }

  /**
   * Check if password exists in the common password blacklist (case-insensitively).
   * @param {string} password
   * @param {Set<string>} [customSet]
   * @returns {boolean}
   */
  function checkIsCommon(password, customSet) {
    if (!password) return false;
    const targetSet = customSet || commonPasswordsSet;
    return targetSet.has(password.trim().toLowerCase());
  }

  /**
   * Calculate transparent, educational password strength score (0 to 100)
   * and determine WEAK / MEDIUM / STRONG classification.
   *
   * Scoring Breakdown:
   * 1. Length Points (Max 45 pts):
   *    - < 6 chars: 0 pts
   *    - 6-7 chars: +10 pts
   *    - 8-11 chars: +25 pts
   *    - 12-15 chars: +35 pts
   *    - 16+ chars: +45 pts
   * 2. Character Categories (+10 pts each, Max 40 pts):
   *    - Uppercase, Lowercase, Digits, Special
   * 3. Diversity Bonus/Penalty (Max +15 pts / Min -15 pts):
   *    - 4 categories: +15 pts
   *    - 3 categories: +5 pts
   *    - <= 1 category and length >= 6: -15 pts penalty
   * 4. Critical Overrides:
   *    - Common password: score capped at 10 (WEAK)
   *    - Length < 6: score capped at 20 (WEAK)
   * 5. Classification:
   *    - 0-39: WEAK (or any common password)
   *    - 40-69: MEDIUM
   *    - 70-100: STRONG
   *
   * @param {{ length: number }} lengthInfo
   * @param {boolean} hasUpper
   * @param {boolean} hasLower
   * @param {boolean} hasNum
   * @param {boolean} hasSpecial
   * @param {boolean} isCommon
   * @returns {{ score: number, classification: string, breakdown: string[] }}
   */
  function calculateEducationalScore(lengthInfo, hasUpper, hasLower, hasNum, hasSpecial, isCommon) {
    const length = lengthInfo.length;
    let score = 0;
    const breakdown = [];

    // 1. Length scoring
    let lengthPts = 0;
    if (length < 6) {
      lengthPts = 0;
      breakdown.push('Very short length (<6 chars): 0 pts');
    } else if (length < 8) {
      lengthPts = 10;
      breakdown.push('Short length (<8 chars): +10 pts');
    } else if (length < 12) {
      lengthPts = 25;
      breakdown.push('Acceptable length (8-11 chars): +25 pts');
    } else if (length < 16) {
      lengthPts = 35;
      breakdown.push('Good length (12-15 chars): +35 pts');
    } else {
      lengthPts = 45;
      breakdown.push('Great length (16+ chars): +45 pts');
    }
    score += lengthPts;

    // 2. Character types scoring (up to 40 pts)
    let typesCount = 0;
    if (hasUpper) {
      score += 10;
      typesCount += 1;
      breakdown.push('Contains uppercase: +10 pts');
    }
    if (hasLower) {
      score += 10;
      typesCount += 1;
      breakdown.push('Contains lowercase: +10 pts');
    }
    if (hasNum) {
      score += 10;
      typesCount += 1;
      breakdown.push('Contains numeric digit: +10 pts');
    }
    if (hasSpecial) {
      score += 10;
      typesCount += 1;
      breakdown.push('Contains special character: +10 pts');
    }

    // 3. Diversity bonus (up to 15 pts)
    if (typesCount === 4) {
      score += 15;
      breakdown.push('All 4 character classes present: +15 pts bonus');
    } else if (typesCount === 3) {
      score += 5;
      breakdown.push('3 character classes present: +5 pts bonus');
    } else if (typesCount <= 1 && length >= 6) {
      score = Math.max(0, score - 15);
      breakdown.push('Single character type only: -15 pts penalty');
    }

    // 4. Critical Overrides
    // Security Rationale: Known dictionary passwords are fundamentally insecure
    // regardless of character diversity or length.
    if (isCommon) {
      score = Math.min(score, 10);
      breakdown.push('CRITICAL: Common password detected (Score capped at 10)');
    } else if (length < 6) {
      score = Math.min(score, 20);
      breakdown.push('Extremely short password (Score capped at 20)');
    }

    // Clamp score to 0..100
    const finalScore = Math.max(0, Math.min(100, score));

    // 5. Determine Classification (0-39: WEAK, 40-69: MEDIUM, 70-100: STRONG)
    let classification = 'STRONG';
    if (finalScore < 40 || isCommon) {
      classification = 'WEAK';
    } else if (finalScore < 70) {
      classification = 'MEDIUM';
    } else {
      classification = 'STRONG';
    }

    return {
      score: finalScore,
      classification: classification,
      breakdown: breakdown,
    };
  }

  /**
   * Generate actionable, educational security suggestions.
   *
   * @param {{ length: number }} lengthInfo
   * @param {boolean} hasUpper
   * @param {boolean} hasLower
   * @param {boolean} hasNum
   * @param {boolean} hasSpecial
   * @param {boolean} isCommon
   * @param {string} classification
   * @returns {string[]}
   */
  function generateSuggestions(lengthInfo, hasUpper, hasLower, hasNum, hasSpecial, isCommon, classification) {
    const suggestions = [];
    const length = lengthInfo.length;

    // 1. Critical priority: Common password warning
    if (isCommon) {
      suggestions.push(
        '⚠️ CRITICAL: This password is among the most commonly used and breached passwords. It can be cracked almost instantly.'
      );
      suggestions.push(
        'Choose a unique password or passphrase that cannot be found in common dictionaries.'
      );
      return suggestions;
    }

    // 2. Length recommendations
    if (length < 8) {
      suggestions.push('Increase the password length to at least 8 characters (12+ recommended).');
    } else if (length < 12 && classification !== 'STRONG') {
      suggestions.push('Consider increasing length to 12 or more characters to reach a Strong rating.');
    }

    // 3. Missing character recommendations
    if (!hasUpper) {
      suggestions.push('Add at least one uppercase letter (A-Z).');
    }
    if (!hasLower) {
      suggestions.push('Add at least one lowercase letter (a-z).');
    }
    if (!hasNum) {
      suggestions.push('Add at least one numeric digit (0-9).');
    }
    if (!hasSpecial) {
      suggestions.push('Add at least one special character (! @ # $ % & *).');
    }

    // 4. Strength-based educational feedback
    if (classification === 'STRONG') {
      if (suggestions.length === 0) {
        suggestions.push('All basic character checks passed.');
      }
      suggestions.push('Educational Tip: Avoid reusing this password across different accounts and services.');
    } else if (classification === 'MEDIUM' && suggestions.length === 0) {
      suggestions.push('Consider lengthening your password to 14+ characters to boost it to Strong.');
    }

    return suggestions;
  }

  /**
   * Main analysis entry point matching Python analyze_password().
   *
   * @param {string} password Plaintext password to evaluate.
   * @param {Set<string>} [customSet] Optional custom common passwords set.
   * @returns {object} Comprehensive analysis results.
   */
  function analyzePassword(password, customSet) {
    if (!password || password.length === 0) {
      return {
        isEmpty: true,
        is_empty: true,
        status: 'empty',
        message: 'Please enter a password to analyze.',
        length: 0,
        length_category: 'Needs improvement',
        is_length_acceptable: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        has_uppercase: false,
        has_lowercase: false,
        has_number: false,
        has_special: false,
        isCommon: false,
        is_common: false,
        checksPassed: 0,
        checks_passed: 0,
        score: 0,
        classification: 'NOT ANALYZED',
        strength: 'NOT ANALYZED',
        score_breakdown: [],
        suggestions: ['Please enter a password to analyze.'],
        diversityCount: 0,
        checks: {
          length: false,
          uppercase: false,
          lowercase: false,
          numbers: false,
          special: false,
          not_common: true,
        },
      };
    }

    const lengthInfo = checkLength(password);
    const hasUpper = checkUppercase(password);
    const hasLower = checkLowercase(password);
    const hasNum = checkNumber(password);
    const hasSpecial = checkSpecial(password);
    const isCommon = checkIsCommon(password, customSet);

    const checksPassed =
      (lengthInfo.is_acceptable ? 1 : 0) +
      (hasUpper ? 1 : 0) +
      (hasLower ? 1 : 0) +
      (hasNum ? 1 : 0) +
      (hasSpecial ? 1 : 0);

    const diversityCount =
      (hasUpper ? 1 : 0) +
      (hasLower ? 1 : 0) +
      (hasNum ? 1 : 0) +
      (hasSpecial ? 1 : 0);

    const scoreData = calculateEducationalScore(
      lengthInfo,
      hasUpper,
      hasLower,
      hasNum,
      hasSpecial,
      isCommon
    );

    const suggestions = generateSuggestions(
      lengthInfo,
      hasUpper,
      hasLower,
      hasNum,
      hasSpecial,
      isCommon,
      scoreData.classification
    );

    return {
      isEmpty: false,
      is_empty: false,
      status: 'completed',
      message: 'Analysis completed',
      length: lengthInfo.length,
      length_category: lengthInfo.category,
      is_length_acceptable: lengthInfo.is_acceptable,
      hasUppercase: hasUpper,
      hasLowercase: hasLower,
      hasNumber: hasNum,
      hasSpecial: hasSpecial,
      has_uppercase: hasUpper,
      has_lowercase: hasLower,
      has_number: hasNum,
      has_special: hasSpecial,
      isCommon: isCommon,
      is_common: isCommon,
      checksPassed: checksPassed,
      checks_passed: checksPassed,
      diversityCount: diversityCount,
      checks: {
        length: lengthInfo.is_acceptable,
        uppercase: hasUpper,
        lowercase: hasLower,
        numbers: hasNum,
        special: hasSpecial,
        not_common: !isCommon,
      },
      score: scoreData.score,
      classification: scoreData.classification,
      strength: scoreData.classification,
      score_breakdown: scoreData.breakdown,
      suggestions: suggestions,
    };
  }

  return {
    analyzePassword: analyzePassword,
    checkLength: checkLength,
    checkUppercase: checkUppercase,
    checkLowercase: checkLowercase,
    checkNumber: checkNumber,
    checkSpecial: checkSpecial,
    checkIsCommon: checkIsCommon,
    calculateEducationalScore: calculateEducationalScore,
    generateSuggestions: generateSuggestions,
    loadCommonPasswords: loadCommonPasswords,
    getCommonPasswordsSet: function () {
      return commonPasswordsSet;
    },
  };
});

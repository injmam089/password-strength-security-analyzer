/**
 * passwordGenerator.js - Cryptographically Secure Web Crypto Password Generator
 * ==============================================================================
 * Privacy-First, In-Browser CSPRNG Password Generation.
 * Powered strictly by the Web Crypto API (crypto.getRandomValues).
 *
 * Security Rationale:
 * Standard PRNGs are mathematically predictable and unsuitable for cryptography.
 * Web Crypto API taps directly into the operating system's cryptographic
 * entropy pool (BCryptGenRandom on Windows, /dev/urandom on POSIX, getentropy).
 * Passwords are generated exclusively in local RAM and never persisted.
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js / CommonJS
    module.exports = factory();
  } else {
    // Browser global
    root.PasswordGenerator = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Character pool constants
  const UPPERCASE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWERCASE_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz';
  const DIGIT_CHARACTERS = '0123456789';
  const SPECIAL_CHARACTERS = '!@#$%^&*()_+-=';

  // Length constraints
  const MIN_PASSWORD_LENGTH = 8;
  const MAX_PASSWORD_LENGTH = 64;
  const DEFAULT_PASSWORD_LENGTH = 16;

  /**
   * Safe access to Web Crypto API across browser and Node.js runtimes.
   * @returns {Crypto}
   */
  function getCrypto() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      return globalThis.crypto;
    }
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
      return window.crypto;
    }
    // Node.js environment fallback
    try {
      const nodeCrypto = require('crypto');
      if (nodeCrypto.webcrypto && typeof nodeCrypto.webcrypto.getRandomValues === 'function') {
        return nodeCrypto.webcrypto;
      }
    } catch {
      // Ignored
    }
    throw new Error('Web Crypto API (crypto.getRandomValues) is required but not supported in this environment.');
  }

  /**
   * Generate an unbiased random integer in the range [0, maxExclusive)
   * using Web Crypto with rejection sampling to eliminate modulo bias.
   *
   * @param {number} maxExclusive Range upper bound (exclusive).
   * @returns {number} Unbiased random integer.
   */
  function getSecureRandomInt(maxExclusive) {
    if (maxExclusive <= 1) return 0;

    const cryptoObj = getCrypto();
    const array = new Uint32Array(1);
    const maxUint32 = 0xffffffff;
    // Calculate the highest multiple of maxExclusive that fits into 32 bits
    const limit = maxUint32 - (maxUint32 % maxExclusive);

    let rand;
    do {
      cryptoObj.getRandomValues(array);
      rand = array[0];
    } while (rand >= limit);

    return rand % maxExclusive;
  }

  /**
   * Securely pick a single random character from a string pool.
   * @param {string} pool
   * @returns {string}
   */
  function secureChoice(pool) {
    if (!pool || pool.length === 0) {
      throw new Error('Character pool must not be empty.');
    }
    const idx = getSecureRandomInt(pool.length);
    return pool.charAt(idx);
  }

  /**
   * Validate password length constraints.
   * @param {number} length
   * @returns {{ is_valid: boolean, error: string }}
   */
  function validateLengthInput(length) {
    const num = Number(length);
    if (!Number.isInteger(num)) {
      return { is_valid: false, error: 'Password length must be a valid whole number.' };
    }
    if (num < MIN_PASSWORD_LENGTH) {
      return { is_valid: false, error: `Password length must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }
    if (num > MAX_PASSWORD_LENGTH) {
      return { is_valid: false, error: `Password length must not exceed ${MAX_PASSWORD_LENGTH} characters.` };
    }
    return { is_valid: true, error: '' };
  }

  /**
   * Collect active character category pools based on user configuration.
   * @param {boolean} useUpper
   * @param {boolean} useLower
   * @param {boolean} useDigits
   * @param {boolean} useSpecial
   * @returns {Array<{ name: string, chars: string }>}
   */
  function getSelectedCategories(useUpper, useLower, useDigits, useSpecial) {
    const categories = [];
    if (useUpper) categories.push({ name: 'uppercase', chars: UPPERCASE_CHARACTERS });
    if (useLower) categories.push({ name: 'lowercase', chars: LOWERCASE_CHARACTERS });
    if (useDigits) categories.push({ name: 'digits', chars: DIGIT_CHARACTERS });
    if (useSpecial) categories.push({ name: 'special', chars: SPECIAL_CHARACTERS });
    return categories;
  }

  /**
   * Verify that a candidate password fulfills all requested requirements.
   *
   * @param {string} password
   * @param {number} targetLength
   * @param {boolean} useUpper
   * @param {boolean} useLower
   * @param {boolean} useDigits
   * @param {boolean} useSpecial
   * @returns {boolean}
   */
  function validatePasswordRequirements(password, targetLength, useUpper, useLower, useDigits, useSpecial) {
    if (password.length !== targetLength) return false;

    if (useUpper && !/[A-Z]/.test(password)) return false;
    if (useLower && !/[a-z]/.test(password)) return false;
    if (useDigits && !/[0-9]/.test(password)) return false;
    if (useSpecial && !/[!@#$%^&*()_+\-=]/.test(password)) return false;

    // Verify no characters outside permitted categories
    let allowedChars = '';
    if (useUpper) allowedChars += UPPERCASE_CHARACTERS;
    if (useLower) allowedChars += LOWERCASE_CHARACTERS;
    if (useDigits) allowedChars += DIGIT_CHARACTERS;
    if (useSpecial) allowedChars += SPECIAL_CHARACTERS;

    for (let i = 0; i < password.length; i++) {
      if (!allowedChars.includes(password[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Cryptographically secure Fisher-Yates array shuffle using Web Crypto.
   * @param {Array<string>} array
   */
  function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  /**
   * Generate a cryptographically secure random password using Web Crypto API.
   *
   * @param {object} [options]
   * @param {number} [options.length=16] Length between 8 and 64
   * @param {boolean} [options.useUppercase=true] Include A-Z
   * @param {boolean} [options.useLowercase=true] Include a-z
   * @param {boolean} [options.useDigits=true] Include 0-9
   * @param {boolean} [options.useSpecial=true] Include !@#$%^&*()_+-=
   * @param {Function} [options.isCommonFilter] Optional callback: (pwd) => boolean
   * @returns {string} Generated password
   */
  function generateSecurePassword(options = {}) {
    const length = options.length !== undefined ? Number(options.length) : DEFAULT_PASSWORD_LENGTH;
    const useUpper = options.useUpper !== undefined ? Boolean(options.useUpper) : (options.useUppercase !== undefined ? Boolean(options.useUppercase) : true);
    const useLower = options.useLower !== undefined ? Boolean(options.useLower) : (options.useLowercase !== undefined ? Boolean(options.useLowercase) : true);
    const useDigits = options.useNumbers !== undefined ? Boolean(options.useNumbers) : (options.useDigits !== undefined ? Boolean(options.useDigits) : true);
    const useSpecial = options.useSpecial !== undefined ? Boolean(options.useSpecial) : true;
    const isCommonFilter = typeof options.isCommonFilter === 'function' ? options.isCommonFilter : null;

    // 1. Validate length
    const lenVal = validateLengthInput(length);
    if (!lenVal.is_valid) {
      throw new RangeError(`Password length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters. ${lenVal.error}`);
    }

    // 2. Gather selected categories
    const categories = getSelectedCategories(useUpper, useLower, useDigits, useSpecial);
    if (categories.length === 0) {
      throw new Error('At least one character category must be selected.');
    }

    if (length < categories.length) {
      throw new Error(
        `Password length (${length}) is too short to include all ${categories.length} selected character categories.`
      );
    }

    // 3. Combined pool
    const combinedPool = categories.map((c) => c.chars).join('');
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const passwordChars = [];

      // Step A: Guaranteed representation from each selected category
      for (const cat of categories) {
        passwordChars.push(secureChoice(cat.chars));
      }

      // Step B: Fill the remaining positions from combined pool
      const remainingCount = length - passwordChars.length;
      for (let i = 0; i < remainingCount; i++) {
        passwordChars.push(secureChoice(combinedPool));
      }

      // Step C: Cryptographically secure shuffle using Web Crypto
      secureShuffle(passwordChars);
      const candidate = passwordChars.join('');

      // Step D: Strict criteria validation
      const isValid = validatePasswordRequirements(candidate, length, useUpper, useLower, useDigits, useSpecial);
      if (!isValid) {
        continue;
      }

      // Step E: Common dictionary filter check if available
      if (isCommonFilter && isCommonFilter(candidate)) {
        continue;
      }

      return candidate;
    }

    throw new Error('Secure password generation failed validation after multiple attempts.');
  }

  return {
    generateSecurePassword: generateSecurePassword,
    generatePassword: generateSecurePassword,
    validateLengthInput: validateLengthInput,
    getSelectedCategories: getSelectedCategories,
    validatePasswordRequirements: validatePasswordRequirements,
    getSecureRandomInt: getSecureRandomInt,
    constants: {
      MIN_PASSWORD_LENGTH: MIN_PASSWORD_LENGTH,
      MAX_PASSWORD_LENGTH: MAX_PASSWORD_LENGTH,
      DEFAULT_PASSWORD_LENGTH: DEFAULT_PASSWORD_LENGTH,
      UPPERCASE_CHARACTERS: UPPERCASE_CHARACTERS,
      LOWERCASE_CHARACTERS: LOWERCASE_CHARACTERS,
      DIGIT_CHARACTERS: DIGIT_CHARACTERS,
      SPECIAL_CHARACTERS: SPECIAL_CHARACTERS,
    },
  };
});

"""
password_checker.py - Password Analysis & Educational Strength Engine (Phase 3)
================================================================================
Implements local-first password analysis including:
  1. Five basic criteria checks (length, uppercase, lowercase, numbers, symbols)
  2. Common-password detection via local wordlist (common_passwords.txt)
  3. Transparent educational password strength scoring (0-100)
  4. Classification into WEAK, MEDIUM, STRONG
  5. Actionable educational security suggestions

Security Note:
All evaluations execute strictly in memory. Passwords are never saved,
logged, or transmitted over any network interface.
"""

import os
from typing import Any, Dict, List, Optional, Set

# Path to the educational common passwords list
COMMON_PASSWORDS_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "common_passwords.txt"
)


def load_common_passwords(filepath: str = COMMON_PASSWORDS_FILE) -> Set[str]:
    """
    Load the common passwords dictionary into an in-memory set for O(1) lookup.
    Lines starting with '#' and blank lines are ignored.
    All entries are normalized to lowercase.

    Security Rationale:
    Loading a local dictionary guarantees zero network telemetry or data leakage
    over the internet, preserving absolute local privacy for the user.

    Args:
        filepath: Absolute or relative path to the common passwords file.

    Returns:
        Set[str]: Set of lowercase common password strings.
    """
    common_passwords: Set[str] = set()
    if not os.path.exists(filepath):
        return common_passwords

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if stripped and not stripped.startswith("#"):
                    common_passwords.add(stripped.lower())
    except Exception:
        # Fallback gracefully if file read fails; zero crashes
        return set()

    return common_passwords


# Module-level cache for loaded common passwords list
_CACHED_COMMON_PASSWORDS: Optional[Set[str]] = None


def get_common_passwords() -> Set[str]:
    """Retrieve or lazily initialize the cached common passwords set."""
    global _CACHED_COMMON_PASSWORDS
    if _CACHED_COMMON_PASSWORDS is None:
        _CACHED_COMMON_PASSWORDS = load_common_passwords()
    return _CACHED_COMMON_PASSWORDS


def check_length(password: str) -> Dict[str, Any]:
    """
    Evaluate the length of the given password according to educational guidelines.

    Guidelines:
      - Less than 8 characters: Needs improvement
      - 8 to 11 characters: Acceptable
      - 12 or more characters: Good length

    Args:
        password: The input password string.

    Returns:
        Dict[str, Any]: Length count, category, and minimum validity flag.
    """
    length = len(password)
    if length < 8:
        category = "Needs improvement"
        is_acceptable = False
    elif 8 <= length < 12:
        category = "Acceptable"
        is_acceptable = True
    else:
        category = "Good length"
        is_acceptable = True

    return {
        "length": length,
        "category": category,
        "is_acceptable": is_acceptable,
    }


def check_uppercase(password: str) -> bool:
    """Check whether the password contains at least one uppercase letter (A-Z)."""
    return any(char.isupper() for char in password)


def check_lowercase(password: str) -> bool:
    """Check whether the password contains at least one lowercase letter (a-z)."""
    return any(char.islower() for char in password)


def check_number(password: str) -> bool:
    """Check whether the password contains at least one numeric digit (0-9)."""
    return any(char.isdigit() for char in password)


def check_special(password: str) -> bool:
    """
    Check whether the password contains at least one special character or symbol.
    Detects standard punctuation and symbols without restricting legitimate characters.
    """
    return any(not char.isalnum() for char in password)


def check_is_common(password: str, common_set: Optional[Set[str]] = None) -> bool:
    """
    Check whether the given password is present in the common passwords list.
    Evaluated case-insensitively.

    Args:
        password: The password to check.
        common_set: Optional set of common passwords. Uses module cache if omitted.

    Returns:
        bool: True if password is found in common list, False otherwise.
    """
    if not password:
        return False
    if common_set is None:
        common_set = get_common_passwords()
    return password.strip().lower() in common_set


def calculate_educational_score(
    length_info: Dict[str, Any],
    has_upper: bool,
    has_lower: bool,
    has_num: bool,
    has_special: bool,
    is_common: bool,
) -> Dict[str, Any]:
    """
    Compute a transparent, educational password strength score (0 to 100)
    and determine the WEAK / MEDIUM / STRONG classification.

    Transparent Scoring Model:
      - Length Points:
          < 8 chars: 10 pts (0 pts if < 6)
          8-11 chars: 25 pts
          12-15 chars: 35 pts
          16+ chars: 45 pts
      - Character Variety:
          +10 pts per character type (Uppercase, Lowercase, Number, Special)
          +15 pts bonus if all 4 types present (+5 pts if 3 types)
      - Critical Deductions:
          - Common password detected: Score capped at 10 (WEAK)
          - Length < 6: Score capped at 20 (WEAK)
          - Single character type only: -15 pts

    Classification:
      - WEAK:   0 – 39
      - MEDIUM: 40 – 69
      - STRONG: 70 – 100

    Args:
        length_info: Dictionary containing length count and status.
        has_upper: Upper case presence.
        has_lower: Lower case presence.
        has_num: Number presence.
        has_special: Special character presence.
        is_common: Whether password is in the common passwords list.

    Returns:
        Dict[str, Any]: score (int), classification (str), and breakdown details.
    """
    length = length_info["length"]
    score = 0
    breakdown: List[str] = []

    # 1. Length scoring
    if length < 6:
        length_pts = 0
        breakdown.append("Very short length (<6 chars): 0 pts")
    elif length < 8:
        length_pts = 10
        breakdown.append("Short length (<8 chars): +10 pts")
    elif 8 <= length < 12:
        length_pts = 25
        breakdown.append("Acceptable length (8-11 chars): +25 pts")
    elif 12 <= length < 16:
        length_pts = 35
        breakdown.append("Good length (12-15 chars): +35 pts")
    else:
        length_pts = 45
        breakdown.append("Great length (16+ chars): +45 pts")
    score += length_pts

    # 2. Character types scoring (up to 40 pts)
    types_count = 0
    if has_upper:
        score += 10
        types_count += 1
        breakdown.append("Contains uppercase: +10 pts")
    if has_lower:
        score += 10
        types_count += 1
        breakdown.append("Contains lowercase: +10 pts")
    if has_num:
        score += 10
        types_count += 1
        breakdown.append("Contains numeric digit: +10 pts")
    if has_special:
        score += 10
        types_count += 1
        breakdown.append("Contains special character: +10 pts")

    # 3. Diversity bonus (up to 15 pts)
    if types_count == 4:
        score += 15
        breakdown.append("All 4 character classes present: +15 pts bonus")
    elif types_count == 3:
        score += 5
        breakdown.append("3 character classes present: +5 pts bonus")
    elif types_count <= 1 and length >= 6:
        score = max(0, score - 15)
        breakdown.append("Single character type only: -15 pts penalty")

    # 4. Critical Overrides
    # Security Rationale: Known dictionary and breached passwords are the #1 attack
    # vector in credential stuffing and brute-force attacks. Therefore, presence in the
    # common blacklist immediately caps score at 10 and enforces a WEAK rating regardless
    # of character variety or length.
    if is_common:
        score = min(score, 10)
        breakdown.append("CRITICAL: Common password detected (Score capped at 10)")
    elif length < 6:
        score = min(score, 20)
        breakdown.append("Extremely short password (Score capped at 20)")

    # Clamp score to 0..100
    final_score = max(0, min(100, score))

    # 5. Determine Classification (Boundaries: 0-39 WEAK, 40-69 MEDIUM, 70-100 STRONG)
    if final_score < 40 or is_common:
        classification = "WEAK"
    elif 40 <= final_score < 70:
        classification = "MEDIUM"
    else:
        classification = "STRONG"

    return {
        "score": final_score,
        "classification": classification,
        "breakdown": breakdown,
    }


def generate_suggestions(
    length_info: Dict[str, Any],
    has_upper: bool,
    has_lower: bool,
    has_num: bool,
    has_special: bool,
    is_common: bool,
    classification: str,
) -> List[str]:
    """
    Generate beginner-friendly security suggestions based on score and detected weaknesses.

    Args:
        length_info: Dictionary containing length details.
        has_upper: Whether uppercase letters are present.
        has_lower: Whether lowercase letters are present.
        has_num: Whether numbers are present.
        has_special: Whether special characters are present.
        is_common: Whether password is in the common password list.
        classification: Strength classification ("WEAK", "MEDIUM", "STRONG").

    Returns:
        List[str]: List of actionable suggestions.
    """
    suggestions: List[str] = []
    length = length_info["length"]

    # 1. Critical priority: Common password warning
    if is_common:
        suggestions.append(
            "⚠️ CRITICAL: This password is among the most commonly used and breached passwords. It can be cracked almost instantly."
        )
        suggestions.append(
            "Choose a unique password or passphrase that cannot be found in common dictionaries."
        )
        return suggestions

    # 2. Length recommendations
    if length < 8:
        suggestions.append("Increase the password length to at least 8 characters (12+ recommended).")
    elif 8 <= length < 12 and classification != "STRONG":
        suggestions.append("Consider increasing length to 12 or more characters to reach a Strong rating.")

    # 3. Missing character recommendations
    if not has_upper:
        suggestions.append("Add at least one uppercase letter (A-Z).")

    if not has_lower:
        suggestions.append("Add at least one lowercase letter (a-z).")

    if not has_num:
        suggestions.append("Add at least one numeric digit (0-9).")

    if not has_special:
        suggestions.append("Add at least one special character (! @ # $ % & *).")

    # 4. Strength-based educational feedback
    if classification == "STRONG":
        if not suggestions:
            suggestions.append("All basic character checks passed.")
        suggestions.append(
            "Educational Tip: Avoid reusing this password across different accounts and services."
        )
    elif classification == "MEDIUM" and not suggestions:
        suggestions.append(
            "Consider lengthening your password to 14+ characters to boost it to Strong."
        )

    return suggestions


def analyze_password(password: str) -> Dict[str, Any]:
    """
    Analyze a given password string against Phase 3 security intelligence criteria:
      - 5 character checks
      - Common password list lookup
      - Educational score calculation (0-100)
      - WEAK / MEDIUM / STRONG classification
      - Actionable security advice

    Args:
        password: The plaintext password string to evaluate.

    Returns:
        Dict[str, Any]: Comprehensive analysis results.
    """
    # Empty input or whitespace-only handling
    if not password or not password.strip():
        return {
            "is_empty": True,
            "status": "empty",
            "message": "Please enter a password to analyze.",
            "length": 0,
            "length_category": "Needs improvement",
            "is_length_acceptable": False,
            "has_uppercase": False,
            "has_lowercase": False,
            "has_number": False,
            "has_special": False,
            "is_common": False,
            "checks_passed": 0,
            "score": 0,
            "classification": "Not analyzed",
            "suggestions": ["Please enter a password to analyze."],
        }

    # Evaluate the 5 criteria
    length_info = check_length(password)
    has_upper = check_uppercase(password)
    has_lower = check_lowercase(password)
    has_num = check_number(password)
    has_special = check_special(password)
    is_common = check_is_common(password)

    # Count passed basic criteria (0 to 5)
    checks_passed = sum(
        [
            1 if length_info["is_acceptable"] else 0,
            1 if has_upper else 0,
            1 if has_lower else 0,
            1 if has_num else 0,
            1 if has_special else 0,
        ]
    )

    # Compute educational score and classification
    score_data = calculate_educational_score(
        length_info, has_upper, has_lower, has_num, has_special, is_common
    )
    score = score_data["score"]
    classification = score_data["classification"]

    # Generate contextual suggestions
    suggestions = generate_suggestions(
        length_info, has_upper, has_lower, has_num, has_special, is_common, classification
    )

    return {
        "is_empty": False,
        "status": "completed",
        "message": "Analysis completed",
        "length": length_info["length"],
        "length_category": length_info["category"],
        "is_length_acceptable": length_info["is_acceptable"],
        "has_uppercase": has_upper,
        "has_lowercase": has_lower,
        "has_number": has_num,
        "has_special": has_special,
        "is_common": is_common,
        "checks_passed": checks_passed,
        "score": score,
        "classification": classification,
        "score_breakdown": score_data["breakdown"],
        "suggestions": suggestions,
    }


class PasswordChecker:
    """
    Object-oriented wrapper around the password analysis functions.
    Preserves clean architectural decoupling.
    """

    def __init__(self) -> None:
        """Initialize the password checker engine and pre-load common passwords."""
        # Warm the cache
        get_common_passwords()

    def analyze(self, password: str) -> Dict[str, Any]:
        """Analyze a password string."""
        return analyze_password(password)

"""
password_generator.py - Secure Password Generator (Phase 4)
============================================================
Implements cryptographically secure, local password generation using
Python's standard 'secrets' module.

Security Note:
The 'secrets' module utilizes the operating system's CSPRNG (Cryptographically
Secure Pseudo-Random Number Generator). The standard 'random' module is
intentionally NOT used because it is predictable and unsuitable for security.
Generated passwords are never logged, persisted, or transmitted over networks.
"""

import secrets
import string
from typing import Dict, List, Optional, Tuple

# Attempt to import common password detection for sanity filtering
try:
    from password_checker import check_is_common
except ImportError:
    check_is_common = lambda pwd: False

# Length boundaries
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 64
DEFAULT_PASSWORD_LENGTH = 16

# Character sets
UPPERCASE_CHARACTERS = string.ascii_uppercase  # A-Z
LOWERCASE_CHARACTERS = string.ascii_lowercase  # a-z
DIGIT_CHARACTERS = string.digits              # 0-9
SPECIAL_CHARACTERS = "!@#$%^&*()_+-="         # Core educational special characters


def validate_length_input(length_val: int) -> Tuple[bool, str]:
    """
    Validate that the requested password length falls within safe boundaries.

    Args:
        length_val: The requested integer length.

    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    if length_val < MIN_PASSWORD_LENGTH:
        return False, f"Password length must be at least {MIN_PASSWORD_LENGTH} characters."
    if length_val > MAX_PASSWORD_LENGTH:
        return False, f"Password length must not exceed {MAX_PASSWORD_LENGTH} characters."
    return True, ""


def get_selected_categories(
    use_uppercase: bool,
    use_lowercase: bool,
    use_digits: bool,
    use_special: bool,
) -> List[Tuple[str, str]]:
    """
    Collect the enabled character categories.

    Args:
        use_uppercase: Whether to include uppercase letters.
        use_lowercase: Whether to include lowercase letters.
        use_digits: Whether to include numeric digits.
        use_special: Whether to include special characters.

    Returns:
        List[Tuple[str, str]]: List of (category_name, character_set_string).
    """
    categories: List[Tuple[str, str]] = []
    if use_uppercase:
        categories.append(("uppercase", UPPERCASE_CHARACTERS))
    if use_lowercase:
        categories.append(("lowercase", LOWERCASE_CHARACTERS))
    if use_digits:
        categories.append(("digits", DIGIT_CHARACTERS))
    if use_special:
        categories.append(("special", SPECIAL_CHARACTERS))
    return categories


def validate_password_requirements(
    password: str,
    target_length: int,
    use_uppercase: bool,
    use_lowercase: bool,
    use_digits: bool,
    use_special: bool,
) -> bool:
    """
    Verify that a generated password satisfies all requested criteria.

    Args:
        password: The generated password to validate.
        target_length: Required length.
        use_uppercase: Expect at least one uppercase.
        use_lowercase: Expect at least one lowercase.
        use_digits: Expect at least one digit.
        use_special: Expect at least one special char.

    Returns:
        bool: True if all criteria are satisfied, False otherwise.
    """
    if len(password) != target_length:
        return False

    if use_uppercase and not any(c in UPPERCASE_CHARACTERS for c in password):
        return False
    if use_lowercase and not any(c in LOWERCASE_CHARACTERS for c in password):
        return False
    if use_digits and not any(c in DIGIT_CHARACTERS for c in password):
        return False
    if use_special and not any(c in SPECIAL_CHARACTERS for c in password):
        return False

    # Ensure no unintended characters outside selected categories
    allowed_chars = ""
    if use_uppercase:
        allowed_chars += UPPERCASE_CHARACTERS
    if use_lowercase:
        allowed_chars += LOWERCASE_CHARACTERS
    if use_digits:
        allowed_chars += DIGIT_CHARACTERS
    if use_special:
        allowed_chars += SPECIAL_CHARACTERS

    if any(c not in allowed_chars for c in password):
        return False

    return True


def generate_secure_password(
    length: int = DEFAULT_PASSWORD_LENGTH,
    use_uppercase: bool = True,
    use_lowercase: bool = True,
    use_digits: bool = True,
    use_special: bool = True,
) -> str:
    """
    Generate a cryptographically secure random password using Python's 'secrets' module.

    Process:
      1. Validate length boundaries (8 to 64).
      2. Ensure at least one character category is selected.
      3. Guaranteed Representation: Pick at least one character from each selected category.
      4. Fill remaining positions securely from the combined character pool.
      5. Securely shuffle the result using secrets.SystemRandom.
      6. Validate the final candidate before returning.

    Args:
        length: Desired length (8 to 64, default: 16).
        use_uppercase: Include A-Z.
        use_lowercase: Include a-z.
        use_digits: Include 0-9.
        use_special: Include !@#$%^&*()_+-=.

    Returns:
        str: A cryptographically secure random password string.

    Raises:
        ValueError: If length or category configurations are invalid.
        RuntimeError: If generation validation fails.
    """
    # 1. Validate length
    is_valid_len, len_msg = validate_length_input(length)
    if not is_valid_len:
        raise ValueError(len_msg)

    # 2. Gather selected categories
    categories = get_selected_categories(
        use_uppercase, use_lowercase, use_digits, use_special
    )
    if not categories:
        raise ValueError("Select at least one character type.")

    if length < len(categories):
        raise ValueError(
            f"Password length ({length}) is too short to include all {len(categories)} selected character categories."
        )

    combined_pool = "".join(chars for _, chars in categories)
    # Security Rationale:
    # secrets.SystemRandom() and secrets.choice() tap directly into OS cryptographic entropy
    # (e.g., CryptGenRandom / BCrypt on Windows, /dev/urandom on POSIX).
    # The standard 'random' module utilizes Mersenne Twister (MT19937), whose internal state
    # can be reconstructed from 624 consecutive outputs, making it fatal for password security.
    csprng = secrets.SystemRandom()
    max_attempts = 10

    for _ in range(max_attempts):
        password_chars: List[str] = []

        # Step A: Guaranteed representation from each selected category
        for _, char_set in categories:
            password_chars.append(secrets.choice(char_set))

        # Step B: Securely fill the remaining positions from combined pool
        remaining_count = length - len(password_chars)
        for _ in range(remaining_count):
            password_chars.append(secrets.choice(combined_pool))

        # Step C: Cryptographically secure shuffle using SystemRandom
        csprng.shuffle(password_chars)
        candidate = "".join(password_chars)

        # Step D: Strict validation
        is_valid = validate_password_requirements(
            candidate, length, use_uppercase, use_lowercase, use_digits, use_special
        )
        if not is_valid:
            continue

        # Step E: Common-password dictionary check (safety check)
        if check_is_common(candidate):
            continue

        return candidate

    raise RuntimeError("Secure password generation failed validation after multiple attempts.")


class PasswordGenerator:
    """
    Object-oriented interface for the secure password generator.
    Keeps application presentation layer decoupled from generation algorithms.
    """

    def __init__(self) -> None:
        """Initialize the password generator engine."""
        pass

    def generate(
        self,
        length: int = DEFAULT_PASSWORD_LENGTH,
        use_uppercase: bool = True,
        use_lowercase: bool = True,
        use_digits: bool = True,
        use_special: bool = True,
    ) -> str:
        """
        Generate a cryptographically secure random password.

        Args:
            length: Target character length (default: 16).
            use_uppercase: Include uppercase characters.
            use_lowercase: Include lowercase characters.
            use_digits: Include numeric characters.
            use_special: Include special symbols.

        Returns:
            str: Generated password string.
        """
        return generate_secure_password(
            length=length,
            use_uppercase=use_uppercase,
            use_lowercase=use_lowercase,
            use_digits=use_digits,
            use_special=use_special,
        )

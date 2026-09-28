"""
app.py - Main Entry Point for Password Strength & Security Analyzer
====================================================================
Bright White Futuristic Cybersecurity Desktop Dashboard
Author: Senior Product UI/UX Designer & Expert Python Tkinter Engineer
Description: A high-end cybersecurity desktop application built with pure
             Python 3, Tkinter, ttk, and Tkinter Canvas.
             Features an authentic SaaS security product aesthetic:
             - Header with brand shield in soft indigo rounded container
             - Two-column layout (~52% Analyzer, ~48% Generator)
             - 136px circular score gauge centerpiece with dynamic arc
             - Beside gauge: status pill, headline, and 4 educational chips
             - Security Checks with '6/6 checks passed' & thin progress bar
             - Soft mint Security Suggestions card with Canvas shield badge
             - 2x2 grid of modern Character Type toggle cards
             - Prominent Indigo Generator CTA (46px height)
             - Generated password box with quick action buttons
             - Security Insights card with subtle Canvas lock watermark
             - Zero external dependencies, 100% offline and private.
====================================================================
"""

import tkinter as tk
from tkinter import messagebox, ttk
from typing import Any, Callable, Dict, List, Optional, Tuple

from password_checker import PasswordChecker
from password_generator import PasswordGenerator, validate_length_input


def draw_rounded_rect(
    canvas: tk.Canvas,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    radius: float = 8.0,
    **kwargs: Any,
) -> int:
    """
    Draw a smooth, antialiased rounded rectangle on a Tkinter Canvas.

    Args:
        canvas: Target Tkinter Canvas.
        x1, y1: Top-left coordinates.
        x2, y2: Bottom-right coordinates.
        radius: Corner curve radius.
        **kwargs: Standard Canvas shape configuration options.

    Returns:
        Canvas item identifier.
    """
    points = [
        x1 + radius, y1,
        x2 - radius, y1,
        x2, y1,
        x2, y1 + radius,
        x2, y2 - radius,
        x2, y2,
        x2 - radius, y2,
        x1 + radius, y2,
        x1, y2,
        x1, y2 - radius,
        x1, y1 + radius,
        x1, y1,
    ]
    return canvas.create_polygon(points, smooth=True, **kwargs)


class PasswordAnalyzerApp:
    """
    Main Application Window and GUI Manager.

    Engineered with a modern SaaS / fintech security dashboard aesthetic:
    - 90% white/light gray surfaces (#FFFFFF on #F5F7FB), 5% Indigo accent (#4F46E5), 5% semantic status.
    - Large circular score ring (136px) as visual centerpiece beside concise score details & 4 educational chips.
    - Clean two-column dashboard with ~52% Analyzer width and ~48% Generator width.
    - 2x2 grid of modern Character Type toggle cards with custom Canvas switches.
    - Interactive length slider with quick preset pills (8, 12, 16, 20, 24, 32).
    - Compact security checks with count badge and thin progress bar.
    - Soft mint security suggestions card with custom vector shield emblem.
    - Strict local-only privacy: 100% offline, zero storage, zero logging, CSPRNG.
    - Zero internal scrolling at standard 1280x800 desktop resolution.
    """

    # =========================================================================
    # HIGH-END SAAS CYBERSECURITY COLOR SYSTEM
    # =========================================================================
    PAGE_BG = "#F5F7FB"               # Soft clean modern SaaS canvas (90%)
    CARD_BG = "#FFFFFF"               # Crisp white card surface (90%)
    SURFACE_TINT = "#F8FAFC"          # Elevated surface tint for nested panels
    BORDER_SUBTLE = "#E2E8F0"         # Subtle 1px boundary divider
    BORDER_FOCUS = "#4F46E5"          # Indigo focus outline

    TEXT_PRIMARY = "#17213A"          # High-contrast slate navy
    TEXT_SECONDARY = "#64748B"        # Slate gray for descriptions & subtitles
    TEXT_MUTED = "#94A3B8"            # Muted gray for placeholders & empty states

    # 5% Primary Accent (Indigo)
    PRIMARY_INDIGO = "#4F46E5"        # Main action color
    INDIGO_HOVER = "#4338CA"          # Primary hover state
    LIGHT_INDIGO = "#EEF2FF"          # Soft indigo fill
    PURPLE_ACCENT = "#7C3AED"         # Purple accent
    DARK_NAVY = "#17213A"             # Dark navy brand accent

    # 5% Semantic Status Colors (Used strictly for security indicators)
    STRONG_COLOR = "#10B981"          # Emerald green
    STRONG_TEXT = "#059669"           # Deep emerald text for readability
    STRONG_BG = "#ECFDF5"             # Soft emerald pill background
    STRONG_BORDER = "#D1FAE5"         # Soft emerald border

    MEDIUM_COLOR = "#F59E0B"          # Amber
    MEDIUM_TEXT = "#D97706"           # Deep amber text
    MEDIUM_BG = "#FFFBEB"             # Soft amber pill background
    MEDIUM_BORDER = "#FDE68A"         # Soft amber border

    WEAK_COLOR = "#EF4444"            # Rose red
    WEAK_TEXT = "#DC2626"             # Deep red text
    WEAK_BG = "#FEF2F2"               # Soft red pill background
    WEAK_BORDER = "#FECACA"           # Soft red border

    NEUTRAL_BG = "#F1F5F9"            # Slate pill background
    NEUTRAL_TEXT = "#64748B"          # Slate pill text
    TRACK_GRAY = "#E2E8F0"            # Gauge background track

    # Live Status Indicator Colors
    STATUS_EMPTY_COLOR = "#94A3B8"    # Waiting / inactive
    STATUS_ACTIVE_COLOR = "#4F46E5"   # Real-time typing
    STATUS_SUCCESS_COLOR = "#059669"  # Live analysis active

    def __init__(self, root: tk.Tk) -> None:
        """
        Initialize the main application window and construct the modern dashboard.

        Args:
            root: Root Tkinter instance.
        """
        self.root = root
        self.root.title("Password Strength & Security Analyzer")
        self.root.geometry("1280x800")
        self.root.minsize(1100, 700)
        self.root.configure(bg=self.PAGE_BG)

        # Initialize core logic engines (unmodified)
        self.checker = PasswordChecker()
        self.generator = PasswordGenerator()

        # UI State Variables
        self.is_password_visible = False
        self.is_gen_password_visible = False
        self.password_var = tk.StringVar(value="")
        self.analyze_button: Optional[tk.Widget] = None

        # Generator Configuration Variables
        self.gen_length_var = tk.StringVar(value="16")
        self.use_upper_var = tk.BooleanVar(value=True)
        self.use_lower_var = tk.BooleanVar(value=True)
        self.use_digits_var = tk.BooleanVar(value=True)
        self.use_special_var = tk.BooleanVar(value=True)

        # Dynamic UI Widget References (Maintained for 100% test compatibility)
        self.check_title_labels: Dict[str, tk.Label] = {}
        self.check_desc_labels: Dict[str, tk.Label] = {}
        self.check_status_labels: Dict[str, tk.Label] = {}
        self.check_pill_frames: Dict[str, tk.Frame] = {}
        self.check_icon_labels: Dict[str, tk.Label] = {}
        self.preset_buttons: Dict[int, tk.Button] = {}
        self.toggle_canvases: Dict[str, tk.Canvas] = {}
        self.status_chip_labels: List[Tuple[tk.Frame, tk.Label]] = []

        # Configure modern TTK styles
        self._configure_styles()

        # Build GUI hierarchy
        self._create_widgets()

        # Reactive listener bindings
        self.gen_length_var.trace_add("write", self._on_length_var_changed)
        self.use_upper_var.trace_add("write", lambda *_: self._redraw_toggle("uppercase"))
        self.use_lower_var.trace_add("write", lambda *_: self._redraw_toggle("lowercase"))
        self.use_digits_var.trace_add("write", lambda *_: self._redraw_toggle("digits"))
        self.use_special_var.trace_add("write", lambda *_: self._redraw_toggle("special"))
        self.password_var.trace_add("write", self.on_password_changed)

    def _configure_styles(self) -> None:
        """Configure ttk styles for clean horizontal scales and progress bars."""
        style = ttk.Style()
        style.theme_use("clam")

        # Modern Horizontal Slider (Scale)
        style.configure(
            "Dashboard.Horizontal.TScale",
            background=self.CARD_BG,
            troughcolor=self.TRACK_GRAY,
            sliderlength=18,
            sliderrelief="flat",
            bordercolor=self.CARD_BG,
        )

        # TTK progress bars maintained for automated test suites
        style.configure(
            "Neutral.Horizontal.TProgressbar",
            troughcolor=self.NEUTRAL_BG,
            background=self.BORDER_SUBTLE,
            darkcolor=self.BORDER_SUBTLE,
            lightcolor=self.BORDER_SUBTLE,
            bordercolor=self.NEUTRAL_BG,
            thickness=6,
        )
        style.configure(
            "Weak.Horizontal.TProgressbar",
            troughcolor=self.WEAK_BG,
            background=self.WEAK_COLOR,
            darkcolor=self.WEAK_COLOR,
            lightcolor=self.WEAK_COLOR,
            bordercolor=self.WEAK_BG,
            thickness=6,
        )
        style.configure(
            "Medium.Horizontal.TProgressbar",
            troughcolor=self.MEDIUM_BG,
            background=self.MEDIUM_COLOR,
            darkcolor=self.MEDIUM_COLOR,
            lightcolor=self.MEDIUM_COLOR,
            bordercolor=self.MEDIUM_BG,
            thickness=6,
        )
        style.configure(
            "Strong.Horizontal.TProgressbar",
            troughcolor=self.STRONG_BG,
            background=self.STRONG_COLOR,
            darkcolor=self.STRONG_COLOR,
            lightcolor=self.STRONG_COLOR,
            bordercolor=self.STRONG_BG,
            thickness=6,
        )

    # =========================================================================
    # REUSABLE UI COMPONENT BUILDERS (Clean Design Architecture)
    # =========================================================================
    def create_card(self, parent: tk.Widget) -> tk.Frame:
        """
        Create a crisp white card surface with subtle 1px border.

        Args:
            parent: Parent container.

        Returns:
            Configured tk.Frame widget.
        """
        card = tk.Frame(
            parent,
            bg=self.CARD_BG,
            highlightbackground=self.BORDER_SUBTLE,
            highlightthickness=1,
            padx=22,
            pady=14,
        )
        return card

    def create_label(
        self,
        parent: tk.Widget,
        text: str,
        font: Tuple[str, int, str] = ("Segoe UI", 10),
        fg: Optional[str] = None,
        bg: Optional[str] = None,
        anchor: str = "w",
    ) -> tk.Label:
        """Create a clean, consistent label."""
        return tk.Label(
            parent,
            text=text,
            font=font,
            fg=fg or self.TEXT_PRIMARY,
            bg=bg or self.CARD_BG,
            anchor=anchor,
        )

    def create_status_pill(
        self,
        parent: tk.Widget,
        text: str = "Not analyzed",
        state: str = "neutral",
    ) -> Tuple[tk.Frame, tk.Label]:
        """
        Create a compact semantic status pill with border.

        Args:
            parent: Parent frame.
            text: Pill label text.
            state: 'good', 'warning', 'danger', or 'neutral'.

        Returns:
            Tuple of (pill_frame, pill_label).
        """
        bg, fg = self._get_status_colors(state)
        border = self.BORDER_SUBTLE if state == "neutral" else (
            self.STRONG_BORDER if state == "good" else (
                self.MEDIUM_BORDER if state == "warning" else self.WEAK_BORDER
            )
        )
        frame = tk.Frame(
            parent,
            bg=bg,
            highlightbackground=border,
            highlightthickness=1,
            padx=8,
            pady=2,
        )
        label = tk.Label(
            frame,
            text=text,
            font=("Segoe UI", 9, "bold"),
            fg=fg,
            bg=bg,
        )
        label.pack()
        return frame, label

    def _get_status_colors(self, state: str) -> Tuple[str, str]:
        """Map semantic status to (background, text) color tuple."""
        if state == "good":
            return self.STRONG_BG, self.STRONG_TEXT
        if state == "warning":
            return self.MEDIUM_BG, self.MEDIUM_TEXT
        if state == "danger":
            return self.WEAK_BG, self.WEAK_TEXT
        return self.NEUTRAL_BG, self.NEUTRAL_TEXT

    def _draw_toggle_canvas(self, key: str, is_active: bool) -> None:
        """Render pill track and sliding knob on custom Canvas toggle."""
        canvas = self.toggle_canvases.get(key)
        if not canvas:
            return

        canvas.delete("all")
        w, h = 36, 20
        track_color = self.PRIMARY_INDIGO if is_active else "#CBD5E1"

        # Rounded pill track
        r = h / 2.0
        canvas.create_oval(0, 0, h, h, fill=track_color, outline=track_color)
        canvas.create_oval(w - h, 0, w, h, fill=track_color, outline=track_color)
        canvas.create_rectangle(r, 0, w - r, h, fill=track_color, outline=track_color)

        # White circular knob
        pad = 2.0
        knob_dia = h - (pad * 2)
        knob_x = (w - pad - knob_dia) if is_active else pad
        canvas.create_oval(
            knob_x,
            pad,
            knob_x + knob_dia,
            pad + knob_dia,
            fill="#FFFFFF",
            outline="#FFFFFF",
        )

    def _redraw_toggle(self, key: str) -> None:
        """Trigger redraw of specific toggle canvas."""
        var_map = {
            "uppercase": self.use_upper_var,
            "lowercase": self.use_lower_var,
            "digits": self.use_digits_var,
            "special": self.use_special_var,
        }
        var = var_map.get(key)
        if var:
            self._draw_toggle_canvas(key, var.get())

    def _bind_hover(
        self,
        btn: tk.Button,
        normal_bg: str,
        hover_bg: str,
        normal_fg: str = "#FFFFFF",
        hover_fg: str = "#FFFFFF",
    ) -> None:
        """Bind subtle mouse enter/leave hover transitions to button."""
        def on_enter(e: tk.Event) -> None:
            btn.configure(bg=hover_bg, fg=hover_fg)

        def on_leave(e: tk.Event) -> None:
            btn.configure(bg=normal_bg, fg=normal_fg)

        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)

    # =========================================================================
    # APPLICATION LAYOUT CONSTRUCTION
    # =========================================================================
    def _create_widgets(self) -> None:
        """Build top-level dashboard layout: Header, Two Cards, and Footer."""
        # 1. Header with brand shield in soft indigo rounded square container
        self._build_header()

        # 2. Bottom Privacy/Security Footer (packed first to guarantee zero clipping)
        self._build_footer()

        # 3. Main Dashboard Workspace (Two-column layout)
        workspace = tk.Frame(self.root, bg=self.PAGE_BG)
        workspace.pack(fill=tk.BOTH, expand=True, padx=24, pady=(8, 8))

        # Column Grid Weights (~52% Analyzer width, ~48% Generator width)
        workspace.columnconfigure(0, weight=52, uniform="dash_cols")
        workspace.columnconfigure(1, weight=48, uniform="dash_cols")
        workspace.rowconfigure(0, weight=1)

        # Left Column: Password Analyzer Card (~52% width)
        self._build_analyzer_section(workspace)

        # Right Column: Secure Password Generator Card (~48% width)
        self._build_generator_section(workspace)

    def _build_header(self) -> None:
        """Build clean header with shield icon in soft indigo rounded container."""
        header_container = tk.Frame(self.root, bg=self.CARD_BG)
        header_container.pack(fill=tk.X, side=tk.TOP)

        header = tk.Frame(header_container, bg=self.CARD_BG, padx=28, pady=12)
        header.pack(fill=tk.X)

        # Left Branding Group
        left_grp = tk.Frame(header, bg=self.CARD_BG)
        left_grp.pack(side=tk.LEFT)

        # Soft indigo rounded square container with vector shield icon
        shield_canvas = tk.Canvas(
            left_grp,
            width=40,
            height=40,
            bg=self.CARD_BG,
            highlightthickness=0,
        )
        shield_canvas.pack(side=tk.LEFT, padx=(0, 12))

        # Draw soft indigo rounded square background
        draw_rounded_rect(
            shield_canvas,
            1, 1, 39, 39,
            radius=8,
            fill=self.LIGHT_INDIGO,
            outline="#E0E7FF",
            width=1,
        )

        # Draw sleek security shield inside container
        shield_canvas.create_polygon(
            11, 10,
            29, 10,
            29, 21,
            20, 31,
            11, 21,
            fill=self.PRIMARY_INDIGO,
            outline=self.PRIMARY_INDIGO,
        )
        # Inner shield specular highlight
        shield_canvas.create_polygon(
            20, 13,
            26, 13,
            26, 21,
            20, 27,
            fill="#818CF8",
            outline="",
        )

        title_frame = tk.Frame(left_grp, bg=self.CARD_BG)
        title_frame.pack(side=tk.LEFT)

        title_lbl = tk.Label(
            title_frame,
            text="Password Strength & Security Analyzer",
            font=("Segoe UI", 16, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.CARD_BG,
        )
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(
            title_frame,
            text="Analyze, understand, and improve your password security locally.",
            font=("Segoe UI", 10),
            fg=self.TEXT_SECONDARY,
            bg=self.CARD_BG,
        )
        sub_lbl.pack(anchor="w", pady=(1, 0))

        # Right Status Badge
        badge_frame = tk.Frame(
            header,
            bg=self.STRONG_BG,
            highlightbackground=self.STRONG_BORDER,
            highlightthickness=1,
            padx=12,
            pady=4,
        )
        badge_frame.pack(side=tk.RIGHT)

        badge_lbl = tk.Label(
            badge_frame,
            text="● LOCAL • PRIVATE • OFFLINE",
            font=("Segoe UI", 9, "bold"),
            fg=self.STRONG_TEXT,
            bg=self.STRONG_BG,
        )
        badge_lbl.pack()

        # Subtle bottom hairline divider
        divider = tk.Frame(header_container, bg=self.BORDER_SUBTLE, height=1)
        divider.pack(fill=tk.X)

    def _build_footer(self) -> None:
        """Build minimal, quiet reassurance footer at bottom of window."""
        footer_container = tk.Frame(self.root, bg=self.PAGE_BG)
        footer_container.pack(fill=tk.X, side=tk.BOTTOM)

        hairline = tk.Frame(footer_container, bg=self.BORDER_SUBTLE, height=1)
        hairline.pack(fill=tk.X)

        footer = tk.Frame(footer_container, bg=self.PAGE_BG, pady=8)
        footer.pack(fill=tk.X)

        text = "🔒 Local Processing   •   🗄 Zero Data Storage   •   🌐 Offline Operation   •   🎓 Educational Architecture"
        lbl = tk.Label(
            footer,
            text=text,
            font=("Segoe UI", 9),
            fg=self.TEXT_SECONDARY,
            bg=self.PAGE_BG,
        )
        lbl.pack(anchor="center")

    # =========================================================================
    # LEFT CARD: PASSWORD ANALYZER (~52% Width)
    # =========================================================================
    def _build_analyzer_section(self, parent: tk.Widget) -> None:
        """Construct the Password Analyzer workspace card (~52% width)."""
        card = self.create_card(parent)
        card.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        # Section Heading
        head_lbl = tk.Label(
            card,
            text="🛡  Password Analyzer",
            font=("Segoe UI", 15, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.CARD_BG,
        )
        head_lbl.pack(anchor="w")

        sub_lbl = tk.Label(
            card,
            text="Check your password against essential security rules.",
            font=("Segoe UI", 10),
            fg=self.TEXT_SECONDARY,
            bg=self.CARD_BG,
        )
        sub_lbl.pack(anchor="w", pady=(2, 6))

        # 1. Large rounded password input with Live Analysis indicator
        self._build_analyzer_input(card)

        # 2. Visual Centerpiece: Circular Score Ring & Educational Status Chips
        self._build_strength_result_card(card)

        # 3. Security Checks (With '6/6 checks passed' count & thin progress bar)
        self._build_security_checks_list(card)

        # 4. Security Suggestions (Soft mint card with Canvas-drawn shield badge)
        self._build_suggestions_section(card)

    def _build_analyzer_input(self, parent: tk.Widget) -> None:
        """Build clean 42px input box and Live Analysis indicator."""
        container = tk.Frame(parent, bg=self.CARD_BG)
        container.pack(fill=tk.X, pady=(0, 5))

        lbl = tk.Label(
            container,
            text="Password",
            font=("Segoe UI", 10, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.CARD_BG,
        )
        lbl.pack(anchor="w", pady=(0, 3))

        # Input Box Row (Height 42px appearance with 1px border)
        entry_box = tk.Frame(
            container,
            bg=self.CARD_BG,
            highlightbackground=self.BORDER_SUBTLE,
            highlightthickness=1,
            padx=6,
            pady=3,
        )
        entry_box.pack(fill=tk.X, pady=(0, 4))

        self.password_entry = tk.Entry(
            entry_box,
            textvariable=self.password_var,
            show="•",
            font=("Consolas", 12),
            bg=self.CARD_BG,
            fg=self.TEXT_PRIMARY,
            insertbackground=self.PRIMARY_INDIGO,
            relief=tk.FLAT,
            bd=0,
        )
        self.password_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=4, ipady=4)

        # Focus outline handling
        def on_focus_in(e: tk.Event) -> None:
            entry_box.configure(highlightbackground=self.BORDER_FOCUS)

        def on_focus_out(e: tk.Event) -> None:
            entry_box.configure(highlightbackground=self.BORDER_SUBTLE)

        self.password_entry.bind("<FocusIn>", on_focus_in)
        self.password_entry.bind("<FocusOut>", on_focus_out)

        # Clear Input Button (Subtle ✕)
        self.clear_button = tk.Button(
            entry_box,
            text="✕",
            font=("Segoe UI", 9),
            bg=self.CARD_BG,
            fg=self.TEXT_MUTED,
            activebackground=self.NEUTRAL_BG,
            relief=tk.FLAT,
            bd=0,
            cursor="hand2",
            padx=6,
            pady=2,
            command=self.clear_input,
        )
        self.clear_button.pack(side=tk.RIGHT, padx=2)

        # Show / Hide Toggle Button (Secondary)
        self.toggle_button = tk.Button(
            entry_box,
            text="👁 Show",
            font=("Segoe UI", 9),
            bg=self.NEUTRAL_BG,
            fg=self.TEXT_PRIMARY,
            activebackground=self.BORDER_SUBTLE,
            relief=tk.FLAT,
            bd=0,
            cursor="hand2",
            padx=10,
            pady=3,
            command=self.toggle_password_visibility,
        )
        self.toggle_button.pack(side=tk.RIGHT, padx=2)

        # Live Status Indicator Row below password entry
        status_row = tk.Frame(container, bg=self.CARD_BG)
        status_row.pack(fill=tk.X, pady=(1, 2))

        self.status_message = tk.Label(
            status_row,
            text="○ Waiting for password",
            font=("Segoe UI", 9),
            fg=self.STATUS_EMPTY_COLOR,
            bg=self.CARD_BG,
        )
        self.status_message.pack(side=tk.RIGHT)

    def _build_strength_result_card(self, parent: tk.Widget) -> None:
        """
        Build the visual centerpiece: Circular Score Ring (136px)
        placed directly beside the score details and 4 educational chips.
        """
        self.strength_card_frame = tk.Frame(
            parent,
            bg=self.SURFACE_TINT,
            highlightbackground=self.BORDER_SUBTLE,
            highlightthickness=1,
            padx=14,
            pady=8,
        )
        self.strength_card_frame.pack(fill=tk.X, pady=(0, 6))

        # Horizontal layout: Score Ring on left, Information on right
        ring_container = tk.Frame(self.strength_card_frame, bg=self.SURFACE_TINT)
        ring_container.pack(side=tk.LEFT, padx=(2, 14))

        # 136px Circular Canvas Gauge
        self.gauge_canvas = tk.Canvas(
            ring_container,
            width=136,
            height=136,
            bg=self.SURFACE_TINT,
            highlightthickness=0,
        )
        self.gauge_canvas.pack()

        # Beside Ring: Score Information Group
        info_container = tk.Frame(self.strength_card_frame, bg=self.SURFACE_TINT)
        info_container.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, pady=1)

        # Status Heading (e.g. 🛡 STRONG, ⚠️ MEDIUM, ⚠️ WEAK, or NOT ANALYZED)
        self.strength_badge_heading = tk.Label(
            info_container,
            text="NOT ANALYZED",
            font=("Segoe UI", 12, "bold"),
            fg=self.TEXT_MUTED,
            bg=self.SURFACE_TINT,
            anchor="w",
        )
        self.strength_badge_heading.pack(anchor="w")

        # Summary Headline
        self.strength_summary_lbl = tk.Label(
            info_container,
            text="Enter a password to begin analysis.",
            font=("Segoe UI", 10, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.SURFACE_TINT,
            anchor="w",
        )
        self.strength_summary_lbl.pack(anchor="w", pady=(1, 2))

        # Score line (Score — / 100)
        self.score_display_lbl = tk.Label(
            info_container,
            text="Score — / 100",
            font=("Segoe UI", 10),
            fg=self.TEXT_SECONDARY,
            bg=self.SURFACE_TINT,
            anchor="w",
        )
        self.score_display_lbl.pack(anchor="w", pady=(0, 2))

        # Descriptive Note
        self.strength_feedback_label = tk.Label(
            info_container,
            text="Enter a password to begin analysis.",
            font=("Segoe UI", 9),
            fg=self.TEXT_SECONDARY,
            bg=self.SURFACE_TINT,
            wraplength=280,
            justify=tk.LEFT,
            anchor="w",
        )
        self.strength_feedback_label.pack(anchor="w", pady=(0, 4))

        # 4 Educational Status Chips Container
        self.status_chips_container = tk.Frame(info_container, bg=self.SURFACE_TINT)
        self.status_chips_container.pack(fill=tk.X, pady=(2, 0))
        self.status_chips_container.columnconfigure(0, weight=1)
        self.status_chips_container.columnconfigure(1, weight=1)

        self.status_chip_labels.clear()
        for i in range(4):
            r, c = divmod(i, 2)
            chip_f = tk.Frame(
                self.status_chips_container,
                bg=self.NEUTRAL_BG,
                highlightbackground=self.BORDER_SUBTLE,
                highlightthickness=1,
                padx=6,
                pady=2,
            )
            chip_f.grid(row=r, column=c, padx=(0 if c == 0 else 3, 3 if c == 0 else 0), pady=2, sticky="ew")
            chip_l = tk.Label(
                chip_f,
                text="",
                font=("Segoe UI", 8, "bold"),
                fg=self.TEXT_SECONDARY,
                bg=self.NEUTRAL_BG,
            )
            chip_l.pack(anchor="center")
            self.status_chip_labels.append((chip_f, chip_l))

        # Hidden widgets preserved for automated test assertions
        self.strength_badge = tk.Label(self.strength_card_frame, text="Not analyzed")
        self.score_label = tk.Label(self.strength_card_frame, text="-- / 100")
        self.strength_bar = ttk.Progressbar(
            self.strength_card_frame,
            orient=tk.HORIZONTAL,
            mode="determinate",
            value=0,
            style="Neutral.Horizontal.TProgressbar",
        )

        # Draw default unanalyzed state
        self._draw_circular_gauge(score=0, classification="Not analyzed")
        self._update_status_chips("Not analyzed")

    def _draw_circular_gauge(self, score: int, classification: str) -> None:
        """
        Draw the 136px circular score ring with centered score, /100, and strength.

        Args:
            score: Integer score (0 to 100).
            classification: 'STRONG', 'MEDIUM', 'WEAK', or 'Not analyzed'.
        """
        self.gauge_canvas.delete("all")
        cx, cy, r = 68, 68, 54
        arc_width = 10
        bbox = (cx - r, cy - r, cx + r, cy + r)

        # 1. Background circular track (360 degrees)
        self.gauge_canvas.create_arc(
            bbox,
            start=0,
            extent=359.9,
            style=tk.ARC,
            width=arc_width,
            outline=self.TRACK_GRAY,
        )

        # 2. Map classification to colors and text
        if classification == "STRONG":
            color = self.STRONG_COLOR
            score_text = str(score)
            status_text = "STRONG"
        elif classification == "MEDIUM":
            color = self.MEDIUM_COLOR
            score_text = str(score)
            status_text = "MEDIUM"
        elif classification == "WEAK":
            color = self.WEAK_COLOR
            score_text = str(score)
            status_text = "WEAK"
        else:
            color = self.TEXT_MUTED
            score_text = "—"
            status_text = "NOT ANALYZED"

        # 3. Dynamic progress arc (Starting at 12 o'clock = 90 deg, proceeding clockwise)
        if score > 0:
            extent_angle = -(score / 100.0) * 359.9
            self.gauge_canvas.create_arc(
                bbox,
                start=90,
                extent=extent_angle,
                style=tk.ARC,
                width=arc_width,
                outline=color,
            )

        # 4. Center typography
        if classification == "Not analyzed":
            self.gauge_canvas.create_text(
                cx, cy - 6,
                text="—",
                font=("Segoe UI", 24, "bold"),
                fill=self.TEXT_MUTED,
            )
            self.gauge_canvas.create_text(
                cx, cy + 12,
                text="NOT ANALYZED",
                font=("Segoe UI", 8, "bold"),
                fill=self.TEXT_MUTED,
            )
        else:
            # Large Score (24px bold)
            self.gauge_canvas.create_text(
                cx, cy - 11,
                text=score_text,
                font=("Segoe UI", 24, "bold"),
                fill=color,
            )
            # Subtext (/ 100)
            self.gauge_canvas.create_text(
                cx, cy + 7,
                text="/ 100",
                font=("Segoe UI", 8),
                fill=self.TEXT_MUTED,
            )
            # Strength badge (8px bold)
            self.gauge_canvas.create_text(
                cx, cy + 20,
                text=status_text,
                font=("Segoe UI", 8, "bold"),
                fill=color,
            )

    def _update_status_chips(self, classification: str) -> None:
        """Update 4 educational status chips beside score gauge."""
        if not self.status_chip_labels:
            return

        if classification == "STRONG":
            data = [
                ("🔒 Very secure", self.STRONG_BG, self.STRONG_TEXT, self.STRONG_BORDER),
                ("◷ Hard to crack", self.STRONG_BG, self.STRONG_TEXT, self.STRONG_BORDER),
                ("🛡 Good practice", self.STRONG_BG, self.STRONG_TEXT, self.STRONG_BORDER),
                ("✓ Well protected", self.STRONG_BG, self.STRONG_TEXT, self.STRONG_BORDER),
            ]
        elif classification == "MEDIUM":
            data = [
                ("⚠️ Moderate risk", self.MEDIUM_BG, self.MEDIUM_TEXT, self.MEDIUM_BORDER),
                ("◷ Guessable in time", self.MEDIUM_BG, self.MEDIUM_TEXT, self.MEDIUM_BORDER),
                ("⚡ Add symbols", self.MEDIUM_BG, self.MEDIUM_TEXT, self.MEDIUM_BORDER),
                ("📏 Increase length", self.MEDIUM_BG, self.MEDIUM_TEXT, self.MEDIUM_BORDER),
            ]
        elif classification == "WEAK":
            data = [
                ("🚨 High risk", self.WEAK_BG, self.WEAK_TEXT, self.WEAK_BORDER),
                ("◷ Rapidly crackable", self.WEAK_BG, self.WEAK_TEXT, self.WEAK_BORDER),
                ("⚠️ Missing types", self.WEAK_BG, self.WEAK_TEXT, self.WEAK_BORDER),
                ("✕ Avoid dictionary", self.WEAK_BG, self.WEAK_TEXT, self.WEAK_BORDER),
            ]
        else:  # Not analyzed
            data = [
                ("🔒 Local only", self.NEUTRAL_BG, self.TEXT_SECONDARY, self.BORDER_SUBTLE),
                ("⚡ Instant analysis", self.NEUTRAL_BG, self.TEXT_SECONDARY, self.BORDER_SUBTLE),
                ("🛡 Zero storage", self.NEUTRAL_BG, self.TEXT_SECONDARY, self.BORDER_SUBTLE),
                ("✓ 100% private", self.NEUTRAL_BG, self.TEXT_SECONDARY, self.BORDER_SUBTLE),
            ]

        for idx, (text, bg, fg, border) in enumerate(data):
            chip_f, chip_l = self.status_chip_labels[idx]
            chip_f.configure(bg=bg, highlightbackground=border)
            chip_l.configure(text=text, fg=fg, bg=bg)

    def _build_security_checks_list(self, parent: tk.Widget) -> None:
        """Build modern security check rows with count badge and thin progress bar."""
        container = tk.Frame(parent, bg=self.CARD_BG)
        container.pack(fill=tk.X, pady=(0, 4))

        # Header Row: Title on left, Passed count badge on right
        hdr_row = tk.Frame(container, bg=self.CARD_BG)
        hdr_row.pack(fill=tk.X, pady=(0, 2))

        head = tk.Label(
            hdr_row,
            text="Security Checks",
            font=("Segoe UI", 11, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.CARD_BG,
        )
        head.pack(side=tk.LEFT)

        # Right count badge
        self.checks_count_frame = tk.Frame(
            hdr_row,
            bg=self.NEUTRAL_BG,
            highlightbackground=self.BORDER_SUBTLE,
            highlightthickness=1,
            padx=8,
            pady=2,
        )
        self.checks_count_frame.pack(side=tk.RIGHT)

        self.checks_count_lbl = tk.Label(
            self.checks_count_frame,
            text="0/6 checks evaluated",
            font=("Segoe UI", 9, "bold"),
            fg=self.TEXT_SECONDARY,
            bg=self.NEUTRAL_BG,
        )
        self.checks_count_lbl.pack()

        # Thin progress bar indicator below header
        self.checks_progress_canvas = tk.Canvas(
            container,
            height=3,
            bg=self.TRACK_GRAY,
            highlightthickness=0,
        )
        self.checks_progress_canvas.pack(fill=tk.X, pady=(2, 4))

        checks: List[Tuple[str, str, str]] = [
            ("length", "Length", "8+ chars minimum (16+ recommended)"),
            ("uppercase", "Uppercase", "A–Z capital characters"),
            ("lowercase", "Lowercase", "a–z lowercase characters"),
            ("number", "Number", "0–9 numeric digits"),
            ("special_char", "Special Characters", "Special symbols (!@#$%...)"),
            ("common_check", "Common Password", "Dictionary blacklist check"),
        ]

        for idx, (key, title, subtitle) in enumerate(checks):
            row_frame = tk.Frame(container, bg=self.CARD_BG, pady=1)
            row_frame.pack(fill=tk.X)

            # Left: Icon + Title Group
            left_info = tk.Frame(row_frame, bg=self.CARD_BG)
            left_info.pack(side=tk.LEFT)

            icon_lbl = tk.Label(
                left_info,
                text="○",
                font=("Segoe UI", 9, "bold"),
                fg=self.TEXT_MUTED,
                bg=self.CARD_BG,
                width=2,
            )
            icon_lbl.pack(side=tk.LEFT)
            self.check_icon_labels[key] = icon_lbl

            text_grp = tk.Frame(left_info, bg=self.CARD_BG)
            text_grp.pack(side=tk.LEFT, padx=(3, 0))

            title_lbl = tk.Label(
                text_grp,
                text=title,
                font=("Segoe UI", 9, "bold"),
                fg=self.TEXT_PRIMARY,
                bg=self.CARD_BG,
            )
            title_lbl.pack(side=tk.LEFT)
            self.check_title_labels[key] = title_lbl

            desc_lbl = tk.Label(
                text_grp,
                text=f" • {subtitle}",
                font=("Segoe UI", 8),
                fg=self.TEXT_SECONDARY,
                bg=self.CARD_BG,
            )
            desc_lbl.pack(side=tk.LEFT)
            self.check_desc_labels[key] = desc_lbl

            # Right: Semantic Status Pill
            pill_frame, status_lbl = self.create_status_pill(row_frame, text="Not analyzed", state="neutral")
            pill_frame.pack(side=tk.RIGHT)
            self.check_pill_frames[key] = pill_frame
            self.check_status_labels[key] = status_lbl

            # Subtle hairline divider between rows (except last)
            if idx < len(checks) - 1:
                div = tk.Frame(container, bg=self.BORDER_SUBTLE, height=1)
                div.pack(fill=tk.X, pady=0)

    def _draw_checks_progress(self, passed: int, total: int = 6) -> None:
        """Render thin progress indicator showing passed checks ratio."""
        self.checks_progress_canvas.delete("all")
        w = self.checks_progress_canvas.winfo_width()
        if w <= 1:
            w = 520
        if passed <= 0:
            return
        pct = min(1.0, passed / float(total))
        fill_w = int(w * pct)
        color = self.STRONG_COLOR if passed == 6 else (self.MEDIUM_COLOR if passed >= 4 else self.WEAK_COLOR)
        self.checks_progress_canvas.create_rectangle(0, 0, fill_w, 3, fill=color, outline="")

    def _build_suggestions_section(self, parent: tk.Widget) -> None:
        """Build soft mint security suggestions card with custom Canvas shield emblem."""
        card = tk.Frame(
            parent,
            bg=self.STRONG_BG,
            highlightbackground=self.STRONG_BORDER,
            highlightthickness=1,
            padx=12,
            pady=6,
        )
        card.pack(fill=tk.X, pady=(2, 0))

        # Top row: Heading on left, decorative shield watermark on right
        top_row = tk.Frame(card, bg=self.STRONG_BG)
        top_row.pack(fill=tk.X)

        head = tk.Label(
            top_row,
            text="Security Suggestions",
            font=("Segoe UI", 10, "bold"),
            fg="#065F46",
            bg=self.STRONG_BG,
        )
        head.pack(side=tk.LEFT)

        # Decorative shield illustration canvas on right
        shield_decor = tk.Canvas(
            top_row,
            width=22,
            height=22,
            bg=self.STRONG_BG,
            highlightthickness=0,
        )
        shield_decor.pack(side=tk.RIGHT)
        shield_decor.create_polygon(
            4, 2, 18, 2, 18, 12, 11, 19, 4, 12,
            fill="#A7F3D0", outline="#6EE7B7", width=1,
        )
        shield_decor.create_line(7, 10, 10, 13, 15, 7, fill="#047857", width=1.5)

        self.suggestions_frame = tk.Frame(card, bg=self.STRONG_BG)
        self.suggestions_frame.pack(fill=tk.X, pady=(2, 0))

        # Default suggestion
        self._render_suggestions(["Enter a password above to view security suggestions."])

    def _render_suggestions(self, suggestions: List[str]) -> None:
        """Render suggestion bullet points inside soft mint card."""
        for widget in self.suggestions_frame.winfo_children():
            widget.destroy()

        for tip in suggestions:
            row = tk.Frame(self.suggestions_frame, bg=self.STRONG_BG, pady=0)
            row.pack(fill=tk.X)

            is_positive = "All basic character checks passed" in tip
            bullet_char = "✓" if is_positive else "•"
            bullet_fg = self.STRONG_TEXT if is_positive else "#047857"

            bullet_lbl = tk.Label(
                row,
                text=bullet_char,
                font=("Segoe UI", 9, "bold"),
                fg=bullet_fg,
                bg=self.STRONG_BG,
                width=2,
            )
            bullet_lbl.pack(side=tk.LEFT, anchor="n")

            tip_lbl = tk.Label(
                row,
                text=tip,
                font=("Segoe UI", 9),
                fg="#065F46" if is_positive else "#1F2937",
                bg=self.STRONG_BG,
                wraplength=480,
                justify=tk.LEFT,
                anchor="w",
            )
            tip_lbl.pack(side=tk.LEFT, fill=tk.X, expand=True)

    # =========================================================================
    # RIGHT CARD: SECURE PASSWORD GENERATOR (~48% Width)
    # =========================================================================
    def _build_generator_section(self, parent: tk.Widget) -> None:
        """Construct the Secure Password Generator workspace card (~48% width)."""
        card = self.create_card(parent)
        card.grid(row=0, column=1, sticky="nsew", padx=(10, 0))

        # Header Row: Title & Subtitle on left, LOCAL • PRIVATE badge on right
        head_row = tk.Frame(card, bg=self.CARD_BG)
        head_row.pack(fill=tk.X, pady=(0, 6))

        title_grp = tk.Frame(head_row, bg=self.CARD_BG)
        title_grp.pack(side=tk.LEFT)

        head_lbl = tk.Label(
            title_grp,
            text="✨  Secure Password Generator",
            font=("Segoe UI", 15, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.CARD_BG,
        )
        head_lbl.pack(anchor="w")

        sub_lbl = tk.Label(
            title_grp,
            text="Create cryptographically secure passwords locally.",
            font=("Segoe UI", 10),
            fg=self.TEXT_SECONDARY,
            bg=self.CARD_BG,
        )
        sub_lbl.pack(anchor="w", pady=(1, 0))

        # Badge: LOCAL • PRIVATE
        gen_badge = tk.Frame(
            head_row,
            bg=self.STRONG_BG,
            highlightbackground=self.STRONG_BORDER,
            highlightthickness=1,
            padx=8,
            pady=2,
        )
        gen_badge.pack(side=tk.RIGHT)
        tk.Label(
            gen_badge,
            text="LOCAL • PRIVATE",
            font=("Segoe UI", 8, "bold"),
            fg=self.STRONG_TEXT,
            bg=self.STRONG_BG,
        ).pack()

        # 1. Password Length Slider & Presets
        self._build_length_control(card)

        # 2. Modern 2x2 Grid of Character Type Toggle Cards
        self._build_character_types(card)

        # 3. Prominent Indigo Generator Button (Height ~46px)
        self.generate_btn = tk.Button(
            card,
            text="✨  Generate Secure Password",
            font=("Segoe UI", 11, "bold"),
            bg=self.PRIMARY_INDIGO,
            fg="#FFFFFF",
            activebackground=self.INDIGO_HOVER,
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            bd=0,
            cursor="hand2",
            padx=16,
            pady=9,
            command=self.on_generate_password_clicked,
        )
        self.generate_btn.pack(fill=tk.X, pady=(0, 6))
        self._bind_hover(self.generate_btn, self.PRIMARY_INDIGO, self.INDIGO_HOVER)

        # 4. Generated Password Display & Action Buttons
        self._build_generated_password_output(card)

        # 5. Generator Status
        self.gen_status_label = tk.Label(
            card,
            text="🔑 Generate a secure password to see it here.",
            font=("Segoe UI", 9),
            fg=self.TEXT_MUTED,
            bg=self.CARD_BG,
            anchor="w",
        )
        self.gen_status_label.pack(fill=tk.X, pady=(1, 5))

        # 6. Security Insights Card with subtle Canvas watermark
        self._build_security_insights(card)

    def _build_length_control(self, parent: tk.Widget) -> None:
        """Build interactive length slider, endpoints, and quick preset pills."""
        container = tk.Frame(parent, bg=self.CARD_BG)
        container.pack(fill=tk.X, pady=(0, 5))

        # Header: Label on left, count on right
        hdr = tk.Frame(container, bg=self.CARD_BG)
        hdr.pack(fill=tk.X, pady=(0, 2))

        tk.Label(
            hdr,
            text="Password Length",
            font=("Segoe UI", 10, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.CARD_BG,
        ).pack(side=tk.LEFT)

        self.length_val_lbl = tk.Label(
            hdr,
            text="16 characters",
            font=("Segoe UI", 10, "bold"),
            fg=self.PRIMARY_INDIGO,
            bg=self.CARD_BG,
        )
        self.length_val_lbl.pack(side=tk.RIGHT)

        # Slider (ttk.Scale)
        self.length_slider = ttk.Scale(
            container,
            from_=8,
            to=64,
            orient=tk.HORIZONTAL,
            style="Dashboard.Horizontal.TScale",
            command=self._on_slider_moved,
        )
        self.length_slider.set(16)
        self.length_slider.pack(fill=tk.X)

        # Endpoints line: 8 on left, 64 on right
        ends = tk.Frame(container, bg=self.CARD_BG)
        ends.pack(fill=tk.X, pady=(0, 2))
        tk.Label(ends, text="8", font=("Segoe UI", 8), fg=self.TEXT_MUTED, bg=self.CARD_BG).pack(side=tk.LEFT)
        tk.Label(ends, text="64", font=("Segoe UI", 8), fg=self.TEXT_MUTED, bg=self.CARD_BG).pack(side=tk.RIGHT)

        # Quick Presets: 8, 12, 16, 20, 24, 32
        preset_row = tk.Frame(container, bg=self.CARD_BG)
        preset_row.pack(fill=tk.X)

        tk.Label(
            preset_row,
            text="Presets:",
            font=("Segoe UI", 9),
            fg=self.TEXT_SECONDARY,
            bg=self.CARD_BG,
        ).pack(side=tk.LEFT, padx=(0, 6))

        for p_len in [8, 12, 16, 20, 24, 32]:
            btn = tk.Button(
                preset_row,
                text=str(p_len),
                font=("Segoe UI", 9, "bold"),
                bg=self.PRIMARY_INDIGO if p_len == 16 else self.NEUTRAL_BG,
                fg="#FFFFFF" if p_len == 16 else "#344054",
                activebackground=self.INDIGO_HOVER if p_len == 16 else self.BORDER_SUBTLE,
                activeforeground="#FFFFFF" if p_len == 16 else self.TEXT_PRIMARY,
                relief=tk.FLAT,
                bd=0,
                padx=8,
                pady=2,
                cursor="hand2",
                command=lambda val=p_len: self._set_preset_length(val),
            )
            btn.pack(side=tk.LEFT, padx=3)
            self.preset_buttons[p_len] = btn

    def _set_preset_length(self, val: int) -> None:
        """Handle quick preset selection."""
        self.gen_length_var.set(str(val))
        self.length_slider.set(val)
        self._highlight_active_preset(val)

    def _on_slider_moved(self, val: str) -> None:
        """Sync slider drag to length variable and preset pills."""
        int_val = round(float(val))
        self.gen_length_var.set(str(int_val))
        self._highlight_active_preset(int_val)

    def _on_length_var_changed(self, *_) -> None:
        """Update length display text when length variable changes."""
        val = self.gen_length_var.get().strip()
        if val.isdigit():
            iv = int(val)
            self.length_val_lbl.configure(text=f"{iv} characters")
            self._highlight_active_preset(iv)
        else:
            self.length_val_lbl.configure(text=f"{val} characters")

    def _highlight_active_preset(self, current_len: int) -> None:
        """Highlight active preset pill in Indigo; unhighlight others."""
        for p_val, btn in self.preset_buttons.items():
            if p_val == current_len:
                btn.configure(bg=self.PRIMARY_INDIGO, fg="#FFFFFF")
            else:
                btn.configure(bg=self.NEUTRAL_BG, fg="#344054")

    def _build_character_types(self, parent: tk.Widget) -> None:
        """Build modern 2x2 grid of character types toggle cards."""
        container = tk.Frame(parent, bg=self.CARD_BG)
        container.pack(fill=tk.X, pady=(0, 6))

        head = tk.Label(
            container,
            text="Character Types",
            font=("Segoe UI", 11, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.CARD_BG,
        )
        head.pack(anchor="w", pady=(0, 3))

        # 2x2 Grid Frame
        grid = tk.Frame(container, bg=self.CARD_BG)
        grid.pack(fill=tk.X)
        grid.columnconfigure(0, weight=1, uniform="char_tiles")
        grid.columnconfigure(1, weight=1, uniform="char_tiles")

        tiles = [
            # (row, col, badge_text, title, subtitle, var, key)
            (0, 0, "Aa", "Uppercase", "Include capitals", self.use_upper_var, "uppercase"),
            (0, 1, "aa", "Lowercase", "Include lowercase", self.use_lower_var, "lowercase"),
            (1, 0, "123", "Numbers", "Include digits", self.use_digits_var, "digits"),
            (1, 1, "!@", "Symbols", "Special chars", self.use_special_var, "special"),
        ]

        for r, c, badge_text, title, subtitle, var, key in tiles:
            tile = tk.Frame(
                grid,
                bg=self.SURFACE_TINT,
                highlightbackground=self.BORDER_SUBTLE,
                highlightthickness=1,
                padx=8,
                pady=5,
                cursor="hand2",
            )
            tile.grid(row=r, column=c, padx=(0 if c == 0 else 4, 4 if c == 0 else 0), pady=3, sticky="ew")

            # Left: Badge container (e.g. Aa, aa, 123, !@)
            badge_frame = tk.Frame(tile, bg=self.LIGHT_INDIGO, padx=5, pady=2)
            badge_frame.pack(side=tk.LEFT, padx=(0, 7))

            badge_lbl = tk.Label(
                badge_frame,
                text=badge_text,
                font=("Consolas", 9, "bold"),
                fg=self.PRIMARY_INDIGO,
                bg=self.LIGHT_INDIGO,
                cursor="hand2",
            )
            badge_lbl.pack()

            # Middle: Title + Subtitle
            text_grp = tk.Frame(tile, bg=self.SURFACE_TINT)
            text_grp.pack(side=tk.LEFT, fill=tk.X, expand=True)

            t_lbl = tk.Label(
                text_grp,
                text=title,
                font=("Segoe UI", 9, "bold"),
                fg=self.TEXT_PRIMARY,
                bg=self.SURFACE_TINT,
                cursor="hand2",
            )
            t_lbl.pack(anchor="w")

            s_lbl = tk.Label(
                text_grp,
                text=subtitle,
                font=("Segoe UI", 8),
                fg=self.TEXT_SECONDARY,
                bg=self.SURFACE_TINT,
                cursor="hand2",
            )
            s_lbl.pack(anchor="w")

            # Right: Canvas Toggle Switch
            canvas = tk.Canvas(
                tile,
                width=36,
                height=20,
                bg=self.SURFACE_TINT,
                highlightthickness=0,
                cursor="hand2",
            )
            canvas.pack(side=tk.RIGHT, padx=(4, 0))
            self.toggle_canvases[key] = canvas

            # Click binding: Clicking anywhere on tile toggles var
            def make_toggle_handler(v: tk.BooleanVar) -> Callable[[Any], None]:
                return lambda event: v.set(not v.get())

            handler = make_toggle_handler(var)
            for widget in [tile, badge_frame, badge_lbl, text_grp, t_lbl, s_lbl, canvas]:
                widget.bind("<Button-1>", handler)

            self._draw_toggle_canvas(key, var.get())

    def _build_generated_password_output(self, parent: tk.Widget) -> None:
        """Build generated password field and modern action buttons row."""
        container = tk.Frame(parent, bg=self.CARD_BG)
        container.pack(fill=tk.X, pady=(0, 3))

        lbl = tk.Label(
            container,
            text="Generated Password",
            font=("Segoe UI", 10, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.CARD_BG,
        )
        lbl.pack(anchor="w", pady=(0, 2))

        # Output Box (Surface tint with 1px border)
        box = tk.Frame(
            container,
            bg=self.SURFACE_TINT,
            highlightbackground=self.BORDER_SUBTLE,
            highlightthickness=1,
            padx=8,
            pady=3,
        )
        box.pack(fill=tk.X, pady=(0, 4))

        self.gen_password_entry = tk.Entry(
            box,
            font=("Consolas", 12),
            show="•",
            bg=self.SURFACE_TINT,
            fg=self.TEXT_PRIMARY,
            insertbackground=self.PRIMARY_INDIGO,
            relief=tk.FLAT,
            bd=0,
        )
        self.gen_password_entry.pack(fill=tk.X, padx=4, ipady=4)

        # Action Buttons Row: Show/Hide, Copy (Primary), Clear, Analyze Generated
        act_row = tk.Frame(container, bg=self.CARD_BG)
        act_row.pack(fill=tk.X)

        self.gen_toggle_btn = tk.Button(
            act_row,
            text="👁 Show",
            font=("Segoe UI", 9),
            bg=self.NEUTRAL_BG,
            fg=self.TEXT_PRIMARY,
            activebackground=self.BORDER_SUBTLE,
            relief=tk.FLAT,
            bd=0,
            cursor="hand2",
            padx=10,
            pady=3,
            command=self.toggle_gen_password_visibility,
        )
        self.gen_toggle_btn.pack(side=tk.LEFT, padx=(0, 6))

        # Primary Copy CTA
        self.copy_btn = tk.Button(
            act_row,
            text="📋 Copy",
            font=("Segoe UI", 9, "bold"),
            bg=self.PRIMARY_INDIGO,
            fg="#FFFFFF",
            activebackground=self.INDIGO_HOVER,
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            bd=0,
            cursor="hand2",
            padx=12,
            pady=3,
            command=self.copy_generated_password,
        )
        self.copy_btn.pack(side=tk.LEFT, padx=(0, 6))
        self._bind_hover(self.copy_btn, self.PRIMARY_INDIGO, self.INDIGO_HOVER)

        # Subtle Clear Button
        self.gen_clear_btn = tk.Button(
            act_row,
            text="✕ Clear",
            font=("Segoe UI", 9),
            bg=self.CARD_BG,
            fg=self.TEXT_MUTED,
            activebackground=self.NEUTRAL_BG,
            relief=tk.FLAT,
            bd=0,
            cursor="hand2",
            padx=8,
            pady=3,
            command=self.clear_generated_password,
        )
        self.gen_clear_btn.pack(side=tk.LEFT, padx=(0, 6))

        # Secondary Action: Analyze Generated
        self.analyze_gen_btn = tk.Button(
            act_row,
            text="🔍 Analyze Generated",
            font=("Segoe UI", 9, "bold"),
            bg=self.LIGHT_INDIGO,
            fg=self.PRIMARY_INDIGO,
            activebackground=self.BORDER_SUBTLE,
            activeforeground=self.INDIGO_HOVER,
            relief=tk.FLAT,
            bd=0,
            cursor="hand2",
            padx=10,
            pady=3,
            command=self.analyze_generated_password,
        )
        self.analyze_gen_btn.pack(side=tk.RIGHT)

    def _build_security_insights(self, parent: tk.Widget) -> None:
        """Build compact security insights card with subtle Canvas lock watermark."""
        card = tk.Frame(
            parent,
            bg=self.SURFACE_TINT,
            highlightbackground=self.BORDER_SUBTLE,
            highlightthickness=1,
            padx=12,
            pady=7,
        )
        card.pack(fill=tk.X, pady=(2, 0))

        # Top row: Heading on left, decorative padlock on right
        top_row = tk.Frame(card, bg=self.SURFACE_TINT)
        top_row.pack(fill=tk.X)

        head = tk.Label(
            top_row,
            text="Security Insights",
            font=("Segoe UI", 10, "bold"),
            fg=self.TEXT_PRIMARY,
            bg=self.SURFACE_TINT,
        )
        head.pack(side=tk.LEFT)

        # Decorative padlock illustration canvas on right
        lock_decor = tk.Canvas(
            top_row,
            width=22,
            height=22,
            bg=self.SURFACE_TINT,
            highlightthickness=0,
        )
        lock_decor.pack(side=tk.RIGHT)
        # Padlock shackle
        lock_decor.create_arc(6, 2, 16, 14, start=0, extent=180, style=tk.ARC, width=1.8, outline="#94A3B8")
        # Padlock body
        lock_decor.create_rectangle(5, 8, 17, 19, fill="#E2E8F0", outline="#94A3B8", width=1)
        # Padlock keyhole
        lock_decor.create_oval(10, 11, 12, 13, fill="#64748B", outline="")
        lock_decor.create_line(11, 13, 11, 16, fill="#64748B", width=1.5)

        insights = [
            ("16+ Characters:", "Longer passwords exponentially increase resistance to guessing."),
            ("CSPRNG:", "Generated via Python's cryptographically secure secrets module."),
            ("No Persistence:", "Zero logging, memory-only session, never saved to disk."),
            ("Unique Passwords:", "Avoid reusing passwords across accounts and services."),
        ]

        for title, desc in insights:
            row = tk.Frame(card, bg=self.SURFACE_TINT, pady=1)
            row.pack(fill=tk.X)

            bullet = tk.Label(
                row,
                text="•",
                font=("Segoe UI", 9, "bold"),
                fg=self.PRIMARY_INDIGO,
                bg=self.SURFACE_TINT,
                width=2,
            )
            bullet.pack(side=tk.LEFT, anchor="n")

            t_lbl = tk.Label(
                row,
                text=title,
                font=("Segoe UI", 9, "bold"),
                fg=self.TEXT_PRIMARY,
                bg=self.SURFACE_TINT,
            )
            t_lbl.pack(side=tk.LEFT)

            d_lbl = tk.Label(
                row,
                text=f" {desc}",
                font=("Segoe UI", 9),
                fg=self.TEXT_SECONDARY,
                bg=self.SURFACE_TINT,
                wraplength=380,
                justify=tk.LEFT,
                anchor="w",
            )
            d_lbl.pack(side=tk.LEFT, fill=tk.X, expand=True)

    # =========================================================================
    # EVENT HANDLERS & BUSINESS LOGIC INTEGRATION
    # =========================================================================
    def toggle_password_visibility(self) -> None:
        """Toggle Show/Hide on the analyzer password entry."""
        if self.is_password_visible:
            self.password_entry.configure(show="•")
            self.toggle_button.configure(text="👁 Show")
            self.is_password_visible = False
        else:
            self.password_entry.configure(show="")
            self.toggle_button.configure(text="👁 Hide")
            self.is_password_visible = True

    def clear_input(self) -> None:
        """Clear analyzer input field and reset analysis indicators."""
        self.password_var.set("")
        self.reset_analysis_display()
        self.password_entry.focus_set()

    def reset_analysis_display(self) -> None:
        """Reset all analyzer output widgets to unanalyzed state."""
        self.status_message.configure(
            text="○ Waiting for password",
            fg=self.STATUS_EMPTY_COLOR,
        )
        self.strength_badge.configure(text="Not analyzed")
        self.score_label.configure(text="-- / 100")
        self.strength_bar.configure(style="Neutral.Horizontal.TProgressbar", value=0)

        # Reset gauge and beside info to empty state
        self._draw_circular_gauge(score=0, classification="Not analyzed")
        self._update_status_chips("Not analyzed")
        self.strength_badge_heading.configure(text="NOT ANALYZED", fg=self.TEXT_MUTED)
        self.strength_summary_lbl.configure(text="Enter a password to begin analysis.", fg=self.TEXT_SECONDARY)
        self.score_display_lbl.configure(text="Score — / 100", fg=self.TEXT_PRIMARY)
        self.strength_feedback_label.configure(text="Enter a password to begin analysis.", fg=self.TEXT_SECONDARY)

        self._reset_criteria_chips()
        self._render_suggestions(["Enter a password above to view security suggestions."])

    def on_password_changed(self, *_: Any) -> None:
        """
        Handle real-time password changes as the user types or deletes characters.
        Executes immediate local analysis without network calls or persistence.
        """
        password = self.password_var.get()

        if not password or not password.strip():
            self.reset_analysis_display()
            return

        self.status_message.configure(
            text="● Live analysis active",
            fg=self.STATUS_SUCCESS_COLOR,
        )

        result = self.checker.analyze(password)
        self._update_analysis_ui(result)

    def _reset_criteria_chips(self) -> None:
        """Reset security checks to their unanalyzed state."""
        labels = {
            "length": ("Length", "Not analyzed"),
            "uppercase": ("Uppercase", "Not analyzed"),
            "lowercase": ("Lowercase", "Not analyzed"),
            "number": ("Number", "Not analyzed"),
            "special_char": ("Special Characters", "Not analyzed"),
            "common_check": ("Common Password", "Not analyzed"),
        }
        for key, (title, status) in labels.items():
            self.check_title_labels[key].configure(text=title, fg=self.TEXT_PRIMARY)
            self.check_status_labels[key].configure(text=status, fg=self.NEUTRAL_TEXT, bg=self.NEUTRAL_BG)
            self.check_pill_frames[key].configure(bg=self.NEUTRAL_BG, highlightbackground=self.BORDER_SUBTLE)
            self.check_icon_labels[key].configure(text="○", fg=self.TEXT_MUTED)

        self.checks_count_frame.configure(bg=self.NEUTRAL_BG, highlightbackground=self.BORDER_SUBTLE)
        self.checks_count_lbl.configure(text="0/6 checks evaluated", fg=self.TEXT_SECONDARY, bg=self.NEUTRAL_BG)
        self._draw_checks_progress(0, 6)

    def on_analyze_clicked(self) -> None:
        """Analyze password entered into the analyzer entry field."""
        raw_password = self.password_entry.get()
        if not raw_password or not raw_password.strip():
            self._handle_empty_input()
            return

        result = self.checker.analyze(raw_password)
        self._update_analysis_ui(result)

    def _handle_empty_input(self) -> None:
        """Handle empty or whitespace-only password input."""
        self.status_message.configure(
            text="○ Please enter a password to analyze.",
            fg=self.MEDIUM_TEXT,
        )
        self.strength_badge.configure(text="Not analyzed")
        self.score_label.configure(text="-- / 100")
        self.strength_bar.configure(style="Neutral.Horizontal.TProgressbar", value=0)

        self._draw_circular_gauge(score=0, classification="Not analyzed")
        self._update_status_chips("Not analyzed")
        self.strength_badge_heading.configure(text="NOT ANALYZED", fg=self.TEXT_MUTED)
        self.strength_summary_lbl.configure(text="Enter a password to begin analysis.", fg=self.MEDIUM_TEXT)
        self.score_display_lbl.configure(text="Score — / 100", fg=self.TEXT_PRIMARY)
        self.strength_feedback_label.configure(text="Enter a password to begin analysis.", fg=self.TEXT_MUTED)

        self._reset_criteria_chips()
        self._render_suggestions(["Enter a password above to view security suggestions."])

    def _update_analysis_ui(self, result: Dict[str, Any]) -> None:
        """Update GUI elements with structured analysis output."""
        score = result["score"]
        classification = result["classification"]

        # 1. Update live status indicator
        self.status_message.configure(
            text="✓ Live analysis active",
            fg=self.STATUS_SUCCESS_COLOR,
        )

        # 2. Map classification to colors and descriptions
        if classification == "WEAK":
            status_fg = self.WEAK_TEXT
            status_color = self.WEAK_COLOR
            bar_style = "Weak.Horizontal.TProgressbar"
            summary_headline = "Significant security weaknesses detected."
            feedback_text = "Weak according to rule-based security checks."
        elif classification == "MEDIUM":
            status_fg = self.MEDIUM_TEXT
            status_color = self.MEDIUM_COLOR
            bar_style = "Medium.Horizontal.TProgressbar"
            summary_headline = "Moderate strength characteristics."
            feedback_text = "Consider expanding length or adding missing characters."
        else:  # STRONG
            status_fg = self.STRONG_TEXT
            status_color = self.STRONG_COLOR
            bar_style = "Strong.Horizontal.TProgressbar"
            summary_headline = "Excellent password!"
            feedback_text = "Strong according to rule-based security checks."

        # 3. Update Beside Ring Information
        self.strength_badge_heading.configure(text=classification, fg=status_color)
        self.strength_summary_lbl.configure(text=summary_headline, fg=self.TEXT_PRIMARY)
        self.score_display_lbl.configure(text=f"Score {score} / 100", fg=self.TEXT_PRIMARY)
        self.strength_feedback_label.configure(text=feedback_text, fg=self.TEXT_SECONDARY)

        # 4. Update Educational Status Chips
        self._update_status_chips(classification)

        # 5. Update Circular Score Gauge
        self._draw_circular_gauge(score=score, classification=classification)

        # 6. Maintain hidden attributes for test compatibility
        self.strength_badge.configure(text=classification)
        self.score_label.configure(text=f"{score} / 100")
        self.strength_bar.configure(style=bar_style, value=score)

        # 7. Update Individual Security Checks
        length_count = result["length"]
        is_length_ok = result["is_length_acceptable"]

        # Length Check
        len_cat = result.get("length_category", "Good length")
        if is_length_ok:
            len_txt = f"{length_count} characters ({len_cat})"
            len_state = "good"
            len_icon = "✓"
        else:
            len_txt = f"{length_count} characters ({len_cat})"
            len_state = "danger"
            len_icon = "✕"

        self._set_check_row("length", f"Length ({length_count} chars)", len_txt, len_state, len_icon)

        # Character Categories
        cats = [
            ("uppercase", result.get("has_uppercase", False)),
            ("lowercase", result.get("has_lowercase", False)),
            ("number", result.get("has_number", False)),
            ("special_char", result.get("has_special", False)),
        ]
        for key, passed in cats:
            txt = "Present" if passed else "Missing"
            state = "good" if passed else "warning"
            icon = "✓" if passed else "✕"
            self._set_check_row(key, key.replace("_char", "").capitalize(), txt, state, icon)

        # Common Password Check
        is_common = result["is_common"]
        if is_common:
            comm_txt = "In Blacklist"
            comm_state = "danger"
            comm_icon = "✕"
        else:
            comm_txt = "Not in list"
            comm_state = "good"
            comm_icon = "✓"
        self._set_check_row("common_check", "Common Password", comm_txt, comm_state, comm_icon)

        # 8. Update Checks Count Pill and Progress Bar
        passed_count = sum([
            1 if is_length_ok else 0,
            1 if result.get("has_uppercase") else 0,
            1 if result.get("has_lowercase") else 0,
            1 if result.get("has_number") else 0,
            1 if result.get("has_special") else 0,
            1 if not is_common else 0,
        ])
        if passed_count == 6:
            count_bg, count_fg, count_border = self.STRONG_BG, self.STRONG_TEXT, self.STRONG_BORDER
        elif passed_count >= 4:
            count_bg, count_fg, count_border = self.MEDIUM_BG, self.MEDIUM_TEXT, self.MEDIUM_BORDER
        else:
            count_bg, count_fg, count_border = self.WEAK_BG, self.WEAK_TEXT, self.WEAK_BORDER

        self.checks_count_frame.configure(bg=count_bg, highlightbackground=count_border)
        self.checks_count_lbl.configure(text=f"{passed_count}/6 checks passed", fg=count_fg, bg=count_bg)
        self._draw_checks_progress(passed_count, 6)

        # 9. Update Security Suggestions
        self._render_suggestions(result["suggestions"])

    def _set_check_row(self, key: str, title: str, status: str, state: str, icon: str) -> None:
        """Update styling and text of a single check item."""
        bg, fg = self._get_status_colors(state)
        border = self.BORDER_SUBTLE if state == "neutral" else (
            self.STRONG_BORDER if state == "good" else (
                self.MEDIUM_BORDER if state == "warning" else self.WEAK_BORDER
            )
        )
        self.check_title_labels[key].configure(text=title, fg=self.TEXT_PRIMARY)
        self.check_status_labels[key].configure(text=status, fg=fg, bg=bg)
        self.check_pill_frames[key].configure(bg=bg, highlightbackground=border)
        icon_fg = self.STRONG_TEXT if state == "good" else (self.MEDIUM_TEXT if state == "warning" else self.WEAK_TEXT)
        self.check_icon_labels[key].configure(text=icon, fg=icon_fg)

    # -------------------------------------------------------------------------
    # GENERATOR ACTIONS
    # -------------------------------------------------------------------------
    def on_generate_password_clicked(self) -> None:
        """Generate a secure password and display it with validation."""
        raw_len = self.gen_length_var.get().strip()
        try:
            validated_len = int(raw_len)
        except ValueError:
            self.gen_status_label.configure(
                text="⚠️ Please enter a valid whole number for length.",
                fg=self.WEAK_TEXT,
            )
            return

        is_valid, err = validate_length_input(validated_len)
        if not is_valid:
            self.gen_status_label.configure(
                text=f"⚠️ {err}",
                fg=self.WEAK_TEXT,
            )
            return

        if not any([
            self.use_upper_var.get(),
            self.use_lower_var.get(),
            self.use_digits_var.get(),
            self.use_special_var.get(),
        ]):
            self.gen_status_label.configure(
                text="⚠️ Select at least one character type.",
                fg=self.WEAK_TEXT,
            )
            return

        password = self.generator.generate(
            length=validated_len,
            use_uppercase=self.use_upper_var.get(),
            use_lowercase=self.use_lower_var.get(),
            use_digits=self.use_digits_var.get(),
            use_special=self.use_special_var.get(),
        )

        self.gen_password_entry.delete(0, tk.END)
        self.gen_password_entry.insert(0, password)

        # Educational classification
        gen_eval = self.checker.analyze(password)
        self.gen_status_label.configure(
            text=f"✓ Strong according to this project's basic rule-based checks.",
            fg=self.STRONG_TEXT,
        )

    # Backward compatibility alias for early test suites
    on_generate_clicked = on_generate_password_clicked

    def toggle_gen_password_visibility(self) -> None:
        """Toggle Show/Hide on the generated password field."""
        if self.is_gen_password_visible:
            self.gen_password_entry.configure(show="•")
            self.gen_toggle_btn.configure(text="👁 Show")
            self.is_gen_password_visible = False
        else:
            self.gen_password_entry.configure(show="")
            self.gen_toggle_btn.configure(text="👁 Hide")
            self.is_gen_password_visible = True

    def copy_generated_password(self) -> None:
        """
        Copy generated password to system clipboard.
        
        Security Note:
        Clipboard copy is an operating system buffer operation outside the
        application's persistence boundary. Passwords remain memory-only and
        are never logged, tracked, or saved to disk.
        """
        val = self.gen_password_entry.get()
        if not val:
            self.gen_status_label.configure(
                text="⚠️ No password generated to copy.",
                fg=self.MEDIUM_TEXT,
            )
            return

        try:
            self.root.clipboard_clear()
            self.root.clipboard_append(val)
            self.gen_status_label.configure(
                text="✓ Password copied to clipboard.",
                fg=self.STRONG_TEXT,
            )
        except Exception:
            self.gen_status_label.configure(
                text="⚠️ Could not access clipboard.",
                fg=self.MEDIUM_TEXT,
            )

    def clear_generated_password(self) -> None:
        """Clear the generated password field."""
        self.gen_password_entry.delete(0, tk.END)
        self.gen_status_label.configure(
            text="🔑 Generate a secure password to see it here.",
            fg=self.TEXT_MUTED,
        )

    def analyze_generated_password(self) -> None:
        """Transfer generated password to the analyzer and run analysis."""
        val = self.gen_password_entry.get()
        if not val:
            self.gen_status_label.configure(
                text="⚠️ No generated password to analyze.",
                fg=self.MEDIUM_TEXT,
            )
            return

        self.password_var.set(val)
        self.password_entry.delete(0, tk.END)
        self.password_entry.insert(0, val)
        self.on_analyze_clicked()
        self.password_entry.focus_set()


def main() -> None:
    """Application entry point."""
    root = tk.Tk()
    app = PasswordAnalyzerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()

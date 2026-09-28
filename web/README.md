# Password Strength & Security Analyzer — Web Edition

> **100% Client-Side, Privacy-First, Zero-Knowledge Cybersecurity Application**  
> Evaluates password strength in real time and generates cryptographically secure credentials using the browser's native **Web Crypto API**.

---

## 🛡️ Architecture & Security Principles

The Web Edition was designed from the ground up under a strict **Zero-Knowledge** architecture:

1. **Zero Server Backend**: All heuristic analysis, scoring, regex matching, entropy calculations, and password generation happen entirely inside your local browser tab's RAM sandbox.
2. **Zero Network Transmission**: Not a single character, password, keystroke, hash, or analytics beacon ever leaves the browser.
3. **Zero Persistent Storage**: No credentials are ever saved to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
4. **No Insecure PRNGs**: Password generation strictly uses the browser's hardware-backed CSPRNG (`window.crypto.getRandomValues`) with rejection sampling to eliminate modulo bias. **No `Math.random()` is used anywhere**.
5. **Universal Static Portability**: Zero Node.js, Python, or server runtime is required for end users. The entire app consists of pure HTML5, CSS3, and vanilla modern JavaScript.

---

## 📁 File Structure

```text
web/
├── assets/
│   └── shield.svg                # Vector brand & security icon (favicon)
├── css/
│   └── style.css                 # Modern responsive cybersecurity theme
├── data/
│   └── common_passwords.txt      # Offline breach dictionary list
├── js/
│   ├── app.js                    # UI controller, event wiring & animations
│   ├── passwordChecker.js        # Pure client-side strength & scoring engine
│   └── passwordGenerator.js      # Web Crypto API CSPRNG password generator
├── index.html                    # Semantic, accessible HTML5 dashboard
├── netlify.toml                  # Netlify deployment configuration & security headers
├── vercel.json                   # Vercel deployment configuration & security headers
└── README.md                     # Web Edition documentation
```

---

## ⚡ Key Features

### 🔍 1. Password Analyzer (Left Dashboard Card)
- **Live Keystroke Analysis**: Recalculates strength score and criteria instantaneously as you type or paste.
- **136px Circular Gauge Meter**: Smooth SVG arc rendering dynamic score progression (0–100).
- **Three-Tier Security Status**: Distinct visual badges for `WEAK` (0–39), `MEDIUM` (40–69), and `STRONG` (70–100).
- **4 Attribute Summary Chips**:
  - Exact character count.
  - Character category diversity ($N / 4$ active sets).
  - Breach dictionary status (Clean vs In Wordlist).
  - Entropy classification (Minimal, Low, Moderate, High, Very High).
- **6 Discrete Security Checks with Progress Bar**:
  - Length $\ge 8$ chars (12+ recommended).
  - Contains uppercase letters ($A-Z$).
  - Contains lowercase letters ($a-z$).
  - Contains numbers ($0-9$).
  - Contains special symbols ($!@\#\$\%\^\&*\dots$).
  - Absence from known compromised password wordlists.
- **Contextual Hardening Guidance**: Real-time actionable recommendations to elevate credential strength.

### 🎲 2. Password Generator (Right Dashboard Card)
- **Web Crypto CSPRNG**: Operating system entropy pool via `crypto.getRandomValues()`.
- **Zero Modulo Bias**: Uses rejection sampling algorithm over 32-bit unsigned integers.
- **Guaranteed Category Coverage**: Ensures at least one character from every active category is represented.
- **Cryptographic Fisher-Yates Shuffle**: Final character sequence is shuffled using CSPRNG swaps.
- **Configurable Length**: 8 to 64 characters via smooth slider + 6 quick presets (`8`, `12`, `16`, `20`, `24`, `32`).
- **2x2 Toggle Matrix**: Uppercase (`Aa`), Lowercase (`aa`), Numbers (`123`), Symbols (`!@#`).
- **One-Click Actions**:
  - Mask/Unmask visibility.
  - Copy to clipboard with instant confirmation tooltip.
  - **Analyze Generated**: Direct bridge populating generated credential into the Analyzer.
  - Clear field.

---

## 🚀 Running Locally

### Option 1: Python Built-in Server (Recommended)
Open your terminal in the project root:
```bash
python -m http.server 8000 --directory web
```
Then navigate to: **`http://localhost:8000`**

### Option 2: Node.js (npx)
```bash
npx serve web
# or
npx http-server web
```

### Option 3: Direct Browser File (Double Click)
You can directly open `web/index.html` in Chrome, Safari, Firefox, or Edge.
> *Note: If opened via `file://`, modern browsers block local `fetch()` for `data/common_passwords.txt` due to CORS. `passwordChecker.js` automatically detects this and falls back to an embedded dictionary list so common password detection works out of the box!*

---

## 🌐 Public Deployment

Deploying the web app to public hosting takes less than 60 seconds with **zero build step**:

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run from within the `web/` folder:
   ```bash
   cd web
   vercel --prod
   ```
   *(Or connect your GitHub repository in the Vercel dashboard and set the **Root Directory** to `web`)*.

### Deploy to Netlify
1. Log in to [Netlify](https://app.netlify.com).
2. Drag and drop the `web/` folder directly into the Netlify dashboard.
3. Your site is instantly live with custom SSL and security headers configured via `web/netlify.toml`.

### Deploy to GitHub Pages
1. Push your repository to GitHub.
2. In your repo settings, go to **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Set folder to `/web` (if available) or create a `gh-pages` branch containing the contents of `web/`.

---

## 🧪 Testing & Verification

An automated Node.js test suite tests the Web Edition's engines:
```bash
node scratch/test_web_suite.js
```
The test suite validates:
- [x] Length scoring boundary tests (0-5, 6-7, 8-11, 12-15, 16+)
- [x] Character category scoring & diversity bonuses (+15, +5, -15 penalty)
- [x] Common password detection and score cap ($\le 10$, WEAK)
- [x] Short password cap ($< 6$ chars $\le 20$, WEAK)
- [x] 10,000-character stress test execution ($< 15$ ms)
- [x] Length bounds enforcement (8–64)
- [x] Zero-category error rejection
- [x] Guaranteed category representation across 100 consecutive generations
- [x] Output character set isolation
- [x] CSPRNG non-deterministic uniqueness (100 runs)
- [x] Zero usage of `Math.random`
- [x] Zero credential persistence (`localStorage`, `sessionStorage`, `cookies`)
- [x] Desktop Python application files remain 100% intact and untouched

---

## 📱 Browser Compatibility

| Browser | Minimum Version | Tested & Verified |
| :--- | :--- | :--- |
| **Google Chrome / Chromium** | 60+ | ✅ Yes |
| **Apple Safari (iOS / macOS)** | 11+ | ✅ Yes |
| **Mozilla Firefox** | 55+ | ✅ Yes |
| **Microsoft Edge** | 79+ | ✅ Yes |
| **Android Chrome** | Modern | ✅ Yes |
| **iOS Safari** | Modern | ✅ Yes |

---

## 🔒 Enterprise Security Headers Included
Both `vercel.json` and `netlify.toml` provide:
- `Content-Security-Policy`: Restricts scripts, fonts, styles, and assets strictly to origin.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `X-Frame-Options: DENY`: Blocks clickjacking via iframes.
- `Referrer-Policy: no-referrer`: Omits referrer header on outbound links.
- `Permissions-Policy`: Disables camera, microphone, geolocation, and payment APIs.

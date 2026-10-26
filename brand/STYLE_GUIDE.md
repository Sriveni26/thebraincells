# GEMMA & DEEPMIND BRAND STYLE GUIDE
**Version**: 4.0.0  
**Classification**: Official Interface & Theme Specification  
**Design Paradigm**: Neural Glassmorphism & High-Contrast Cyber-Editorial

---

## 1. Brand Philosophy & Identity
The Gemma interface identity represents Google DeepMind’s state-of-the-art open model ecosystem: high intelligence, transparent architecture, cosmic elegance, and frictionless human-AI collaboration.

The visual style combines:
- **Atmospheric Depth**: Ultra-deep space backgrounds (`#070814` to `#0d1026`) bathed in celestial radial glows.
- **Neural Accents**: Gemma Electric Violet (`#7c4dff`) and Google DeepMind Cyan (`#00f0ff`) signifying neural compute.
- **Gamified Vitality**: Amber Flare (`#ff7849`) and Radiant Emerald (`#10b981`) for mastery, streaks, and celebrations.
- **Glassmorphic Precision**: High-blur frosted surfaces (`backdrop-filter: blur(20px)`), razor-thin luminescent borders (`rgba(255, 255, 255, 0.08)`), and soft layered drop-shadows.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Core Brand Colors
| Token Name | Hex Code | HSL Equivalent | Role & Application |
| :--- | :--- | :--- | :--- |
| `--bg-space` | `#070814` | `hsl(235, 47%, 5%)` | Canvas Root Background |
| `--bg-card` | `rgba(18, 22, 43, 0.75)` | `hsla(230, 41%, 12%, 0.75)` | Frosted Container Glass |
| `--bg-card-hover` | `rgba(28, 35, 68, 0.85)` | `hsla(230, 42%, 19%, 0.85)` | Elevated Surface State |
| `--primary` | `#7c4dff` | `hsl(256, 100%, 65%)` | Gemma Electric Violet Brand Primary |
| `--primary-glow` | `rgba(124, 77, 255, 0.35)`| `hsla(256, 100%, 65%, 0.35)` | Accent Glow & Halo Effect |
| `--secondary` | `#00f0ff` | `hsl(184, 100%, 50%)` | Neural Cyan Auxiliary |
| `--accent-amber` | `#ff9100` | `hsl(34, 100%, 50%)` | XP, Streaks & Energy Indicators |
| `--accent-rose` | `#ff3366` | `hsl(345, 100%, 60%)` | Boss Battles, Errors, Alerts |
| `--accent-emerald` | `#00e676`| `hsl(151, 100%, 45%)` | Correct Answers, Mastery, Success |

### 2.2 Text & Contrast Hierarchy
- **`--text-primary`**: `#f8faff` (98% lightness, ultra-crisp readability)
- **`--text-secondary`**: `#94a3b8` (Slate 400, auxiliary context & metadata)
- **`--text-muted`**: `#64748b` (Slate 500, disabled states & hints)
- **`--border-subtle`**: `rgba(255, 255, 255, 0.08)`
- **`--border-accent`**: `rgba(124, 77, 255, 0.45)`

---

## 3. Typography Hierarchy
All typography must load from Google Fonts:
- **Headings & Display**: `'Outfit'`, sans-serif (Weights: 600 Semi-Bold, 700 Bold, 800 Extra-Bold). Letter-spacing: `-0.02em`.
- **Body & Controls**: `'Inter'`, sans-serif (Weights: 400 Regular, 500 Medium, 600 Semi-Bold). Line-height: `1.55`.
- **Code, Tokens & Stats**: `'JetBrains Mono'`, monospace (Weights: 500 Medium, 700 Bold).

```css
/* Typography Scale */
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
```

---

## 4. UI Components & Architectural Standards

### 4.1 Buttons & Interactive Elements
- **Primary CTA**: Gemma Gradient (`linear-gradient(135deg, #7c4dff 0%, #4338ca 100%)`), border radius `12px`, padding `12px 24px`, font weight `600`.
- **Hover Micro-interaction**: `transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(124, 77, 255, 0.5);`
- **Secondary / Ghost Button**: `background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);`

### 4.2 Cards & Glass Containers
- Use `backdrop-filter: blur(16px)` and background `rgba(16, 20, 38, 0.72)`.
- Borders must be translucent: `1px solid rgba(255, 255, 255, 0.08)`.
- On focus/active states, transition border to `var(--primary)` with subtle outer glow.

### 4.3 Gamification Badges & Indicators
- **XP Pill**: Amber pill badge with glowing particle icon, pulse animation on gain.
- **Streak Flame**: Animated SVG flame counter with dynamic multiplier indicator (`2x`, `3x`).
- **Difficulty Badges**:
  - `Beginner`: Emerald green badge (`#00e676`)
  - `Intermediate`: Cyan badge (`#00f0ff`)
  - `Advanced`: Violet badge (`#7c4dff`)
  - `Master`: Gold/Amber badge (`#ff9100`)

---

## 5. Layout Structure
All application views must adhere strictly to the `brand/template.html` document structure:
1. **Header Bar**:
   - Left: Logo icon + Gemma Brand mark + Model engine indicator (`gemma-4-26b-a4b-it` or Ollama `gemma4`).
   - Center: Real-time gamification stats (XP counter, Coin balance, Streak counter, Rank badge).
   - Right: AI Engine Toggle, Sound Mute switch, and Settings drawer toggle.
2. **Main Application Stage**:
   - Dynamic view router supporting `InputView`, `GameView`, `DashboardView`, and `BossBattleView`.
3. **AI Tutor Slide-over Panel**:
   - Adaptive instant feedback drawer that explains concepts simply upon an incorrect answer, offers hints, and previews the next question pattern.
4. **Toast & Modal Layer**:
   - Non-blocking notification toasts for level-ups, badge achievements, and connection status.

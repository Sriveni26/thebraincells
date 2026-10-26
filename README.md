# LearnPlay — Learn, Play, Level Up!
**AI-Powered Gamified Adaptive Learning & Educational Mini-Game Platform**  
*Powered by Google Gemma 4 (`gemma-4-26b-a4b-it` & Local Ollama `gemma4`)*

---

## 🌟 Executive Overview
**LearnPlay** transforms any academic paragraph pasted by a student (from textbooks, class notes, research articles, or PDFs) into engaging interactive quizzes, conceptual matching games, memory flip challenges, bug-hunting exercises, and multi-phase boss battles.

The platform is designed around the central adaptive pedagogical loop:
- **Wrong answer = Learn the same concept in a new way.**
- **Correct answer = Unlock a harder challenge.**

---

## 1. Core Concept & The Adaptive Learning Loop
The application adapts to the student's mastery in real-time:
- **When the answer is WRONG**:
  - The same learning objective remains active.
  - The AI Tutor explains the concept simply in friendly language without shaming.
  - Generates a **different question pattern** (e.g. Multiple choice ➔ Fill in the blank ➔ Match definition ➔ Practical example).
  - **Consecutive error remediation**:
    - **Attempt 1 fail**: Friendly feedback, plain-language concept explanation, guiding hint.
    - **Attempt 2 fail**: Structured mini-lesson popup reviewing the core principle.
    - **Attempt 3 fail**: Step-by-step worked example and a simpler practice question before returning.
  - Awards retry-success XP (+70 XP, +50 XP, +30 XP). No negative points are ever deducted.
- **When the answer is CORRECT**:
  - Unlocks a higher difficulty tier for that concept.
  - Awards full first-attempt XP (+100 XP).
  - Updates mastery score and progress bar.

---

## 2. Academic Content Input
- **Subject & Topic**: Custom inputs with 7 instant academic presets:
  - 💻 *Computer Science*: Asymptotic Analysis & Graph Traversal (BFS/DFS)
  - ⚛️ *Physics*: Newton's Second Law & Mechanical Energy Conservation
  - 🧪 *Chemistry*: Dynamic Equilibrium & Le Chatelier's Principle
  - 🧬 *Biology*: Cellular Respiration, Glycolysis & ATP Synthase
  - 📐 *Mathematics*: Differential Calculus, Derivatives & Critical Points
  - 📖 *English & Rhetoric*: Ethos, Pathos, Logos & Logical Fallacies
  - 🏛️ *World History*: The Industrial Revolution, Watt Steam Engine & Urbanization
- **Difficulty Selection**: Adaptive Engine, Level 1 (Beginner), Level 3 (Intermediate), Level 5 (Expert Challenge).
- **Question Count**: 5, 10, 15, or 20 questions.
- **Game Mode Selection**: Random Mix (combines all modes) or single-mode focus.
- **Live Word Counter & Clear Controls**: Instant feedback on pasted volume.

---

## 3. Supported Question Formats (12 Formats)
1. **Multiple-choice questions** (`QuizQuest`)
2. **Fill-in-the-blanks** (`FillTheGap` cloze deletions with interactive word bank)
3. **True-or-false** (`TrueFalse` rapid evaluation)
4. **Match the following** (`MatchMaster` dual-column connector)
5. **Arrange steps in the correct order** (`ArrangeSteps` chronological sequencer)
6. **Identify the correct definition** (Definition matching)
7. **Scenario-based questions** (Applied context)
8. **Find the mistake** (`FindTheMistake` error spotting in statements)
9. **Short-answer questions** (`ShortAnswer` active recall type-in)
10. **Application-based questions** (Practical problem-solving)
11. **Challenge questions** (Higher-order evaluation)
12. **Educational mini-games** (`MemoryMatch`, `BeatTheClock`, `BossBattle`)

---

## 4. Smart Adaptive Question Engine (5 Difficulty Levels)
- **Level 1 — Beginner**: Basic recognition and definitions.
- **Level 2 — Easy Application**: Simple examples and direct context.
- **Level 3 — Intermediate**: Application in new situations.
- **Level 4 — Advanced**: Multi-step reasoning and analytical deduction.
- **Level 5 — Expert Challenge**: Complex application, cross-concept synthesis, or problem-solving.

### Separate Concept Record Tracking
Every concept maintains:
- `currentDifficultyLevel` (1 to 5)
- `correctAnswers` & `incorrectAnswers` counts
- `attempts` count
- `firstAttemptSuccess` (distinguished from retry successes)
- `currentMasteryScore` (0% to 100%)
- `lastPracticedTime` & `nextReviewDate` (spaced repetition schedule)

---

## 5. Gamification & Progression System
- **Scoring System**:
  - First-attempt correct answer: `+100 XP`
  - Correct on second attempt: `+70 XP`
  - Correct on third attempt: `+50 XP`
  - Correct after guided practice / worked example: `+30 XP`
  - Complete a mini-game: `+50 XP`
  - Complete a full learning session: `+100 XP`
  - Complete a daily learning goal: `+150 XP`
  - Master a topic (80%+): `+200 XP`
- **Player Ranks**:
  1. 🌱 *Beginner Learner* (0 – 299 XP)
  2. 🧭 *Curious Explorer* (300 – 699 XP)
  3. 🧱 *Knowledge Builder* (700 – 1399 XP)
  4. 💡 *Smart Thinker* (1400 – 2499 XP)
  5. 🏆 *Learning Champion* (2500 – 3999 XP)
  6. 👑 *Academic Master* (4000+ XP)
- **Achievement Badges (9 Trophies)**:
  - 🎮 `First Game Completed`
  - 🎯 `Five Correct Answers`
  - 🔄 `Retry Champion`
  - 💪 `Comeback Learner`
  - 🧗 `Difficulty Climber`
  - 🌟 `Topic Master`
  - 🔥 `Three-Day Streak`
  - ⚡ `Seven-Day Streak`
  - ⚔️ `Sentinel Conqueror (Boss Defeated)`
- **Web Audio Sound Effects**: Procedural synthesis of ascending chimes, gentle error wobbles, XP sparkles, and victory fanfares (zero external audio file dependencies).

---

## 6. Interactive Educational Mini-Games
| Mini-Game | File | Mechanics |
| :--- | :--- | :--- |
| **Quiz Quest** | `js/games/QuizQuest.js` | 4-option multiple choice with keyboard shortcuts (`A`, `B`, `C`, `D`, `Enter`). |
| **Fill-the-Gap** | `js/games/FillTheGap.js` | Sentence cloze with clickable/draggable word bank tokens. |
| **Match Master** | `js/games/MatchMaster.js` | Interactive two-column connector linking terms to definitions. |
| **True or False** | `js/games/TrueFalse.js` | Split action cards with `T` / `F` keyboard shortcuts. |
| **Memory Match** | `js/games/MemoryMatch.js` | 3D card-flipping memory trial matching concepts with definitions. |
| **Find the Mistake** | `js/games/FindTheMistake.js` | Segment highlighting to identify academic misconceptions. |
| **Beat the Clock** | `js/games/BeatTheClock.js` | 15s visual countdown meter with 2× multiplier bonus & untimed toggle. |
| **Arrange Steps** | `js/games/ArrangeSteps.js` | Sequential up/down step reordering challenge. |
| **Short Answer** | `js/games/ShortAnswer.js` | Active recall type-in input with fuzzy validation. |
| **Concept Boss Battle**| `js/games/BossBattle.js` | Multi-phase synthesis battle with animated boss HP bar. |
| **Revision Arena** | `js/ui/RevisionView.js` | Targeted reinforcement queue for weak concepts. |

---

## 7. AI Integrations (Google Hosted `gemma-4-26b-a4b-it` & Local Ollama `gemma4`)
- **Google Cloud Gemini API**:
  - Model: `gemma-4-26b-a4b-it`
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key={API_KEY}`
  - Docs: [https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)
- **Local Ollama**:
  - Model: `gemma4`
  - Endpoint: `http://127.0.0.1:11434/api/chat`
  - Run command: `set OLLAMA_ORIGINS=* && ollama serve`
- **Offline Academic Simulator**:
  - Seamless offline fallback for instant demonstration without API keys.
- **Prompt & Latency Inspector**:
  - Click the 🧠 icon in the header to view prompt templates, token latency, and raw JSON.

---

## 8. Database & Supabase Schema
The PostgreSQL schema is located in [**`supabase/schema.sql`**](file:///c:/Users/gchen/Desktop/learnplay/supabase/schema.sql) and contains all 12 requested tables with Row Level Security (RLS) policies:
1. `profiles`
2. `study_materials`
3. `topics`
4. `concepts`
5. `questions`
6. `learning_sessions`
7. `question_attempts`
8. `concept_mastery`
9. `xp_transactions`
10. `achievements`
11. `user_achievements`
12. `revision_schedule`

---

## 9. Running Locally
Run the Python 3.12 multi-threaded CORS server:
```bash
# In the learnplay directory:
python server.py
```
Open **[http://localhost:5173](http://localhost:5173)** in any modern web browser.

---

## 10. Deploying to Vercel
This repository is pre-configured for instant zero-configuration deployment to **Vercel**:
- `vercel.json`: Configures clean routes and serverless API handlers for Gemma 4.
- `package.json`: Lightweight package descriptor for Vercel build detection.
- `api/gemma.js`: Secure serverless proxy routing to Google's `gemma-4-26b-a4b-it` model.
- `api/health.js`: Health status and latency verification endpoint.

### Deploy Steps:
1. Import `Sriveni26/thebraincells` into your [Vercel Dashboard](https://vercel.com/new).
2. Add your Environment Variable (Optional, user can also enter key in the UI settings):
   - `GEMINI_API_KEY`: Your Google AI Studio / Gemini API Key.
3. Click **Deploy**. Vercel will build and serve your app globally with edge routing!


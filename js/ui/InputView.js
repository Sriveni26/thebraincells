/**
 * InputView.js
 * Comprehensive academic study material input with presets, word count, difficulty selector, and game mode filter.
 */

export const PRESETS = {
  cs: {
    subject: 'Computer Science',
    topic: 'Algorithms & Computational Complexity',
    text: `Asymptotic analysis evaluates algorithmic efficiency as input size n approaches infinity. Binary search operates on sorted sequences by repeatedly bisecting the search interval, yielding logarithmic O(log n) time complexity. In contrast, linear search evaluates elements sequentially in O(n) time. Graph traversal algorithms exhibit distinct properties: Breadth-First Search (BFS) utilizes a First-In-First-Out (FIFO) queue to uncover the shortest paths in unweighted graphs level by level, whereas Depth-First Search (DFS) employs a Last-In-First-Out (LIFO) stack to trace paths to their deepest leaves before backtracking. Dynamic Programming optimizes recursive problems with overlapping subproblems and optimal substructures by caching intermediate results through memoization or bottom-up tabulation.`
  },
  physics: {
    subject: 'Physics',
    topic: 'Classical Mechanics & Conservation Laws',
    text: `Newton's second law of motion dictates that the acceleration of an object is directly proportional to the net force acting upon it and inversely proportional to its mass, summarized by F = ma. In an isolated system with no non-conservative forces, the law of conservation of mechanical energy establishes that the sum of kinetic energy (½mv²) and gravitational potential energy (mgh) remains invariant. During mechanical collisions, total linear momentum is strictly conserved across both elastic and inelastic events. However, kinetic energy is only conserved in perfectly elastic collisions, whereas inelastic collisions convert a portion of kinetic energy into thermal energy and material deformation.`
  },
  chemistry: {
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium & Le Chatelier’s Principle',
    text: `A reversible chemical reaction attains dynamic equilibrium when the rate of the forward reaction precisely equals the rate of the reverse reaction, causing reactant and product concentrations to remain constant over time. Le Chatelier's Principle predicts that if a system at dynamic equilibrium is disturbed by a change in temperature, pressure, or concentration, the system shifts its equilibrium position to counteract that disturbance. For an exothermic reaction, increasing temperature shifts the equilibrium in the endothermic direction, decreasing product yield. Catalysts accelerate the achievement of equilibrium by lowering activation energy equally in both directions, but they do not alter the final equilibrium constant Keq.`
  },
  bio: {
    subject: 'Biology',
    topic: 'Cellular Respiration & Bioenergetics',
    text: `Cellular respiration converts biochemical energy from nutrients into adenosine triphosphate (ATP) through three sequential phases: glycolysis, the citric acid (Krebs) cycle, and oxidative phosphorylation. Glycolysis takes place anaerobically in the cell cytoplasm, splitting glucose into two molecules of pyruvate while yielding a net gain of 2 ATP and 2 NADH. Pyruvate then enters the mitochondrial matrix for the Krebs cycle, generating carbon dioxide, electron carriers (NADH and FADH2), and additional ATP. Finally, the electron transport chain located along the inner mitochondrial cristae establishes a proton gradient via chemiosmosis, driving ATP synthase to produce the majority of cellular ATP.`
  },
  math: {
    subject: 'Mathematics',
    topic: 'Differential Calculus & Rates of Change',
    text: `Differential calculus investigates instantaneous rates of change and curve slopes. The derivative f'(x) represents the limiting value of the difference quotient as the increment approaches zero. Geometrically, the derivative at a point signifies the slope of the tangent line to the function graph. Under the Power Rule, the derivative of x^n is n*x^(n-1). Extreme values (local maxima and minima) occur at critical points where the first derivative equals zero or fails to exist, verifiable through the second derivative concavity test. The Fundamental Theorem of Calculus formally bridges differentiation with definite integration, proving they are inverse operations.`
  },
  english: {
    subject: 'English & Rhetoric',
    topic: 'Persuasive Rhetorical Appeals & Fallacies',
    text: `Classical rhetoric categorizes persuasive appeals into Aristotle's three primary modes: Ethos, Pathos, and Logos. Ethos establishes the credibility, moral character, and authority of the speaker. Pathos engages the emotional sensitivities, empathy, and values of the audience. Logos constructs arguments founded upon sound logic, factual evidence, empirical data, and valid syllogisms. In contrast, logical fallacies undermine reasoned discourse: Ad Hominem attacks the person rather than their argument, Straw Man misrepresents an opponent's position to make it easier to refute, and False Dilemma artificially restricts a multifaceted debate into an oversimplified binary choice.`
  },
  history: {
    subject: 'World History',
    topic: 'The Industrial Revolution & Global Modernization',
    text: `The Industrial Revolution began in Great Britain during the mid-18th century, catalyzed by abundant coal reserves, access to raw materials, commercial capital, and technological innovations like James Watt's refined steam engine. Mechanized textile manufacturing and the development of steam-powered locomotives dramatically expanded trade networks and accelerated urbanization as agrarian populations migrated to industrial cities. This rapid economic restructuring gave rise to distinct industrial social classes, fueled debates over laissez-faire capitalism and Marxist socialist theory, and spurred early labor movements advocating for factory safety legislation and fair working hours.`
  }
};

export class InputView {
  constructor(container, onGenerate) {
    this.container = container;
    this.onGenerate = onGenerate;
  }

  render() {
    this.container.innerHTML = `
      <div class="glass-panel" id="input-card" style="padding: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-family: var(--font-display); font-size: 1.85rem; font-weight: 800; color: #ffffff; margin-bottom: 6px;">
              Study Material &amp; Concept Extraction
            </h1>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">
              Paste academic textbook paragraphs, lecture notes, or syllabus content. Gemma 4 will extract key concepts and generate adaptive games.
            </p>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-preset-cs">💻 CS</button>
            <button class="btn btn-secondary btn-sm" id="btn-preset-physics">⚛️ Physics</button>
            <button class="btn btn-secondary btn-sm" id="btn-preset-chem">🧪 Chemistry</button>
            <button class="btn btn-secondary btn-sm" id="btn-preset-bio">🧬 Biology</button>
            <button class="btn btn-secondary btn-sm" id="btn-preset-math">📐 Math</button>
            <button class="btn btn-secondary btn-sm" id="btn-preset-english">📖 English</button>
            <button class="btn btn-secondary btn-sm" id="btn-preset-history">🏛️ History</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label" for="input-subject">Subject</label>
            <input type="text" id="input-subject" class="input-text" placeholder="e.g. Computer Science, Physics, Chemistry" value="Computer Science">
          </div>
          <div class="form-group">
            <label class="form-label" for="input-topic">Topic / Unit</label>
            <input type="text" id="input-topic" class="input-text" placeholder="e.g. Algorithms & Computational Complexity" value="Algorithms & Computational Complexity">
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label" for="input-text-area">
            <span>Academic Source Text</span>
            <span id="word-count-badge" style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--secondary);">0 words</span>
          </label>
          <textarea id="input-text-area" class="input-textarea" placeholder="Paste textbook paragraphs, class notes, or research summaries here...">${PRESETS.cs.text}</textarea>
        </div>

        <!-- Configuration Grid: Difficulty, Question Count, Game Mode -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; padding: 20px; background: rgba(0, 0, 0, 0.25); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); margin-bottom: 28px;">
          <!-- Difficulty Tiers -->
          <div class="form-group">
            <label class="form-label">Initial Difficulty</label>
            <div class="chip-grid">
              <input type="radio" name="difficultySelect" id="diff-adaptive" class="chip-radio" value="adaptive" checked>
              <label for="diff-adaptive" class="chip-label">✨ Adaptive Engine</label>

              <input type="radio" name="difficultySelect" id="diff-1" class="chip-radio" value="beginner">
              <label for="diff-1" class="chip-label">🌱 Level 1: Beginner</label>

              <input type="radio" name="difficultySelect" id="diff-2" class="chip-radio" value="intermediate">
              <label for="diff-2" class="chip-label">⚡ Level 3: Intermediate</label>

              <input type="radio" name="difficultySelect" id="diff-3" class="chip-radio" value="advanced">
              <label for="diff-3" class="chip-label">🔥 Level 5: Expert</label>
            </div>
          </div>

          <!-- Question Count (5, 10, 15, 20) -->
          <div class="form-group">
            <label class="form-label">Question Count</label>
            <div class="chip-grid">
              <input type="radio" name="countSelect" id="count-5" class="chip-radio" value="5" checked>
              <label for="count-5" class="chip-label">5 Questions</label>

              <input type="radio" name="countSelect" id="count-10" class="chip-radio" value="10">
              <label for="count-10" class="chip-label">10 Questions</label>

              <input type="radio" name="countSelect" id="count-15" class="chip-radio" value="15">
              <label for="count-15" class="chip-label">15 Questions</label>

              <input type="radio" name="countSelect" id="count-20" class="chip-radio" value="20">
              <label for="count-20" class="chip-label">20 Questions</label>
            </div>
          </div>

          <!-- Game Mode Filter -->
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Game Mode Preference</label>
            <div class="chip-grid">
              <input type="radio" name="modeSelect" id="mode-random" class="chip-radio" value="random" checked>
              <label for="mode-random" class="chip-label">🎲 Random Mix (All Modes)</label>

              <input type="radio" name="modeSelect" id="mode-quiz" class="chip-radio" value="quiz">
              <label for="mode-quiz" class="chip-label">❓ Quiz Quest</label>

              <input type="radio" name="modeSelect" id="mode-gap" class="chip-radio" value="gap">
              <label for="mode-gap" class="chip-label">🧩 Fill-the-Gap</label>

              <input type="radio" name="modeSelect" id="mode-match" class="chip-radio" value="match">
              <label for="mode-match" class="chip-label">🔗 Match Master</label>

              <input type="radio" name="modeSelect" id="mode-tf" class="chip-radio" value="truefalse">
              <label for="mode-tf" class="chip-label">⚖️ True / False</label>

              <input type="radio" name="modeSelect" id="mode-memory" class="chip-radio" value="memory">
              <label for="mode-memory" class="chip-label">🧠 Memory Match</label>

              <input type="radio" name="modeSelect" id="mode-clock" class="chip-radio" value="clock">
              <label for="mode-clock" class="chip-label">⏱️ Beat The Clock</label>

              <input type="radio" name="modeSelect" id="mode-steps" class="chip-radio" value="steps">
              <label for="mode-steps" class="chip-label">🔢 Arrange Steps</label>
            </div>
          </div>
        </div>

        <!-- Action Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <button class="btn btn-secondary" id="btn-clear-text">
            <span>🗑️</span>
            <span>Clear Input</span>
          </button>

          <button class="btn btn-primary btn-lg" id="btn-generate-game" style="min-width: 260px;">
            <span id="btn-gen-icon">✨</span>
            <span id="btn-gen-text">Generate My Game</span>
            <span>→</span>
          </button>
        </div>

        <!-- Loading State Bar -->
        <div id="gen-loading-state" style="display: none; margin-top: 24px; padding: 18px; background: rgba(124, 77, 255, 0.1); border: 1px solid var(--border-accent); border-radius: var(--radius-md);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-family: var(--font-display); font-weight: 700; color: #ffffff;" id="loading-status-text">
              Gemma 4 is synthesizing academic concepts...
            </span>
            <span style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--secondary);" id="loading-pct">
              Processing
            </span>
          </div>
          <div class="progress-track" style="height: 6px;">
            <div class="progress-fill" id="loading-progress-fill" style="width: 70%; animation: pulse 1.5s infinite;"></div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
    this._updateWordCount();
  }

  _bindEvents() {
    const textarea = this.container.querySelector('#input-text-area');
    const subjectInput = this.container.querySelector('#input-subject');
    const topicInput = this.container.querySelector('#input-topic');
    const clearBtn = this.container.querySelector('#btn-clear-text');
    const generateBtn = this.container.querySelector('#btn-generate-game');

    textarea.addEventListener('input', () => this._updateWordCount());

    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      this._updateWordCount();
    });

    const setPreset = (p) => {
      subjectInput.value = p.subject;
      topicInput.value = p.topic;
      textarea.value = p.text;
      this._updateWordCount();
    };

    this.container.querySelector('#btn-preset-cs').addEventListener('click', () => setPreset(PRESETS.cs));
    this.container.querySelector('#btn-preset-physics').addEventListener('click', () => setPreset(PRESETS.physics));
    this.container.querySelector('#btn-preset-chem').addEventListener('click', () => setPreset(PRESETS.chemistry));
    this.container.querySelector('#btn-preset-bio').addEventListener('click', () => setPreset(PRESETS.bio));
    this.container.querySelector('#btn-preset-math').addEventListener('click', () => setPreset(PRESETS.math));
    this.container.querySelector('#btn-preset-english').addEventListener('click', () => setPreset(PRESETS.english));
    this.container.querySelector('#btn-preset-history').addEventListener('click', () => setPreset(PRESETS.history));

    generateBtn.addEventListener('click', () => {
      const text = textarea.value.trim();
      if (!text || text.length < 20) {
        alert('Please paste at least one full academic paragraph to extract concepts.');
        return;
      }

      const subject = subjectInput.value.trim();
      const topic = topicInput.value.trim();
      const diffEl = this.container.querySelector('input[name="difficultySelect"]:checked');
      const countEl = this.container.querySelector('input[name="countSelect"]:checked');
      const modeEl = this.container.querySelector('input[name="modeSelect"]:checked');

      const difficulty = diffEl ? diffEl.value : 'adaptive';
      const questionCount = countEl ? parseInt(countEl.value, 10) : 5;
      const gameMode = modeEl ? modeEl.value : 'random';

      this._showLoading(true);

      if (typeof this.onGenerate === 'function') {
        this.onGenerate({ text, subject, topic, difficulty, questionCount, gameMode })
          .finally(() => this._showLoading(false));
      }
    });
  }

  _updateWordCount() {
    const textarea = this.container.querySelector('#input-text-area');
    const badge = this.container.querySelector('#word-count-badge');
    if (!textarea || !badge) return;
    const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
    badge.textContent = `${words} word${words === 1 ? '' : 's'}`;
  }

  _showLoading(isLoading) {
    const loadingState = this.container.querySelector('#gen-loading-state');
    const generateBtn = this.container.querySelector('#btn-generate-game');
    const btnText = this.container.querySelector('#btn-gen-text');
    const btnIcon = this.container.querySelector('#btn-gen-icon');

    if (isLoading) {
      if (loadingState) loadingState.style.display = 'block';
      if (generateBtn) generateBtn.setAttribute('disabled', 'true');
      if (btnText) btnText.textContent = 'Synthesizing with Gemma 4...';
      if (btnIcon) btnIcon.textContent = '⏳';
    } else {
      if (loadingState) loadingState.style.display = 'none';
      if (generateBtn) generateBtn.removeAttribute('disabled');
      if (btnText) btnText.textContent = 'Generate My Game';
      if (btnIcon) btnIcon.textContent = '✨';
    }
  }
}

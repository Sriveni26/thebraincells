/**
 * BossBattle.js
 * Multi-phase academic Boss Battle synthesizing all concepts into a final boss encounter.
 */

export class BossBattle {
  constructor(container, bossData, onComplete, audioEffects, gameState) {
    this.container = container;
    this.bossData = bossData || {
      bossName: 'Mastery Sentinel: Synthesis Trial',
      description: 'The ultimate synthesis exam testing all concepts.',
      phases: [
        {
          phaseNumber: 1,
          challenge: 'Phase 1: Conceptual Convergence',
          question: 'Which fundamental principle connects the underlying mechanics?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          damage: 35
        },
        {
          phaseNumber: 2,
          challenge: 'Phase 2: Complex Boundary Conditions',
          question: 'When initial parameters undergo extreme scaling, what remains invariant?',
          options: ['Invariant X', 'Variable Y', 'Random Z', 'No invariance'],
          correctAnswer: 'Invariant X',
          damage: 35
        },
        {
          phaseNumber: 3,
          challenge: 'Phase 3: The Definitive Evaluation',
          question: 'What is the conclusive synthesis of all examined hypotheses?',
          options: ['Synthesis Prime', 'Contradiction Alpha', 'Null Result', 'Undetermined'],
          correctAnswer: 'Synthesis Prime',
          damage: 30
        }
      ]
    };
    this.onComplete = onComplete;
    this.audioEffects = audioEffects;
    this.gameState = gameState;
    this.currentPhaseIndex = 0;
    this.bossHp = 100;
  }

  render() {
    this.currentPhaseIndex = 0;
    this.bossHp = 100;
    this._renderPhase();
  }

  _renderPhase() {
    const phase = this.bossData.phases[this.currentPhaseIndex];
    if (!phase) {
      this._renderVictory();
      return;
    }

    const optionsHtml = (phase.options || []).map((opt) => `
      <button class="option-btn boss-option-btn" data-val="${opt.replace(/"/g, '&quot;')}">
        <span class="option-letter">⚔️</span>
        <span>${opt}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="boss-arena-card" id="boss-arena">
        <div class="boss-header">
          <div>
            <div style="font-size: 0.8rem; color: var(--rose-danger); font-family: var(--font-mono); text-transform: uppercase;">
              ⚠️ Boss Battle Trial • Phase ${this.currentPhaseIndex + 1} of ${this.bossData.phases.length}
            </div>
            <h2 class="boss-name">${this.bossData.bossName || 'Mastery Sentinel'}</h2>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; color: #ff3366;" id="boss-hp-text">
              HP: ${this.bossHp}%
            </div>
          </div>
        </div>

        <div class="boss-hp-bar">
          <div class="boss-hp-fill" id="boss-hp-fill" style="width: ${this.bossHp}%;"></div>
        </div>

        <div class="question-card" style="margin-top: 14px; background: rgba(12, 16, 36, 0.9);">
          <div style="font-size: 0.85rem; color: var(--secondary); font-family: var(--font-mono); margin-bottom: 8px;">
            ${phase.challenge || 'Synthesis Confrontation'}
          </div>
          <h3 class="question-text" style="font-size: 1.25rem;">${phase.question}</h3>
          <div class="options-grid" style="margin-top: 20px;">
            ${optionsHtml}
          </div>
        </div>
      </div>
    `;

    this._bindPhaseEvents(phase);
  }

  _bindPhaseEvents(phase) {
    const btns = this.container.querySelectorAll('.boss-option-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.style.pointerEvents = 'none');
        const val = btn.dataset.val;
        const isCorrect = val === phase.correctAnswer;

        if (isCorrect) {
          btn.classList.add('correct');
          this.audioEffects.playBossHit();
          this.audioEffects.playCorrect();

          // Deduct Boss HP
          this.bossHp = Math.max(0, this.bossHp - (phase.damage || 35));
          const hpFill = this.container.querySelector('#boss-hp-fill');
          const hpText = this.container.querySelector('#boss-hp-text');
          if (hpFill) hpFill.style.width = `${this.bossHp}%`;
          if (hpText) hpText.textContent = `HP: ${this.bossHp}%`;

          // Screen shake effect
          const arena = this.container.querySelector('#boss-arena');
          if (arena) {
            arena.style.transform = 'translate(-3px, 2px)';
            setTimeout(() => arena.style.transform = 'translate(0, 0)', 150);
          }

          setTimeout(() => {
            this.currentPhaseIndex++;
            this._renderPhase();
          }, 1000);
        } else {
          btn.classList.add('wrong');
          this.audioEffects.playWrong();
          setTimeout(() => {
            btns.forEach(b => b.style.pointerEvents = 'auto');
            btn.classList.remove('wrong');
          }, 1200);
        }
      });
    });
  }

  _renderVictory() {
    this.gameState.unlockBadge('b_boss_slayer');
    this.gameState.addXp(250, 'Defeated Concept Sentinel Boss');
    this.audioEffects.playLevelUp();

    this.container.innerHTML = `
      <div class="glass-panel highlight" style="text-align: center; padding: 48px 24px; animation: fadeIn 0.4s ease;">
        <div style="font-size: 3.5rem; margin-bottom: 16px;">👑</div>
        <h2 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #ffffff; margin-bottom: 8px;">
          SENTINEL DEFEATED!
        </h2>
        <p style="color: var(--emerald-success); font-weight: 700; font-size: 1.1rem; margin-bottom: 20px;">
          +250 XP Awarded • Concept Boss Trial Conquered
        </p>
        <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 32px;">
          You successfully synthesized all academic concepts across all phases with zero remaining misconceptions.
        </p>
        <button class="btn btn-primary btn-lg" id="btn-boss-return">
          <span>Return to Dashboard</span>
          <span>→</span>
        </button>
      </div>
    `;

    const returnBtn = this.container.querySelector('#btn-boss-return');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        if (typeof this.onComplete === 'function') {
          this.onComplete();
        }
      });
    }
  }

  destroy() {}
}

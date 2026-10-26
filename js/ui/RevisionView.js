/**
 * RevisionView.js
 * Targeted practice arena focusing specifically on concepts needing revision and remediation.
 */

export class RevisionView {
  constructor(container, adaptiveEngine, onStartPractice) {
    this.container = container;
    this.adaptiveEngine = adaptiveEngine;
    this.onStartPractice = onStartPractice;
  }

  render() {
    const revisionConcepts = this.adaptiveEngine.getRevisionQueue();

    const conceptsHtml = revisionConcepts.length > 0 ? revisionConcepts.map(c => `
      <div class="glass-panel" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-bottom: 14px; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 260px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <span class="concept-badge" style="background: rgba(255, 51, 102, 0.15); border-color: var(--rose-danger); color: var(--rose-danger);">
              Needs Reinforcement
            </span>
            <span style="font-size: 0.8rem; color: var(--text-secondary); text-transform: capitalize;">
              Difficulty: ${c.currentDifficulty}
            </span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: #ffffff; margin-bottom: 4px;">
            ${c.name}
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5;">
            ${c.summary}
          </p>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">
            History: ${c.correctAnswers} correct / ${c.attempts} attempts • Current Mastery: ${c.currentMasteryScore}%
          </div>
        </div>

        <div>
          <button class="btn btn-primary btn-sm btn-practice-concept" data-concept-id="${c.id}">
            <span>🎯 Practice Now</span>
          </button>
        </div>
      </div>
    `).join('') : `
      <div class="glass-panel" style="text-align: center; padding: 48px 24px;">
        <div style="font-size: 3rem; margin-bottom: 14px;">✨</div>
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">
          All Concepts Reinforced!
        </h2>
        <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 20px;">
          You currently have zero active misconceptions. Every concept tested has attained solid comprehension.
        </p>
      </div>
    `;

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h1 style="font-family: var(--font-display); font-size: 1.85rem; font-weight: 800; color: #ffffff; margin-bottom: 4px;">
              🔄 Revision Arena &amp; Weak Concept Reinforcement
            </h1>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">
              Target and conquer concepts where errors occurred during your previous learning sessions.
            </p>
          </div>
        </div>

        <div id="revision-list-container">
          ${conceptsHtml}
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const btns = this.container.querySelectorAll('.btn-practice-concept');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const conceptId = btn.dataset.conceptId;
        const concept = this.adaptiveEngine.concepts.get(conceptId);
        if (concept && typeof this.onStartPractice === 'function') {
          this.onStartPractice(concept);
        }
      });
    });
  }
}

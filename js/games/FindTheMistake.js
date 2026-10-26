/**
 * FindTheMistake.js
 * Conceptual bug-hunting mini-game where the student pinpoints the erroneous segment in an academic claim.
 */

export class FindTheMistake {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.selectedIndex = null;
    this.question = null;
  }

  render(question) {
    this.question = question;
    this.selectedIndex = null;

    const segments = question.segments || [
      'According to the principle,',
      'the total force diminishes to zero during motion,',
      'ensuring conservation throughout.'
    ];

    const spansHtml = segments.map((seg, idx) => `
      <span class="mistake-span" data-index="${idx}" id="seg-${idx}">
        ${seg}
      </span>
    `).join(' ');

    this.container.innerHTML = `
      <div class="question-card" id="find-mistake-card">
        <div style="font-size: 0.85rem; color: var(--rose-danger); font-family: var(--font-mono); margin-bottom: 12px; text-transform: uppercase;">
          🔍 Spot the Academic Misconception
        </div>
        <h2 class="question-text" style="font-size: 1.25rem; margin-bottom: 24px;">
          ${question.prompt || 'One segment in this statement contains a factual error. Click the faulty segment:'}
        </h2>

        <div class="mistake-container" style="padding: 24px; background: rgba(0, 0, 0, 0.3); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          ${spansHtml}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px;">
          <button class="btn btn-secondary btn-sm" id="btn-mistake-hint">
            <span>💡</span>
            <span>Get Hint</span>
          </button>
          <button class="btn btn-primary" id="btn-mistake-submit" disabled>
            <span>Confirm Selection</span>
            <span>→</span>
          </button>
        </div>
        <div id="mistake-hint-panel" style="display: none; margin-top: 16px; padding: 12px 16px; background: rgba(0, 240, 255, 0.08); border-left: 3px solid var(--secondary); border-radius: 6px; font-size: 0.9rem; color: var(--secondary);"></div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const spans = this.container.querySelectorAll('.mistake-span');
    const submitBtn = this.container.querySelector('#btn-mistake-submit');
    const hintBtn = this.container.querySelector('#btn-mistake-hint');
    const hintPanel = this.container.querySelector('#mistake-hint-panel');

    spans.forEach(span => {
      span.addEventListener('click', () => {
        spans.forEach(s => s.classList.remove('selected'));
        span.classList.add('selected');
        this.selectedIndex = parseInt(span.dataset.index, 10);
        submitBtn.removeAttribute('disabled');
      });
    });

    submitBtn.addEventListener('click', () => {
      if (this.selectedIndex !== null && typeof this.onSubmit === 'function') {
        submitBtn.setAttribute('disabled', 'true');
        this.onSubmit(this.selectedIndex);
      }
    });

    hintBtn.addEventListener('click', () => {
      if (hintPanel) {
        hintPanel.style.display = 'block';
        hintPanel.textContent = this.question.hint || 'Check for inverted relationships or swapped definitions.';
      }
    });
  }

  showResult(isCorrect, faultyIndex) {
    const spans = this.container.querySelectorAll('.mistake-span');
    spans.forEach(span => {
      span.style.pointerEvents = 'none';
      const idx = parseInt(span.dataset.index, 10);
      if (idx === faultyIndex) {
        span.style.background = 'rgba(255, 51, 102, 0.25)';
        span.style.borderColor = 'var(--rose-danger)';
        span.style.color = '#ffffff';
      }
    });
  }

  destroy() {}
}

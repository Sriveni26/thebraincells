/**
 * MatchMaster.js
 * Interactive two-column connector matching academic terms to definitions.
 */

export class MatchMaster {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.selectedLeft = null;
    this.userMatches = new Map(); // term => match
    this.question = null;
  }

  render(question) {
    this.question = question;
    this.selectedLeft = null;
    this.userMatches.clear();

    const pairs = question.pairs || [
      { term: 'Term A', match: 'Definition A' },
      { term: 'Term B', match: 'Definition B' },
      { term: 'Term C', match: 'Definition C' }
    ];

    const leftTerms = pairs.map(p => p.term);
    const rightMatches = pairs.map(p => p.match).sort(() => Math.random() - 0.5);

    const leftHtml = leftTerms.map((t, idx) => `
      <div class="match-item match-left" data-term="${t.replace(/"/g, '&quot;')}" id="match-l-${idx}">
        <span>${t}</span>
        <span class="match-indicator">⚪</span>
      </div>
    `).join('');

    const rightHtml = rightMatches.map((m, idx) => `
      <div class="match-item match-right" data-match="${m.replace(/"/g, '&quot;')}" id="match-r-${idx}">
        <span>${m}</span>
        <span class="match-indicator">⚪</span>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="question-card" id="match-master-card">
        <div style="font-size: 0.85rem; color: var(--secondary); font-family: var(--font-mono); margin-bottom: 12px; text-transform: uppercase;">
          🔗 Match Master: Pair Terms with Definitions
        </div>
        <h2 class="question-text" style="font-size: 1.25rem;">${question.prompt || 'Connect each academic term to its corresponding definition:'}</h2>

        <div class="match-grid" style="margin-top: 20px;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Terms</div>
            ${leftHtml}
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Definitions</div>
            ${rightHtml}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px;">
          <button class="btn btn-secondary btn-sm" id="btn-match-reset">Reset Connections</button>
          <button class="btn btn-primary" id="btn-match-submit" disabled>
            <span>Verify Matches</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const leftItems = this.container.querySelectorAll('.match-left');
    const rightItems = this.container.querySelectorAll('.match-right');
    const submitBtn = this.container.querySelector('#btn-match-submit');
    const resetBtn = this.container.querySelector('#btn-match-reset');

    leftItems.forEach(left => {
      left.addEventListener('click', () => {
        if (left.classList.contains('matched')) return;
        leftItems.forEach(l => l.classList.remove('selected'));
        left.classList.add('selected');
        this.selectedLeft = left.dataset.term;
      });
    });

    rightItems.forEach(right => {
      right.addEventListener('click', () => {
        if (!this.selectedLeft || right.classList.contains('matched')) return;
        const matchedTerm = this.selectedLeft;
        const matchedDefinition = right.dataset.match;

        this.userMatches.set(matchedTerm, matchedDefinition);

        // Highlight visually
        const leftEl = Array.from(leftItems).find(l => l.dataset.term === matchedTerm);
        if (leftEl) {
          leftEl.classList.remove('selected');
          leftEl.classList.add('matched');
          leftEl.querySelector('.match-indicator').textContent = '🟢';
        }
        right.classList.add('matched');
        right.querySelector('.match-indicator').textContent = '🟢';

        this.selectedLeft = null;

        // Check if all pairs matched
        const requiredCount = (this.question.pairs || []).length;
        if (this.userMatches.size >= requiredCount) {
          submitBtn.removeAttribute('disabled');
        }
      });
    });

    resetBtn.addEventListener('click', () => {
      this.userMatches.clear();
      this.selectedLeft = null;
      leftItems.forEach(l => {
        l.classList.remove('selected', 'matched');
        l.querySelector('.match-indicator').textContent = '⚪';
      });
      rightItems.forEach(r => {
        r.classList.remove('selected', 'matched');
        r.querySelector('.match-indicator').textContent = '⚪';
      });
      submitBtn.setAttribute('disabled', 'true');
    });

    submitBtn.addEventListener('click', () => {
      const matchArray = Array.from(this.userMatches.entries()).map(([term, match]) => ({ term, match }));
      if (typeof this.onSubmit === 'function') {
        submitBtn.setAttribute('disabled', 'true');
        this.onSubmit(matchArray);
      }
    });
  }

  showResult(isCorrect) {
    const card = this.container.querySelector('#match-master-card');
    if (isCorrect) {
      card.style.borderColor = 'var(--emerald-success)';
    } else {
      card.style.borderColor = 'var(--rose-danger)';
    }
  }

  destroy() {}
}

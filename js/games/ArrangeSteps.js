/**
 * ArrangeSteps.js
 * Sequential process and step-reordering challenge mini-game.
 */

export class ArrangeSteps {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.question = null;
    this.currentSteps = [];
  }

  render(question) {
    this.question = question;
    const rawSteps = question.steps || [
      'Step 1: Initiation and binding',
      'Step 2: Elongation and synthesis',
      'Step 3: Termination and release'
    ];

    // Initialize with shuffled order
    this.currentSteps = [...rawSteps].sort(() => Math.random() - 0.5);
    this._renderStepList();
  }

  _renderStepList() {
    const listHtml = this.currentSteps.map((step, idx) => `
      <div class="match-item step-item" data-index="${idx}" style="cursor: default; padding: 14px 18px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="option-letter" style="background: var(--primary-soft); color: var(--primary-light);">${idx + 1}</span>
          <span style="font-weight: 600; color: #ffffff;">${step}</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm btn-move-up" data-index="${idx}" ${idx === 0 ? 'disabled style="opacity: 0.3;"' : ''}>▲</button>
          <button class="btn btn-secondary btn-sm btn-move-down" data-index="${idx}" ${idx === this.currentSteps.length - 1 ? 'disabled style="opacity: 0.3;"' : ''}>▼</button>
        </div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="question-card" id="arrange-steps-card">
        <div style="font-size: 0.85rem; color: var(--secondary); font-family: var(--font-mono); margin-bottom: 12px; text-transform: uppercase;">
          🔢 Arrange Steps: Chronological &amp; Algorithmic Sequence
        </div>
        <h2 class="question-text" style="font-size: 1.25rem; margin-bottom: 20px;">
          ${this.question.prompt || 'Reorder these sequential steps into the correct chronological or operational order:'}
        </h2>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;" id="steps-container">
          ${listHtml}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Use ▲ and ▼ arrows to place steps in chronological order.</span>
          <button class="btn btn-primary" id="btn-steps-submit">
            <span>Verify Sequence</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const upBtns = this.container.querySelectorAll('.btn-move-up');
    const downBtns = this.container.querySelectorAll('.btn-move-down');
    const submitBtn = this.container.querySelector('#btn-steps-submit');

    upBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (idx > 0) {
          const temp = this.currentSteps[idx];
          this.currentSteps[idx] = this.currentSteps[idx - 1];
          this.currentSteps[idx - 1] = temp;
          this._renderStepList();
        }
      });
    });

    downBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (idx < this.currentSteps.length - 1) {
          const temp = this.currentSteps[idx];
          this.currentSteps[idx] = this.currentSteps[idx + 1];
          this.currentSteps[idx + 1] = temp;
          this._renderStepList();
        }
      });
    });

    submitBtn.addEventListener('click', () => {
      if (typeof this.onSubmit === 'function') {
        submitBtn.setAttribute('disabled', 'true');
        this.onSubmit(this.currentSteps);
      }
    });
  }

  showResult(isCorrect) {
    const card = this.container.querySelector('#arrange-steps-card');
    if (card) {
      card.style.borderColor = isCorrect ? 'var(--emerald-success)' : 'var(--rose-danger)';
    }
  }

  destroy() {}
}

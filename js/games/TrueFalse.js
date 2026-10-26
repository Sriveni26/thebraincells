/**
 * TrueFalse.js
 * High-impact statement verification mini-game with dual action cards and keyboard support.
 */

export class TrueFalse {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.question = null;
  }

  render(question) {
    this.question = question;

    this.container.innerHTML = `
      <div class="question-card" id="tf-card">
        <div style="font-size: 0.85rem; color: var(--secondary); font-family: var(--font-mono); margin-bottom: 12px; text-transform: uppercase;">
          ⚖️ True or False: Academic Verification
        </div>
        <h2 class="question-text" style="margin-bottom: 32px;">${question.prompt}</h2>

        <div class="tf-grid">
          <button class="tf-btn true" id="btn-tf-true" data-val="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--emerald-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--emerald-success);">TRUE (T)</span>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Statement is scientifically accurate</span>
          </button>

          <button class="tf-btn false" id="btn-tf-false" data-val="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--rose-danger)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--rose-danger);">FALSE (F)</span>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Statement contains a misconception</span>
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const trueBtn = this.container.querySelector('#btn-tf-true');
    const falseBtn = this.container.querySelector('#btn-tf-false');

    const handleChoice = (val) => {
      trueBtn.style.pointerEvents = 'none';
      falseBtn.style.pointerEvents = 'none';
      if (typeof this.onSubmit === 'function') {
        this.onSubmit(val);
      }
    };

    trueBtn.addEventListener('click', () => handleChoice(true));
    falseBtn.addEventListener('click', () => handleChoice(false));

    this._keyHandler = (e) => {
      if (e.key.toLowerCase() === 't') trueBtn.click();
      if (e.key.toLowerCase() === 'f') falseBtn.click();
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  showResult(isCorrect, expectedTrue) {
    window.removeEventListener('keydown', this._keyHandler);
    const trueBtn = this.container.querySelector('#btn-tf-true');
    const falseBtn = this.container.querySelector('#btn-tf-false');

    if (expectedTrue) {
      trueBtn.style.borderColor = 'var(--emerald-success)';
      trueBtn.style.background = 'rgba(0, 230, 118, 0.2)';
    } else {
      falseBtn.style.borderColor = 'var(--emerald-success)';
      falseBtn.style.background = 'rgba(0, 230, 118, 0.2)';
    }
  }

  destroy() {
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
    }
  }
}

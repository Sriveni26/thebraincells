/**
 * ShortAnswer.js
 * Active recall challenge where students formulate and type the academic term or phrase directly.
 */

export class ShortAnswer {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.question = null;
  }

  render(question) {
    this.question = question;

    this.container.innerHTML = `
      <div class="question-card" id="short-answer-card">
        <div style="font-size: 0.85rem; color: var(--secondary); font-family: var(--font-mono); margin-bottom: 12px; text-transform: uppercase;">
          ✍️ Active Recall: Formulate Concept Answer
        </div>
        <h2 class="question-text">${question.prompt}</h2>

        <div class="form-group" style="margin-top: 24px;">
          <input type="text" id="short-answer-input" class="input-text" placeholder="Type your academic response here..." autocomplete="off" style="font-size: 1.1rem; padding: 16px;">
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px;">
          <button class="btn btn-secondary btn-sm" id="btn-short-hint">
            <span>💡</span>
            <span>Get Hint</span>
          </button>
          <button class="btn btn-primary" id="btn-short-submit" disabled>
            <span>Submit Response</span>
            <span>→</span>
          </button>
        </div>
        <div id="short-hint-panel" style="display: none; margin-top: 16px; padding: 12px 16px; background: rgba(0, 240, 255, 0.08); border-left: 3px solid var(--secondary); border-radius: 6px; font-size: 0.9rem; color: var(--secondary);"></div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const input = this.container.querySelector('#short-answer-input');
    const submitBtn = this.container.querySelector('#btn-short-submit');
    const hintBtn = this.container.querySelector('#btn-short-hint');
    const hintPanel = this.container.querySelector('#short-hint-panel');

    input.addEventListener('input', () => {
      const val = input.value.trim();
      if (val.length > 0) submitBtn.removeAttribute('disabled');
      else submitBtn.setAttribute('disabled', 'true');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !submitBtn.disabled) {
        submitBtn.click();
      }
    });

    submitBtn.addEventListener('click', () => {
      const val = input.value.trim();
      if (val && typeof this.onSubmit === 'function') {
        submitBtn.setAttribute('disabled', 'true');
        input.setAttribute('disabled', 'true');
        this.onSubmit(val);
      }
    });

    hintBtn.addEventListener('click', () => {
      if (hintPanel) {
        hintPanel.style.display = 'block';
        hintPanel.textContent = this.question.hint || 'Think of the standard academic nomenclature.';
      }
    });
  }

  showResult(isCorrect, correctAnswer) {
    const input = this.container.querySelector('#short-answer-input');
    if (isCorrect) {
      input.style.borderColor = 'var(--emerald-success)';
      input.style.background = 'rgba(0, 230, 118, 0.15)';
    } else {
      input.style.borderColor = 'var(--rose-danger)';
      input.style.background = 'rgba(255, 51, 102, 0.15)';
    }
  }

  destroy() {}
}

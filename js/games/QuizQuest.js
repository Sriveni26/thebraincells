/**
 * QuizQuest.js
 * Multiple choice question handler with keyboard shortcuts (A, B, C, D) and option highlight states.
 */

export class QuizQuest {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.selectedOption = null;
    this.question = null;
  }

  render(question) {
    this.question = question;
    this.selectedOption = null;

    const letters = ['A', 'B', 'C', 'D'];
    const optionsHtml = (question.options || []).map((opt, idx) => `
      <button class="option-btn" data-value="${opt.replace(/"/g, '&quot;')}" data-letter="${letters[idx]}">
        <span class="option-letter">${letters[idx]}</span>
        <span class="option-text">${opt}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="question-card" id="quiz-quest-card">
        <h2 class="question-text">${question.prompt}</h2>
        <div class="options-grid" id="quiz-options-grid">
          ${optionsHtml}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px;">
          <button class="btn btn-secondary btn-sm" id="btn-quiz-hint">
            <span>💡</span>
            <span>Get Hint</span>
          </button>
          <button class="btn btn-primary" id="btn-quiz-submit" disabled>
            <span>Submit Answer</span>
            <span>→</span>
          </button>
        </div>
        <div id="quiz-hint-panel" style="display: none; margin-top: 16px; padding: 12px 16px; background: rgba(0, 240, 255, 0.08); border-left: 3px solid var(--secondary); border-radius: 6px; font-size: 0.9rem; color: var(--secondary);"></div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const optionBtns = this.container.querySelectorAll('.option-btn');
    const submitBtn = this.container.querySelector('#btn-quiz-submit');
    const hintBtn = this.container.querySelector('#btn-quiz-hint');
    const hintPanel = this.container.querySelector('#quiz-hint-panel');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        optionBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedOption = btn.dataset.value;
        submitBtn.removeAttribute('disabled');
      });
    });

    submitBtn.addEventListener('click', () => {
      if (this.selectedOption && typeof this.onSubmit === 'function') {
        submitBtn.setAttribute('disabled', 'true');
        this.onSubmit(this.selectedOption);
      }
    });

    hintBtn.addEventListener('click', () => {
      if (hintPanel) {
        hintPanel.style.display = 'block';
        hintPanel.textContent = this.question.hint || 'Carefully re-read the academic prompt for subtle clues.';
      }
    });

    // Keyboard navigation (A, B, C, D and Enter)
    this._keyHandler = (e) => {
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const btn = this.container.querySelector(`.option-btn[data-letter="${key}"]`);
        if (btn) btn.click();
      } else if (e.key === 'Enter' && this.selectedOption && !submitBtn.disabled) {
        submitBtn.click();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  showResult(isCorrect, correctAnswer) {
    window.removeEventListener('keydown', this._keyHandler);
    const optionBtns = this.container.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      btn.style.pointerEvents = 'none';
      if (btn.dataset.value === correctAnswer) {
        btn.classList.add('correct');
      } else if (btn.dataset.value === this.selectedOption && !isCorrect) {
        btn.classList.add('wrong');
      }
    });
  }

  destroy() {
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
    }
  }
}

/**
 * FillTheGap.js
 * Interactive cloze deletion mini-game with interactive word bank chips.
 */

export class FillTheGap {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.selectedWord = null;
    this.question = null;
  }

  render(question) {
    this.question = question;
    this.selectedWord = null;

    const words = [...(question.wordBank || [question.targetWord || 'term', 'concept', 'factor', 'variable'])];
    // Shuffle words
    words.sort(() => Math.random() - 0.5);

    const wordChipsHtml = words.map(w => `
      <div class="word-chip" data-word="${w.replace(/"/g, '&quot;')}">${w}</div>
    `).join('');

    this.container.innerHTML = `
      <div class="question-card" id="fill-gap-card">
        <div style="font-size: 0.85rem; color: var(--secondary); font-family: var(--font-mono); margin-bottom: 12px; text-transform: uppercase;">
          🧩 Fill-The-Gap Challenge
        </div>
        <div class="fill-gap-sentence">
          <span>${question.sentenceBefore || 'The principle states that'}</span>
          <span class="gap-slot" id="gap-target" title="Click to clear filled word">[ Tap Word Below ]</span>
          <span>${question.sentenceAfter || 'under steady conditions.'}</span>
        </div>

        <div style="margin-top: 24px;">
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 8px;">WORD BANK:</div>
          <div class="word-bank" id="word-bank-container">
            ${wordChipsHtml}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px;">
          <button class="btn btn-secondary btn-sm" id="btn-gap-hint">
            <span>💡</span>
            <span>Get Hint</span>
          </button>
          <button class="btn btn-primary" id="btn-gap-submit" disabled>
            <span>Submit Word</span>
            <span>→</span>
          </button>
        </div>
        <div id="gap-hint-panel" style="display: none; margin-top: 16px; padding: 12px 16px; background: rgba(0, 240, 255, 0.08); border-left: 3px solid var(--secondary); border-radius: 6px; font-size: 0.9rem; color: var(--secondary);"></div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const gapTarget = this.container.querySelector('#gap-target');
    const wordChips = this.container.querySelectorAll('.word-chip');
    const submitBtn = this.container.querySelector('#btn-gap-submit');
    const hintBtn = this.container.querySelector('#btn-gap-hint');
    const hintPanel = this.container.querySelector('#gap-hint-panel');

    wordChips.forEach(chip => {
      chip.addEventListener('click', () => {
        wordChips.forEach(c => c.classList.remove('used'));
        chip.classList.add('used');
        this.selectedWord = chip.dataset.word;
        gapTarget.textContent = this.selectedWord;
        gapTarget.classList.add('filled');
        submitBtn.removeAttribute('disabled');
      });
    });

    gapTarget.addEventListener('click', () => {
      if (this.selectedWord) {
        gapTarget.textContent = '[ Tap Word Below ]';
        gapTarget.classList.remove('filled');
        wordChips.forEach(c => c.classList.remove('used'));
        this.selectedWord = null;
        submitBtn.setAttribute('disabled', 'true');
      }
    });

    submitBtn.addEventListener('click', () => {
      if (this.selectedWord && typeof this.onSubmit === 'function') {
        submitBtn.setAttribute('disabled', 'true');
        this.onSubmit(this.selectedWord);
      }
    });

    hintBtn.addEventListener('click', () => {
      if (hintPanel) {
        hintPanel.style.display = 'block';
        hintPanel.textContent = this.question.hint || 'Review the surrounding academic context to identify the missing term.';
      }
    });
  }

  showResult(isCorrect, correctAnswer) {
    const gapTarget = this.container.querySelector('#gap-target');
    if (isCorrect) {
      gapTarget.style.borderColor = 'var(--emerald-success)';
      gapTarget.style.background = 'rgba(0, 230, 118, 0.2)';
    } else {
      gapTarget.style.borderColor = 'var(--rose-danger)';
      gapTarget.style.background = 'rgba(255, 51, 102, 0.2)';
      gapTarget.textContent = `${this.selectedWord} ➔ Correct: ${correctAnswer}`;
    }
  }

  destroy() {}
}

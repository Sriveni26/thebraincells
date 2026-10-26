/**
 * BeatTheClock.js
 * Adrenaline timed rush mode with animated countdown bar, combo multiplier rewards, and optional untimed mode.
 */

export class BeatTheClock {
  constructor(container, onSubmit, audioEffects) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.audioEffects = audioEffects;
    this.question = null;
    this.timerSeconds = 15;
    this.remainingSeconds = 15;
    this.timerInterval = null;
    this.isUntimed = false;
    this.selectedOption = null;
    this.startTime = 0;
  }

  render(question) {
    this.question = question;
    this.remainingSeconds = 15;
    this.selectedOption = null;
    this.startTime = Date.now();

    const letters = ['A', 'B', 'C', 'D'];
    const optionsHtml = (question.options || []).map((opt, idx) => `
      <button class="option-btn btc-option-btn" data-value="${opt.replace(/"/g, '&quot;')}" data-letter="${letters[idx]}">
        <span class="option-letter">${letters[idx]}</span>
        <span>${opt}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="question-card" id="btc-card" style="border-color: rgba(255, 94, 54, 0.4);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-size: 0.85rem; color: var(--flame-streak); font-family: var(--font-mono); text-transform: uppercase;">
            ⏱️ Beat The Clock • Rapid Evaluation
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="btn btn-secondary btn-sm" id="btn-toggle-timer" style="padding: 4px 10px; font-size: 0.75rem;">
              <span>🕒 Untimed Mode</span>
            </button>
            <div style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; color: var(--flame-streak);" id="btc-timer-text">
              15s
            </div>
          </div>
        </div>

        <!-- Animated Countdown Bar -->
        <div class="progress-track" id="btc-timer-track" style="height: 10px; margin-bottom: 24px; background: rgba(255, 255, 255, 0.08);">
          <div class="progress-fill" id="btc-timer-fill" style="width: 100%; background: linear-gradient(90deg, #ff9100, #ff3366); transition: width 1s linear;"></div>
        </div>

        <h2 class="question-text">${question.prompt}</h2>

        <div class="options-grid" style="margin-top: 20px;">
          ${optionsHtml}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
          <span style="font-size: 0.8rem; color: var(--text-secondary);" id="btc-multiplier-hint">
            ⚡ Quick Answer Bonus: Answer in &lt;5s for 2× XP Multiplier!
          </span>
          <button class="btn btn-primary" id="btn-btc-submit" disabled>
            <span>Submit Answer</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
    this._startTimer();
  }

  _startTimer() {
    this._clearTimer();
    if (this.isUntimed) {
      const track = this.container.querySelector('#btc-timer-track');
      const text = this.container.querySelector('#btc-timer-text');
      if (track) track.style.display = 'none';
      if (text) text.textContent = 'Untimed';
      return;
    }

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      const text = this.container.querySelector('#btc-timer-text');
      const fill = this.container.querySelector('#btc-timer-fill');

      if (text) text.textContent = `${this.remainingSeconds}s`;
      if (fill) fill.style.width = `${(this.remainingSeconds / this.timerSeconds) * 100}%`;

      if (this.remainingSeconds <= 3 && this.audioEffects) {
        this.audioEffects.playStreak();
      }

      if (this.remainingSeconds <= 0) {
        this._clearTimer();
        this._handleTimeout();
      }
    }, 1000);
  }

  _clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  _handleTimeout() {
    const text = this.container.querySelector('#btc-timer-text');
    if (text) text.textContent = 'Time Up!';
    if (typeof this.onSubmit === 'function') {
      this.onSubmit(this.selectedOption || '__TIMEOUT__');
    }
  }

  _bindEvents() {
    const btns = this.container.querySelectorAll('.btc-option-btn');
    const submitBtn = this.container.querySelector('#btn-btc-submit');
    const toggleTimerBtn = this.container.querySelector('#btn-toggle-timer');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedOption = btn.dataset.value;
        submitBtn.removeAttribute('disabled');
      });
    });

    submitBtn.addEventListener('click', () => {
      this._clearTimer();
      if (typeof this.onSubmit === 'function') {
        submitBtn.setAttribute('disabled', 'true');
        this.onSubmit(this.selectedOption);
      }
    });

    toggleTimerBtn.addEventListener('click', () => {
      this.isUntimed = !this.isUntimed;
      toggleTimerBtn.innerHTML = this.isUntimed ? '<span>⏱️ Timed Mode</span>' : '<span>🕒 Untimed Mode</span>';
      this._startTimer();
    });
  }

  showResult(isCorrect, correctAnswer) {
    this._clearTimer();
    const btns = this.container.querySelectorAll('.btc-option-btn');
    btns.forEach(btn => {
      btn.style.pointerEvents = 'none';
      if (btn.dataset.value === correctAnswer) {
        btn.classList.add('correct');
      } else if (btn.dataset.value === this.selectedOption && !isCorrect) {
        btn.classList.add('wrong');
      }
    });
  }

  destroy() {
    this._clearTimer();
  }
}

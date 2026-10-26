/**
 * GameView.js
 * Comprehensive host router rendering all interactive game modes, difficulty badges, and feedback transitions.
 */

import { QuizQuest } from '../games/QuizQuest.js';
import { FillTheGap } from '../games/FillTheGap.js';
import { MatchMaster } from '../games/MatchMaster.js';
import { TrueFalse } from '../games/TrueFalse.js';
import { FindTheMistake } from '../games/FindTheMistake.js';
import { MemoryMatch } from '../games/MemoryMatch.js';
import { BeatTheClock } from '../games/BeatTheClock.js';
import { ArrangeSteps } from '../games/ArrangeSteps.js';
import { ShortAnswer } from '../games/ShortAnswer.js';

export class GameView {
  constructor(container, adaptiveEngine) {
    this.container = container;
    this.adaptiveEngine = adaptiveEngine;
    this.activeSubGame = null;
    this.currentQuestion = null;
  }

  render(question, progress) {
    this.currentQuestion = question;
    if (this.activeSubGame && typeof this.activeSubGame.destroy === 'function') {
      this.activeSubGame.destroy();
    }

    const diffClass = (question.difficulty || 'beginner').toLowerCase().replace(/\s+/g, '_');
    const xpReward = question.xpReward || 100;

    this.container.innerHTML = `
      <div class="game-viewport">
        <!-- Question Header Card -->
        <div class="question-header-card">
          <div class="question-concept-info">
            <span class="concept-badge">${question.conceptName || 'Core Concept'}</span>
            <span class="difficulty-pill ${diffClass}">
              <span>●</span>
              <span style="text-transform: capitalize;">${question.difficulty || 'Level 1: Beginner'}</span>
            </span>
          </div>

          <!-- Progress Track -->
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="stat-chip xp" style="padding: 2px 10px; font-size: 0.75rem;">
              <span>+${xpReward} XP</span>
            </div>
            <div class="game-progress-wrap">
              <div class="progress-track">
                <div class="progress-fill" style="width: ${progress?.percent || 20}%;"></div>
              </div>
              <span class="progress-counter">${progress?.current || 1}/${progress?.total || 5}</span>
            </div>
          </div>
        </div>

        <!-- Sub-Game Container Slot -->
        <div id="sub-game-mount-slot"></div>

        <!-- Feedback & Continuation Panel (Hidden initially) -->
        <div id="game-feedback-panel" style="display: none; padding: 24px; background: rgba(15, 19, 38, 0.95); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); margin-top: 20px; animation: fadeIn 0.3s ease;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div style="flex: 1;">
              <div id="feedback-title" style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;"></div>
              <p id="feedback-explanation" style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;"></p>
            </div>
            <div style="display: flex; gap: 10px; align-self: center;">
              <button class="btn btn-primary btn-lg" id="btn-next-question">
                <span>Continue Challenge</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this._mountSubGame(question);
  }

  _mountSubGame(question) {
    const slot = this.container.querySelector('#sub-game-mount-slot');
    if (!slot) return;

    const handleSubmit = async (answer) => {
      const evaluation = await this.adaptiveEngine.submitAnswer(answer);
      this._handleAnswerEvaluation(evaluation, question);
    };

    switch (question.type) {
      case 'gap':
        this.activeSubGame = new FillTheGap(slot, handleSubmit);
        break;
      case 'match':
        this.activeSubGame = new MatchMaster(slot, handleSubmit);
        break;
      case 'truefalse':
        this.activeSubGame = new TrueFalse(slot, handleSubmit);
        break;
      case 'mistake':
        this.activeSubGame = new FindTheMistake(slot, handleSubmit);
        break;
      case 'memory':
        this.activeSubGame = new MemoryMatch(slot, handleSubmit, this.adaptiveEngine.audioEffects);
        break;
      case 'clock':
        this.activeSubGame = new BeatTheClock(slot, handleSubmit, this.adaptiveEngine.audioEffects);
        break;
      case 'steps':
        this.activeSubGame = new ArrangeSteps(slot, handleSubmit);
        break;
      case 'short':
        this.activeSubGame = new ShortAnswer(slot, handleSubmit);
        break;
      case 'quiz':
      default:
        this.activeSubGame = new QuizQuest(slot, handleSubmit);
        break;
    }

    this.activeSubGame.render(question);
  }

  _handleAnswerEvaluation(evaluation, question) {
    if (this.activeSubGame && typeof this.activeSubGame.showResult === 'function') {
      this.activeSubGame.showResult(
        evaluation.isCorrect, 
        question.correctAnswer ?? question.targetWord ?? question.isTrue ?? question.faultyIndex
      );
    }

    const panel = this.container.querySelector('#game-feedback-panel');
    const titleEl = this.container.querySelector('#feedback-title');
    const expEl = this.container.querySelector('#feedback-explanation');
    const nextBtn = this.container.querySelector('#btn-next-question');

    if (panel && titleEl && expEl) {
      panel.style.display = 'block';

      if (evaluation.isCorrect) {
        titleEl.textContent = `🎉 Correct! +${evaluation.xpGained} XP • Promoted to ${evaluation.nextDifficulty}`;
        titleEl.style.color = 'var(--emerald-success)';
        panel.style.borderColor = 'rgba(0, 230, 118, 0.4)';
        expEl.textContent = evaluation.feedback;
      } else {
        titleEl.textContent = `💡 Concept Learning Loop Triggered`;
        titleEl.style.color = 'var(--secondary)';
        panel.style.borderColor = 'rgba(0, 240, 255, 0.4)';
        expEl.textContent = `${evaluation.feedback} The AI Tutor below has prepared a simplified explanation and an alternative question pattern!`;
      }

      nextBtn.onclick = () => {
        panel.style.display = 'none';
        this.adaptiveEngine.nextQuestion();
      };
    }
  }

  destroy() {
    if (this.activeSubGame && typeof this.activeSubGame.destroy === 'function') {
      this.activeSubGame.destroy();
    }
  }
}

/**
 * DashboardView.js
 * Comprehensive student dashboard displaying metrics, daily goals, spaced repetition schedule, concept mastery, and trophies.
 */

import { BADGES } from '../engine/GameState.js';

export class DashboardView {
  constructor(container, gameState, adaptiveEngine, onNavigate) {
    this.container = container;
    this.gameState = gameState;
    this.adaptiveEngine = adaptiveEngine;
    this.onNavigate = onNavigate;
  }

  render() {
    const summary = this.gameState.getSummary();
    const concepts = this.adaptiveEngine.getAllConcepts();
    const history = this.gameState.sessionHistory || [];

    // Daily Goal: 300 XP
    const dailyGoalTarget = 300;
    const dailyXp = summary.xp % 1000;
    const dailyProgress = Math.min(100, Math.round((dailyXp / dailyGoalTarget) * 100));

    // Concept Mastery Rows with Spaced Repetition Review Date
    const conceptsHtml = concepts.length > 0 ? concepts.map(c => {
      const score = c.currentMasteryScore || 0;
      let color = 'var(--primary)';
      if (score >= 80) color = 'var(--emerald-success)';
      else if (score >= 50) color = 'var(--secondary)';
      else if (score < 40) color = 'var(--rose-danger)';

      return `
        <div class="mastery-row">
          <div class="mastery-meta">
            <span style="color: #ffffff; font-weight: 700;">${c.name}</span>
            <span style="font-family: var(--font-mono); color: ${color};">${score}% Mastery</span>
          </div>
          <div class="mastery-bar">
            <div class="mastery-fill" style="width: ${score}%; background: ${color};"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
            <span>Current Tier: <strong style="color: var(--text-main);">${c.currentDifficulty}</strong></span>
            <span>Next Review: <strong style="color: var(--secondary);">${c.nextReviewDate || 'Tomorrow'}</strong></span>
            <span>${c.correctAnswers} / ${c.attempts} correct (${c.firstAttemptSuccess || 0} on 1st attempt)</span>
          </div>
        </div>
      `;
    }).join('') : `
      <div style="color: var(--text-secondary); text-align: center; padding: 24px;">
        No concepts analyzed yet. Start a study session to track topic-wise mastery!
      </div>
    `;

    // Badges Grid
    const badgesHtml = BADGES.map(b => {
      const isUnlocked = this.gameState.unlockedBadges.has(b.id);
      return `
        <div class="badge-card ${isUnlocked ? 'unlocked' : ''}" title="${b.desc}">
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-title">${b.title}</div>
          <span style="font-size: 0.7rem; color: ${isUnlocked ? 'var(--amber-xp)' : 'var(--text-muted)'};">
            ${isUnlocked ? '★ Unlocked' : 'Locked'}
          </span>
        </div>
      `;
    }).join('');

    // Session History
    const historyHtml = history.length > 0 ? history.slice(-5).reverse().map(h => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 8px;">
        <div>
          <div style="font-weight: 700; color: #ffffff;">${h.topic}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${h.subject} • ${new Date(h.date).toLocaleDateString()}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--amber-xp);">+${h.xpEarned} XP</div>
          <div style="font-size: 0.75rem; color: var(--emerald-success);">${h.accuracy}% Accuracy</div>
        </div>
      </div>
    `).join('') : `
      <div style="color: var(--text-secondary); font-size: 0.85rem; padding: 12px 0;">No completed sessions yet.</div>
    `;

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 28px;">
        <!-- Overview Banner -->
        <div class="glass-panel" style="padding: 28px; background: linear-gradient(135deg, rgba(20, 26, 60, 0.85) 0%, rgba(10, 13, 30, 0.85) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
            <div style="display: flex; align-items: center; gap: 18px;">
              <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #7c4dff, #00f0ff); display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 25px var(--primary-glow);">
                ${summary.rankIcon}
              </div>
              <div>
                <div style="font-size: 0.82rem; color: var(--secondary); font-family: var(--font-mono); text-transform: uppercase;">
                  Player Academic Rank
                </div>
                <h1 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: #ffffff;">
                  ${summary.rank}
                </h1>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                  Next tier: <strong style="color: var(--primary-light);">${summary.nextRank}</strong> (${summary.nextRankXp} XP)
                </div>
              </div>
            </div>

            <!-- Action Buttons in Banner -->
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" id="btn-dash-new-game">
                <span>➕ New Study Session</span>
              </button>
              <button class="btn btn-primary btn-sm" id="btn-dash-continue">
                <span>🎮 Continue Learning</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Metrics Grid & Daily Goal -->
        <div class="dashboard-grid">
          <div class="metric-card">
            <span class="metric-label">⚡ Total Experience</span>
            <div class="metric-value">${summary.xp.toLocaleString()} <span style="font-size: 1rem; color: var(--amber-xp);">XP</span></div>
            <span class="metric-trend">🪙 ${summary.coins} Academic Coins</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">🔥 Current Streak</span>
            <div class="metric-value">${summary.streak} <span style="font-size: 1rem; color: var(--flame-streak);">Streak</span></div>
            <span class="metric-trend" style="color: var(--text-secondary);">Best streak: ${summary.bestStreak}</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">🎯 Overall Accuracy</span>
            <div class="metric-value">${summary.overallAccuracy}%</div>
            <span class="metric-trend">${summary.totalCorrect} / ${summary.totalAttempts} correct answers</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">⭐ First-Attempt Accuracy</span>
            <div class="metric-value">${summary.firstAttemptAccuracy}%</div>
            <span class="metric-trend" style="color: var(--secondary);">Tested without retries</span>
          </div>
        </div>

        <!-- Daily Goal Tracker & Spaced Repetition -->
        <div class="glass-panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.2rem;">🎯</span>
              <span style="font-family: var(--font-display); font-weight: 700; color: #ffffff;">Daily Learning Goal</span>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--amber-xp);">${dailyProgress}% Completed</span>
          </div>
          <div class="progress-track" style="height: 10px; margin-bottom: 6px;">
            <div class="progress-fill" style="width: ${dailyProgress}%; background: linear-gradient(90deg, #ff9100, #00e676);"></div>
          </div>
          <span style="font-size: 0.78rem; color: var(--text-secondary);">Earn 300 XP today to complete your daily goal and unlock +150 XP bonus!</span>
        </div>

        <!-- Concept Mastery & Badges Two-Column -->
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: flex-start;">
          <!-- Left: Concept Mastery -->
          <div class="glass-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: #ffffff;">
                🧠 Topic-Wise Concept Mastery
              </h2>
              <span style="font-size: 0.78rem; color: var(--secondary); font-family: var(--font-mono);">
                Mastery Target: 80%+
              </span>
            </div>
            <div class="concept-mastery-list">
              ${conceptsHtml}
            </div>
          </div>

          <!-- Right: Badges Showcase & History -->
          <div class="glass-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: #ffffff;">
                🏆 Achievements &amp; Badges
              </h2>
              <span style="font-size: 0.78rem; color: var(--amber-xp); font-family: var(--font-mono);">
                ${summary.unlockedBadgesCount} / ${summary.totalBadgesCount} Unlocked
              </span>
            </div>
            <div class="badges-grid">
              ${badgesHtml}
            </div>

            <!-- Recent Sessions History -->
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-subtle);">
              <h3 style="font-size: 0.95rem; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Recent Study Sessions</h3>
              ${historyHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const newGameBtn = this.container.querySelector('#btn-dash-new-game');
    const continueBtn = this.container.querySelector('#btn-dash-continue');

    if (newGameBtn && typeof this.onNavigate === 'function') {
      newGameBtn.addEventListener('click', () => this.onNavigate('view-input'));
    }
    if (continueBtn && typeof this.onNavigate === 'function') {
      continueBtn.addEventListener('click', () => {
        if (this.adaptiveEngine.isSessionActive) {
          this.onNavigate('view-game');
        } else {
          this.onNavigate('view-input');
        }
      });
    }
  }
}

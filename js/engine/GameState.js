/**
 * GameState.js
 * Comprehensive gamification and progression state manager.
 * Tracks XP, coins, streaks, levels, player ranks, achievements, and session logs.
 */

export const PLAYER_RANKS = [
  { name: 'Beginner Learner', minXp: 0, icon: '🌱' },
  { name: 'Curious Explorer', minXp: 300, icon: '🧭' },
  { name: 'Knowledge Builder', minXp: 700, icon: '🧱' },
  { name: 'Smart Thinker', minXp: 1400, icon: '💡' },
  { name: 'Learning Champion', minXp: 2500, icon: '🏆' },
  { name: 'Academic Master', minXp: 4000, icon: '👑' }
];

export const BADGES = [
  { id: 'b_first_game', title: 'First Game Completed', icon: '🎮', desc: 'Finish your first learning session.' },
  { id: 'b_five_correct', title: 'Five Correct Answers', icon: '🎯', desc: 'Answer 5 questions correctly.' },
  { id: 'b_retry_champion', title: 'Retry Champion', icon: '🔄', desc: 'Master a concept on a retry attempt.' },
  { id: 'b_comeback_learner', title: 'Comeback Learner', icon: '💪', desc: 'Recover from an error with guidance.' },
  { id: 'b_difficulty_climber', title: 'Difficulty Climber', icon: '🧗', desc: 'Unlock an advanced difficulty challenge.' },
  { id: 'b_topic_master', title: 'Topic Master', icon: '🌟', desc: 'Attain 80%+ mastery across a whole topic.' },
  { id: 'b_three_streak', title: 'Three-Day Streak', icon: '🔥', desc: 'Maintain learning momentum for 3 sessions.' },
  { id: 'b_seven_streak', title: 'Seven-Day Streak', icon: '⚡', desc: 'Achieve a 7-question winning streak.' },
  { id: 'b_boss_slayer', title: 'Sentinel Conqueror', icon: '⚔️', desc: 'Defeat the Concept Boss Battle.' }
];

export class GameState {
  constructor() {
    this.xp = 0;
    this.coins = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.totalCorrect = 0;
    this.totalAttempts = 0;
    this.firstAttemptCorrect = 0;
    this.completedSessions = 0;
    this.unlockedBadges = new Set();
    this.sessionHistory = [];

    this.onStateChange = null;
    this.onBadgeUnlock = null;
    this.onLevelUp = null;

    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('learnplay_gemma4_save_v1');
      if (data) {
        const parsed = JSON.parse(data);
        this.xp = parsed.xp || 0;
        this.coins = parsed.coins || 0;
        this.streak = parsed.streak || 0;
        this.bestStreak = parsed.bestStreak || 0;
        this.totalCorrect = parsed.totalCorrect || 0;
        this.totalAttempts = parsed.totalAttempts || 0;
        this.firstAttemptCorrect = parsed.firstAttemptCorrect || 0;
        this.completedSessions = parsed.completedSessions || 0;
        this.unlockedBadges = new Set(parsed.unlockedBadges || []);
        this.sessionHistory = parsed.sessionHistory || [];
      }
    } catch (e) {
      console.warn('Failed to load GameState from storage:', e);
    }
  }

  saveToStorage() {
    try {
      const obj = {
        xp: this.xp,
        coins: this.coins,
        streak: this.streak,
        bestStreak: this.bestStreak,
        totalCorrect: this.totalCorrect,
        totalAttempts: this.totalAttempts,
        firstAttemptCorrect: this.firstAttemptCorrect,
        completedSessions: this.completedSessions,
        unlockedBadges: Array.from(this.unlockedBadges),
        sessionHistory: this.sessionHistory.slice(-20) // Keep last 20
      };
      localStorage.setItem('learnplay_gemma4_save_v1', JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save GameState to storage:', e);
    }
  }

  getCurrentRank() {
    let current = PLAYER_RANKS[0];
    for (const rank of PLAYER_RANKS) {
      if (this.xp >= rank.minXp) {
        current = rank;
      }
    }
    return current;
  }

  getNextRank() {
    const current = this.getCurrentRank();
    const currentIndex = PLAYER_RANKS.indexOf(current);
    if (currentIndex < PLAYER_RANKS.length - 1) {
      return PLAYER_RANKS[currentIndex + 1];
    }
    return null; // At max rank
  }

  addXp(amount, reason = '') {
    const previousRank = this.getCurrentRank();
    this.xp += amount;
    this.coins += Math.round(amount / 5);

    const newRank = this.getCurrentRank();
    if (newRank.name !== previousRank.name) {
      if (typeof this.onLevelUp === 'function') {
        this.onLevelUp(newRank);
      }
    }

    this.saveToStorage();
    this._notifyStateChange();
    return { xpGained: amount, newTotal: this.xp };
  }

  recordAnswer({ isCorrect, isFirstAttempt, isRetry, difficulty }) {
    this.totalAttempts++;
    if (isCorrect) {
      this.totalCorrect++;
      this.streak++;
      if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak;
      }
      if (isFirstAttempt) {
        this.firstAttemptCorrect++;
      }

      // Check badges
      if (this.totalCorrect >= 5) this.unlockBadge('b_five_correct');
      if (isRetry) this.unlockBadge('b_retry_champion');
      if (difficulty === 'advanced' || difficulty === 'expert') this.unlockBadge('b_difficulty_climber');
      if (this.streak >= 7) this.unlockBadge('b_seven_streak');
    } else {
      this.streak = 0;
      this.unlockBadge('b_comeback_learner');
    }

    this.saveToStorage();
    this._notifyStateChange();
  }

  recordSessionComplete(sessionData) {
    this.completedSessions++;
    this.unlockBadge('b_first_game');
    if (this.completedSessions >= 3) {
      this.unlockBadge('b_three_streak');
    }
    this.addXp(100, 'Session Completed');

    this.sessionHistory.push({
      date: new Date().toISOString(),
      topic: sessionData.topic || 'General',
      subject: sessionData.subject || 'Academic',
      accuracy: sessionData.accuracy || 100,
      xpEarned: sessionData.xpEarned || 100
    });

    this.saveToStorage();
    this._notifyStateChange();
  }

  unlockBadge(badgeId) {
    if (!this.unlockedBadges.has(badgeId)) {
      this.unlockedBadges.add(badgeId);
      const badgeInfo = BADGES.find(b => b.id === badgeId);
      if (badgeInfo && typeof this.onBadgeUnlock === 'function') {
        this.onBadgeUnlock(badgeInfo);
      }
      this.saveToStorage();
      this._notifyStateChange();
    }
  }

  _notifyStateChange() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.getSummary());
    }
  }

  getSummary() {
    const rank = this.getCurrentRank();
    const nextRank = this.getNextRank();
    const overallAccuracy = this.totalAttempts > 0 
      ? Math.round((this.totalCorrect / this.totalAttempts) * 100) 
      : 100;
    const firstAttemptAccuracy = this.totalAttempts > 0 
      ? Math.round((this.firstAttemptCorrect / this.totalAttempts) * 100) 
      : 100;

    let progressToNext = 100;
    if (nextRank) {
      const currentRankBase = rank.minXp;
      const needed = nextRank.minXp - currentRankBase;
      const currentProgress = this.xp - currentRankBase;
      progressToNext = Math.min(100, Math.max(0, Math.round((currentProgress / needed) * 100)));
    }

    return {
      xp: this.xp,
      coins: this.coins,
      streak: this.streak,
      bestStreak: this.bestStreak,
      rank: rank.name,
      rankIcon: rank.icon,
      nextRank: nextRank ? nextRank.name : 'Maximum Rank',
      nextRankXp: nextRank ? nextRank.minXp : this.xp,
      progressToNext,
      totalCorrect: this.totalCorrect,
      totalAttempts: this.totalAttempts,
      overallAccuracy,
      firstAttemptAccuracy,
      unlockedBadgesCount: this.unlockedBadges.size,
      totalBadgesCount: BADGES.length,
      completedSessions: this.completedSessions
    };
  }
}

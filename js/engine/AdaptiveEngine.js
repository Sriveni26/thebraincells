/**
 * AdaptiveEngine.js
 * The core pedagogical intelligence engine powering LearnPlay.
 * Enforces the defining rules:
 *   Rule A (Wrong answer): Learn the same concept in a new way (alternate pattern, mini-lesson on 2 fails, worked example on 3 fails).
 *   Rule B (Correct answer): Unlock a harder challenge (Level 1 Beginner ➔ Level 5 Expert Challenge).
 */

export const DIFFICULTY_LEVELS = [
  { level: 1, id: 'level_1', name: 'Level 1: Beginner', desc: 'Basic recognition and definitions' },
  { level: 2, id: 'level_2', name: 'Level 2: Easy Application', desc: 'Simple examples and direct context' },
  { level: 3, id: 'level_3', name: 'Level 3: Intermediate', desc: 'Application in new situations' },
  { level: 4, id: 'level_4', name: 'Level 4: Advanced', desc: 'Multi-step reasoning and analysis' },
  { level: 5, id: 'level_5', name: 'Level 5: Expert Challenge', desc: 'Complex synthesis and problem-solving' }
];

export class AdaptiveEngine {
  constructor(aiService, gameState, audioEffects) {
    this.aiService = aiService;
    this.gameState = gameState;
    this.audioEffects = audioEffects;

    this.concepts = new Map(); // conceptId => ConceptMasteryRecord
    this.sessionQueue = [];    // Active list of question objects
    this.currentIndex = 0;
    this.currentQuestion = null;
    this.questionAttempts = new Map(); // questionId => attemptCount
    this.conceptConsecutiveFails = new Map(); // conceptId => count
    this.isSessionActive = false;
    this.bossBattleData = null;

    this.onQuestionChange = null;
    this.onSessionComplete = null;
    this.onConceptMasteryUpdate = null;
    this.onTutorTrigger = null;
    this.onMiniLessonTrigger = null;
    this.onWorkedExampleTrigger = null;
  }

  /**
   * Initializes a learning session
   */
  startSession({ concepts, questions, bossBattle, subject, topic }) {
    this.subject = subject || 'Academic Subject';
    this.topic = topic || 'General Topic';
    this.bossBattleData = bossBattle || null;
    this.currentIndex = 0;
    this.sessionQueue = [...questions];
    this.questionAttempts.clear();
    this.conceptConsecutiveFails.clear();
    this.isSessionActive = true;

    // Initialize or update concept mastery records
    concepts.forEach(c => {
      if (!this.concepts.has(c.id)) {
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1); // 1-day spaced repetition

        this.concepts.set(c.id, {
          id: c.id,
          name: c.name,
          summary: c.summary,
          currentDifficultyLevel: 1, // Level 1 to 5
          currentDifficulty: 'Level 1: Beginner',
          correctAnswers: 0,
          incorrectAnswers: 0,
          attempts: 0,
          firstAttemptSuccess: 0,
          currentMasteryScore: 0,
          lastPracticedTime: new Date().toISOString(),
          nextReviewDate: nextReview.toLocaleDateString(),
          needsRevision: false
        });
      }
    });

    this._notifyMasteryUpdate();
    this._loadNextQuestion();
  }

  getCurrentQuestion() {
    return this.currentQuestion;
  }

  getProgress() {
    return {
      current: this.currentIndex + 1,
      total: this.sessionQueue.length,
      percent: Math.min(100, Math.round(((this.currentIndex) / Math.max(1, this.sessionQueue.length)) * 100))
    };
  }

  /**
   * Evaluates student's answer
   */
  async submitAnswer(studentAnswer) {
    if (!this.currentQuestion) return;

    const q = this.currentQuestion;
    const concept = this.concepts.get(q.conceptId) || {
      id: q.conceptId || 'c_default',
      name: q.conceptName || 'Core Concept',
      summary: 'Academic principle',
      currentDifficultyLevel: 1,
      currentDifficulty: 'Level 1: Beginner',
      correctAnswers: 0,
      incorrectAnswers: 0,
      attempts: 0,
      firstAttemptSuccess: 0,
      currentMasteryScore: 0
    };

    const attemptsForThisQ = (this.questionAttempts.get(q.id) || 0) + 1;
    this.questionAttempts.set(q.id, attemptsForThisQ);
    concept.attempts++;
    concept.lastPracticedTime = new Date().toISOString();

    const isCorrect = this._checkAnswerCorrectness(q, studentAnswer);

    if (isCorrect) {
      // RULE B: Answer is CORRECT
      this.conceptConsecutiveFails.set(concept.id, 0); // reset consecutive fails
      concept.correctAnswers++;
      const isFirstAttempt = attemptsForThisQ === 1;

      if (isFirstAttempt) {
        concept.firstAttemptSuccess = (concept.firstAttemptSuccess || 0) + 1;
      }

      // Scoring values matching specification:
      // First-attempt: +100 XP
      // Second attempt: +70 XP
      // Third attempt: +50 XP
      // Guided practice: +30 XP
      let xpEarned = 100;
      if (attemptsForThisQ === 2) xpEarned = 70;
      else if (attemptsForThisQ === 3) xpEarned = 50;
      else if (attemptsForThisQ > 3) xpEarned = 30;

      // Check if mini-game bonus applies
      if (['memory', 'clock', 'steps', 'match'].includes(q.type)) {
        xpEarned += 50; // Mini-game completion bonus
      }

      this.gameState.recordAnswer({
        isCorrect: true,
        isFirstAttempt,
        isRetry: attemptsForThisQ > 1,
        difficulty: concept.currentDifficulty
      });
      this.gameState.addXp(xpEarned, `Mastered: ${concept.name}`);
      this.audioEffects.playCorrect();
      this.audioEffects.playXpGain();

      // Rule B: Increase difficulty by 1 level for the next question on this concept
      // If correct was obtained after multiple retries, increase cautiously
      if (attemptsForThisQ <= 2) {
        this._promoteDifficulty(concept);
      }
      concept.needsRevision = false;
      this._recalculateMastery(concept);
      this._notifyMasteryUpdate();

      return {
        isCorrect: true,
        feedback: q.explanation || 'Excellent conceptual understanding!',
        xpGained: xpEarned,
        nextDifficulty: concept.currentDifficulty,
        attempts: attemptsForThisQ
      };
    } else {
      // RULE A: Answer is INCORRECT
      concept.incorrectAnswers++;
      concept.needsRevision = true;
      const fails = (this.conceptConsecutiveFails.get(concept.id) || 0) + 1;
      this.conceptConsecutiveFails.set(concept.id, fails);

      // Temporary difficulty reduction if struggling at higher tiers
      if (fails >= 2) {
        this._demoteDifficulty(concept);
      }
      this._recalculateMastery(concept);

      this.gameState.recordAnswer({
        isCorrect: false,
        isFirstAttempt: attemptsForThisQ === 1,
        isRetry: false,
        difficulty: concept.currentDifficulty
      });
      this.audioEffects.playWrong();
      this._notifyMasteryUpdate();

      // Generate Adaptive Remediation via AI Tutor
      let remediation;
      try {
        remediation = await this.aiService.generateAdaptiveRemediation({
          conceptName: concept.name,
          conceptSummary: concept.summary,
          failedQuestion: q,
          studentAnswer: String(studentAnswer),
          retryCount: attemptsForThisQ
        });
      } catch (err) {
        console.warn('Adaptive remediation error:', err);
      }

      // Check consecutive failure thresholds:
      // Fails = 2: Trigger short mini-lesson
      // Fails = 3+: Show worked example + simpler practice question
      let specialRemediationType = 'standard';
      if (fails === 2) {
        specialRemediationType = 'mini_lesson';
      } else if (fails >= 3) {
        specialRemediationType = 'worked_example';
      }

      if (typeof this.onTutorTrigger === 'function') {
        this.onTutorTrigger({
          conceptName: concept.name,
          conceptSummary: concept.summary,
          studentAnswer,
          consecutiveFails: fails,
          remediationType: specialRemediationType,
          explanation: remediation?.tutorExplanation || q.explanation,
          hint: remediation?.extraHint || q.hint,
          remediationQuestion: remediation?.newQuestion
        });
      }

      // Enqueue fresh question with a DIFFERENT pattern testing the same concept
      if (remediation?.newQuestion) {
        this.sessionQueue.splice(this.currentIndex + 2, 0, remediation.newQuestion);
      }

      return {
        isCorrect: false,
        feedback: q.explanation || 'Not quite! Let’s test this concept another way.',
        xpGained: 0,
        hint: q.hint,
        consecutiveFails: fails,
        nextDifficulty: concept.currentDifficulty,
        attempts: attemptsForThisQ
      };
    }
  }

  _promoteDifficulty(concept) {
    if (concept.currentDifficultyLevel < 5) {
      concept.currentDifficultyLevel++;
      concept.currentDifficulty = DIFFICULTY_LEVELS[concept.currentDifficultyLevel - 1].name;
    }
  }

  _demoteDifficulty(concept) {
    if (concept.currentDifficultyLevel > 1) {
      concept.currentDifficultyLevel--;
      concept.currentDifficulty = DIFFICULTY_LEVELS[concept.currentDifficultyLevel - 1].name;
    }
  }

  _recalculateMastery(concept) {
    const total = concept.attempts;
    if (total === 0) {
      concept.currentMasteryScore = 0;
      return;
    }
    const accuracy = concept.correctAnswers / total;
    const tierBonus = concept.currentDifficultyLevel * 10;
    const score = Math.round((accuracy * 50) + tierBonus);
    concept.currentMasteryScore = Math.min(100, Math.max(10, score));

    if (concept.currentMasteryScore >= 80) {
      this.gameState.unlockBadge('b_topic_master');
      this.gameState.addXp(200, `Topic Mastered: ${concept.name}`);
    }
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= this.sessionQueue.length) {
      this._concludeSession();
      return null;
    }
    return this._loadNextQuestion();
  }

  _loadNextQuestion() {
    this.currentQuestion = this.sessionQueue[this.currentIndex];
    if (typeof this.onQuestionChange === 'function') {
      this.onQuestionChange(this.currentQuestion, this.getProgress());
    }
    return this.currentQuestion;
  }

  _concludeSession() {
    this.isSessionActive = false;
    const summary = this.getSessionSummary();
    this.gameState.recordSessionComplete(summary);
    this.audioEffects.playLevelUp();

    if (typeof this.onSessionComplete === 'function') {
      this.onSessionComplete(summary);
    }
  }

  _checkAnswerCorrectness(question, studentAnswer) {
    if (studentAnswer === '__TIMEOUT__') return false;

    if (question.type === 'quiz' || question.type === 'clock') {
      return String(studentAnswer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    }
    if (question.type === 'gap') {
      return String(studentAnswer).trim().toLowerCase() === String(question.targetWord || question.correctAnswer).trim().toLowerCase();
    }
    if (question.type === 'truefalse') {
      return Boolean(studentAnswer) === Boolean(question.isTrue ?? question.correctAnswer);
    }
    if (question.type === 'mistake') {
      return Number(studentAnswer) === Number(question.faultyIndex);
    }
    if (question.type === 'memory') {
      return Boolean(studentAnswer);
    }
    if (question.type === 'short') {
      const expected = String(question.correctAnswer || '').toLowerCase().trim();
      const actual = String(studentAnswer || '').toLowerCase().trim();
      return actual.includes(expected) || expected.includes(actual);
    }
    if (question.type === 'steps') {
      if (!Array.isArray(studentAnswer)) return false;
      const expected = question.steps || [];
      return expected.every((step, idx) => studentAnswer[idx] === step);
    }
    if (question.type === 'match') {
      if (!Array.isArray(studentAnswer)) return false;
      const expected = question.pairs || [];
      return expected.every(exp => {
        const found = studentAnswer.find(s => s.term === exp.term);
        return found && found.match === exp.match;
      });
    }
    return String(studentAnswer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
  }

  _notifyMasteryUpdate() {
    if (typeof this.onConceptMasteryUpdate === 'function') {
      this.onConceptMasteryUpdate(Array.from(this.concepts.values()));
    }
  }

  getAllConcepts() {
    return Array.from(this.concepts.values());
  }

  getRevisionQueue() {
    return Array.from(this.concepts.values()).filter(c => c.needsRevision || c.currentMasteryScore < 60);
  }

  getSessionSummary() {
    const allConcepts = this.getAllConcepts();
    const avgMastery = allConcepts.length > 0 
      ? Math.round(allConcepts.reduce((acc, c) => acc + c.currentMasteryScore, 0) / allConcepts.length)
      : 100;

    return {
      subject: this.subject,
      topic: this.topic,
      totalQuestions: this.sessionQueue.length,
      conceptsStudied: allConcepts.length,
      averageMastery: avgMastery,
      accuracy: this.gameState.getSummary().overallAccuracy,
      xpEarned: 100 + (this.sessionQueue.length * 50),
      hasBossBattle: Boolean(this.bossBattleData)
    };
  }
}

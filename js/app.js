/**
 * app.js
 * Main application bootstrapper and coordinator for LearnPlay.
 * Adheres strictly to brand/template.html layout and brand/theme.css styling.
 */

import { AIService } from './ai/AIService.js';
import { GameState } from './engine/GameState.js';
import { AudioEffects } from './engine/AudioEffects.js';
import { AdaptiveEngine } from './engine/AdaptiveEngine.js';
import { InputView } from './ui/InputView.js';
import { GameView } from './ui/GameView.js';
import { DashboardView } from './ui/DashboardView.js';
import { RevisionView } from './ui/RevisionView.js';
import { BossBattle } from './games/BossBattle.js';

class LearnPlayApp {
  constructor() {
    this.aiService = new AIService();
    this.gameState = new GameState();
    this.audioEffects = new AudioEffects();
    this.adaptiveEngine = new AdaptiveEngine(this.aiService, this.gameState, this.audioEffects);

    this.activeView = 'view-input';
    this.activeRemediationQuestion = null;
  }

  init() {
    this._initDomBindings();
    this._initViews();
    this._initTutorDrawer();
    this._initSettingsModal();
    this._initInspectorModal();
    this._initGamificationListeners();
    this._updateHeaderStats();
    this._updateEngineIndicator();

    console.log('LearnPlay initialized with Gemma 4 Engine.');
  }

  _initViews() {
    // 1. Input View
    const inputSlot = document.getElementById('input-container-slot');
    this.inputView = new InputView(inputSlot, async (data) => {
      await this._handleCurriculumGeneration(data);
    });
    this.inputView.render();

    // 2. Game View
    const gameSlot = document.getElementById('game-container-slot');
    this.gameView = new GameView(gameSlot, this.adaptiveEngine);

    // 3. Dashboard View
    const dashboardSlot = document.getElementById('dashboard-container-slot');
    this.dashboardView = new DashboardView(dashboardSlot, this.gameState, this.adaptiveEngine, (targetView) => {
      this.switchView(targetView);
    });
    this.dashboardView.render();

    // 4. Revision View
    const revisionSlot = document.getElementById('revision-container-slot');
    this.revisionView = new RevisionView(revisionSlot, this.adaptiveEngine, (concept) => {
      this._startSingleConceptPractice(concept);
    });
    this.revisionView.render();

    // 5. Boss View Slot
    this.bossSlot = document.getElementById('boss-container-slot');

    // Adaptive Engine question change listener
    this.adaptiveEngine.onQuestionChange = (question, progress) => {
      this.gameView.render(question, progress);
      this.switchView('view-game');
    };

    // Adaptive Engine session completion listener
    this.adaptiveEngine.onSessionComplete = (summary) => {
      this._showToast(`🎉 Session Complete! +100 XP Bonus!`, 'success');
      this.dashboardView.render();
      this.revisionView.render();
      if (summary.hasBossBattle) {
        this._prepareBossBattle();
      } else {
        this.switchView('view-dashboard');
      }
    };
  }

  async _handleCurriculumGeneration(params) {
    try {
      const curriculum = await this.aiService.generateCurriculum(params);
      
      if (curriculum._warning) {
        this._showToast(curriculum._warning, 'warning');
      } else {
        this._showToast(`✨ Generated curriculum with ${curriculum.questions?.length || 5} questions!`, 'success');
      }

      this.adaptiveEngine.startSession({
        concepts: curriculum.concepts || [],
        questions: curriculum.questions || [],
        bossBattle: curriculum.bossBattle || null,
        subject: curriculum.subject || params.subject,
        topic: curriculum.topic || params.topic
      });

      this.dashboardView.render();
      this.revisionView.render();
    } catch (err) {
      console.error('Curriculum error:', err);
      this._showToast(`Error: ${err.message}`, 'error');
    }
  }

  _prepareBossBattle() {
    if (!this.adaptiveEngine.bossBattleData) {
      this.switchView('view-dashboard');
      return;
    }

    this.bossBattle = new BossBattle(
      this.bossSlot,
      this.adaptiveEngine.bossBattleData,
      () => {
        this.dashboardView.render();
        this.switchView('view-dashboard');
      },
      this.audioEffects,
      this.gameState
    );
    this.bossBattle.render();
    this.switchView('view-boss');
  }

  _startSingleConceptPractice(concept) {
    const quickQuestions = [
      {
        id: `rev_q1_${Date.now()}`,
        conceptId: concept.id,
        conceptName: concept.name,
        type: 'quiz',
        difficulty: concept.currentDifficulty,
        prompt: `Revision Challenge: Which statement accurately defines ${concept.name}?`,
        options: [
          concept.summary,
          'An unrelated concept from another domain',
          'A principle that only applies under negative values',
          'A deprecated theoretical framework'
        ],
        correctAnswer: concept.summary,
        explanation: `Correct! ${concept.summary}`,
        hint: 'Review the definition carefully.',
        xpReward: 100
      },
      {
        id: `rev_q2_${Date.now()}`,
        conceptId: concept.id,
        conceptName: concept.name,
        type: 'truefalse',
        difficulty: concept.currentDifficulty,
        prompt: `True or False: ${concept.name} is characterized by: "${concept.summary}"`,
        isTrue: true,
        correctAnswer: true,
        explanation: 'Accurate and verified by the academic source.',
        hint: 'Matches the established summary.',
        xpReward: 100
      }
    ];

    this.adaptiveEngine.startSession({
      concepts: [concept],
      questions: quickQuestions,
      bossBattle: null,
      subject: 'Revision Arena',
      topic: concept.name
    });

    this.switchView('view-game');
  }

  _initDomBindings() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.target;
        this.switchView(targetView);
      });
    });

    const audioBtn = document.getElementById('btn-audio-toggle');
    const audioIcon = document.getElementById('audio-icon');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = this.audioEffects.toggleMute();
        audioIcon.textContent = isMuted ? '🔇' : '🔊';
        this._showToast(isMuted ? 'Audio Muted' : 'Audio Enabled', 'info');
      });
    }

    const engineBadge = document.getElementById('btn-engine-toggle');
    if (engineBadge) {
      engineBadge.addEventListener('click', () => {
        const modal = document.getElementById('modal-settings');
        if (modal) modal.classList.add('active');
      });
    }
  }

  switchView(viewId) {
    this.activeView = viewId;
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(viewId);
    if (targetSection) targetSection.classList.add('active');

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.dataset.target === viewId) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    if (viewId === 'view-dashboard') this.dashboardView.render();
    if (viewId === 'view-revision') this.revisionView.render();
  }

  _initTutorDrawer() {
    const drawer = document.getElementById('tutor-drawer');
    const content = document.getElementById('tutor-content');
    const badge = document.getElementById('tutor-concept-badge');
    const closeBtn = document.getElementById('btn-close-tutor');
    const hintBtn = document.getElementById('btn-tutor-hint');
    const retryBtn = document.getElementById('btn-tutor-retry-pattern');

    if (closeBtn) closeBtn.onclick = () => drawer.classList.remove('active');

    this.adaptiveEngine.onTutorTrigger = (remediationData) => {
      this.activeRemediationQuestion = remediationData.remediationQuestion || null;
      
      let badgeLabel = `Remediation • ${remediationData.conceptName}`;
      let extraContent = '';

      if (remediationData.remediationType === 'mini_lesson') {
        badgeLabel = `📚 Mini-Lesson • 2nd Attempt Review`;
        extraContent = `
          <div style="margin-top: 10px; padding: 12px; background: rgba(124, 77, 255, 0.15); border-left: 3px solid var(--primary); border-radius: 6px;">
            <strong style="color: #ffffff;">📖 Mini-Lesson:</strong> ${remediationData.conceptSummary}
          </div>
        `;
      } else if (remediationData.remediationType === 'worked_example') {
        badgeLabel = `💡 Worked Example • Step-by-Step Breakdown`;
        extraContent = `
          <div style="margin-top: 10px; padding: 12px; background: rgba(0, 240, 255, 0.12); border-left: 3px solid var(--secondary); border-radius: 6px;">
            <strong style="color: #ffffff;">🔍 Worked Example:</strong> Notice how each term directly connects to: "${remediationData.conceptSummary}". We will now test a simplified practice question to solidify your foundation!
          </div>
        `;
      }

      badge.textContent = badgeLabel;
      content.innerHTML = `
        <p style="margin-bottom: 8px;">${remediationData.explanation}</p>
        ${extraContent}
        <div id="tutor-inline-hint" style="display: none; color: var(--secondary); font-size: 0.9rem; margin-top: 8px; font-style: italic;">
          Hint: ${remediationData.hint}
        </div>
      `;
      drawer.classList.add('active');
    };

    if (hintBtn) {
      hintBtn.onclick = () => {
        const inlineHint = document.getElementById('tutor-inline-hint');
        if (inlineHint) inlineHint.style.display = 'block';
      };
    }

    if (retryBtn) {
      retryBtn.onclick = () => {
        drawer.classList.remove('active');
        if (this.activeRemediationQuestion) {
          this.gameView.render(this.activeRemediationQuestion, this.adaptiveEngine.getProgress());
          this.switchView('view-game');
          this._showToast('✨ Testing concept with a new question pattern!', 'info');
        } else {
          this.adaptiveEngine.nextQuestion();
        }
      };
    }
  }

  _initSettingsModal() {
    const modal = document.getElementById('modal-settings');
    const openBtn = document.getElementById('btn-settings-toggle');
    const closeBtn = document.getElementById('btn-close-settings');
    const cancelBtn = document.getElementById('btn-cancel-settings');
    const saveBtn = document.getElementById('btn-save-settings');
    const testOllamaBtn = document.getElementById('btn-test-ollama');
    const ollamaStatusSpan = document.getElementById('ollama-test-status');

    const googleGroup = document.getElementById('google-config-group');
    const ollamaGroup = document.getElementById('ollama-config-group');
    const apiKeyInput = document.getElementById('google-api-key');
    const ollamaEndpointInput = document.getElementById('ollama-endpoint');

    if (openBtn) {
      openBtn.onclick = () => {
        apiKeyInput.value = this.aiService.googleClient.apiKey || '';
        ollamaEndpointInput.value = this.aiService.ollamaClient.endpoint || 'http://127.0.0.1:11434/api/chat';
        
        const radio = document.querySelector(`input[name="engineChoice"][value="${this.aiService.activeEngine}"]`);
        if (radio) radio.checked = true;
        this._updateConfigFieldsVisibility();
        modal.classList.add('active');
      };
    }

    const closeModal = () => modal.classList.remove('active');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    document.querySelectorAll('input[name="engineChoice"]').forEach(r => {
      r.addEventListener('change', () => this._updateConfigFieldsVisibility());
    });

    if (testOllamaBtn) {
      testOllamaBtn.onclick = async () => {
        ollamaStatusSpan.textContent = 'Testing connection...';
        ollamaStatusSpan.style.color = 'var(--secondary)';
        this.aiService.ollamaClient.setEndpoint(ollamaEndpointInput.value);
        const health = await this.aiService.ollamaClient.checkHealth();
        if (health.online) {
          ollamaStatusSpan.textContent = `Online! Models: ${health.models.join(', ') || 'none'}`;
          ollamaStatusSpan.style.color = 'var(--emerald-success)';
        } else {
          ollamaStatusSpan.textContent = `Offline: ${health.error || 'Connection failed'}`;
          ollamaStatusSpan.style.color = 'var(--rose-danger)';
        }
      };
    }

    if (saveBtn) {
      saveBtn.onclick = () => {
        const selectedEngine = document.querySelector('input[name="engineChoice"]:checked')?.value || 'google';
        this.aiService.saveConfig({
          engine: selectedEngine,
          googleApiKey: apiKeyInput.value.trim(),
          ollamaEndpoint: ollamaEndpointInput.value.trim()
        });
        this._updateEngineIndicator();
        this._showToast(`AI Engine updated: ${this.aiService.getActiveEngineInfo().displayName}`, 'success');
        closeModal();
      };
    }
  }

  _updateConfigFieldsVisibility() {
    const selected = document.querySelector('input[name="engineChoice"]:checked')?.value;
    const googleGroup = document.getElementById('google-config-group');
    const ollamaGroup = document.getElementById('ollama-config-group');
    if (googleGroup) googleGroup.style.display = selected === 'google' ? 'block' : 'none';
    if (ollamaGroup) ollamaGroup.style.display = selected === 'ollama' ? 'block' : 'none';
  }

  _initInspectorModal() {
    const modal = document.getElementById('modal-inspector');
    const openBtn = document.getElementById('btn-inspector-toggle');
    const closeBtn = document.getElementById('btn-close-inspector');

    if (openBtn) openBtn.onclick = () => modal.classList.add('active');
    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');

    this.aiService.onInspectUpdate = (data) => {
      const modelName = document.getElementById('inspect-model-name');
      const latency = document.getElementById('inspect-latency');
      const tokenCount = document.getElementById('inspect-token-count');
      const promptDisplay = document.getElementById('inspect-prompt-display');
      const responseDisplay = document.getElementById('inspect-response-display');

      if (modelName) modelName.textContent = data.model;
      if (latency) latency.textContent = `${data.latencyMs} ms`;
      if (tokenCount) tokenCount.textContent = `${data.tokenCount} tokens`;
      if (promptDisplay) promptDisplay.textContent = data.prompt;
      if (responseDisplay) responseDisplay.textContent = data.rawText;
    };
  }

  _initGamificationListeners() {
    this.gameState.onStateChange = () => {
      this._updateHeaderStats();
    };

    this.gameState.onLevelUp = (newRank) => {
      this._showToast(`🎖️ RANK ADVANCEMENT: You are now a ${newRank.name}!`, 'level-up');
      this.audioEffects.playLevelUp();
    };

    this.gameState.onBadgeUnlock = (badge) => {
      this._showToast(`🏆 BADGE UNLOCKED: ${badge.title} - ${badge.desc}`, 'badge');
      this.audioEffects.playStreak();
    };
  }

  _updateHeaderStats() {
    const s = this.gameState.getSummary();
    const rankEl = document.getElementById('rank-name-display');
    const xpEl = document.getElementById('xp-counter-display');
    const streakEl = document.getElementById('streak-counter-display');
    const coinsEl = document.getElementById('coins-counter-display');

    if (rankEl) rankEl.textContent = s.rank;
    if (xpEl) xpEl.textContent = `${s.xp.toLocaleString()} XP`;
    if (streakEl) streakEl.textContent = `${s.streak}x Streak`;
    if (coinsEl) coinsEl.textContent = `${s.coins} Coins`;
  }

  _updateEngineIndicator() {
    const info = this.aiService.getActiveEngineInfo();
    const tagEl = document.getElementById('active-engine-tag');
    const dotEl = document.getElementById('engine-status-dot');
    const textEl = document.getElementById('engine-status-text');

    if (tagEl) tagEl.textContent = info.tag;
    if (textEl) textEl.textContent = info.displayName;
    if (dotEl) {
      dotEl.className = 'engine-indicator-dot';
      if (info.status === 'needs_key') dotEl.classList.add('warning');
      else if (info.status === 'offline') dotEl.classList.add('offline');
    }
  }

  _showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'glass-panel';
    toast.style.cssText = `
      padding: 12px 20px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      font-size: 0.9rem;
      font-weight: 600;
      color: #ffffff;
      animation: fadeIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: auto;
    `;

    if (type === 'success' || type === 'level-up') {
      toast.style.borderColor = 'var(--emerald-success)';
      toast.style.background = 'rgba(10, 30, 20, 0.95)';
    } else if (type === 'badge') {
      toast.style.borderColor = 'var(--amber-xp)';
      toast.style.background = 'rgba(30, 20, 10, 0.95)';
    } else if (type === 'warning') {
      toast.style.borderColor = 'var(--amber-xp)';
    } else if (type === 'error') {
      toast.style.borderColor = 'var(--rose-danger)';
    }

    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.learnPlay = new LearnPlayApp();
  window.learnPlay.init();
});

/**
 * MemoryMatch.js
 * Interactive 3D card-flipping memory match mini-game.
 * Students flip cards to discover matching pairs of academic concepts and definitions.
 */

export class MemoryMatch {
  constructor(container, onSubmit, audioEffects) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.audioEffects = audioEffects;
    this.question = null;
    this.cards = [];
    this.flippedIndices = [];
    this.matchedPairs = 0;
    this.isLocked = false;
  }

  render(question) {
    this.question = question;
    this.flippedIndices = [];
    this.matchedPairs = 0;
    this.isLocked = false;

    // Build pairs from pairs array or fallback
    const rawPairs = question.pairs || [
      { term: 'Concept Alpha', match: 'Core Definition Alpha' },
      { term: 'Concept Beta', match: 'Core Definition Beta' },
      { term: 'Concept Gamma', match: 'Core Definition Gamma' }
    ];

    // Create a deck with 2 cards per pair
    const deck = [];
    rawPairs.forEach((p, idx) => {
      deck.push({ id: idx, type: 'term', text: p.term, pairId: idx });
      deck.push({ id: idx, type: 'match', text: p.match, pairId: idx });
    });

    // Shuffle deck
    this.cards = deck.sort(() => Math.random() - 0.5);

    const cardsHtml = this.cards.map((c, idx) => `
      <div class="memory-card" data-index="${idx}" id="mem-card-${idx}">
        <div class="memory-card-inner">
          <div class="memory-card-front">
            <span style="font-size: 1.5rem;">❓</span>
            <span style="font-size: 0.72rem; margin-top: 4px; font-family: var(--font-mono);">FLIP</span>
          </div>
          <div class="memory-card-back">
            <span style="font-size: 0.85rem; font-weight: 600; line-height: 1.3;">${c.text}</span>
          </div>
        </div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="question-card" id="memory-match-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="font-size: 0.85rem; color: var(--secondary); font-family: var(--font-mono); text-transform: uppercase;">
            🧠 Memory Match: Flip &amp; Pair Academic Concepts
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--amber-xp);" id="mem-pairs-counter">
            Matched: 0 / ${rawPairs.length}
          </div>
        </div>

        <h2 class="question-text" style="font-size: 1.25rem; margin-bottom: 20px;">
          ${question.prompt || 'Flip cards to reveal and pair each concept with its matching definition:'}
        </h2>

        <div class="memory-grid" id="memory-card-grid">
          ${cardsHtml}
        </div>

        <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 24px;">
          <button class="btn btn-primary" id="btn-mem-submit" disabled>
            <span>Finish Memory Trial</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const cardEls = this.container.querySelectorAll('.memory-card');
    const submitBtn = this.container.querySelector('#btn-mem-submit');
    const pairsCounter = this.container.querySelector('#mem-pairs-counter');
    const totalPairs = (this.question.pairs || []).length;

    cardEls.forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const idx = parseInt(cardEl.dataset.index, 10);
        if (this.isLocked || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) {
          return;
        }

        cardEl.classList.add('flipped');
        this.flippedIndices.push(idx);

        if (this.audioEffects) this.audioEffects.playStreak();

        if (this.flippedIndices.length === 2) {
          this.isLocked = true;
          const [idx1, idx2] = this.flippedIndices;
          const card1 = this.cards[idx1];
          const card2 = this.cards[idx2];

          const el1 = this.container.querySelector(`#mem-card-${idx1}`);
          const el2 = this.container.querySelector(`#mem-card-${idx2}`);

          if (card1.pairId === card2.pairId && card1.type !== card2.type) {
            // Match found!
            setTimeout(() => {
              el1.classList.add('matched');
              el2.classList.add('matched');
              this.matchedPairs++;
              if (pairsCounter) pairsCounter.textContent = `Matched: ${this.matchedPairs} / ${totalPairs}`;
              if (this.audioEffects) this.audioEffects.playCorrect();

              this.flippedIndices = [];
              this.isLocked = false;

              if (this.matchedPairs >= totalPairs) {
                submitBtn.removeAttribute('disabled');
              }
            }, 400);
          } else {
            // Mismatch
            setTimeout(() => {
              el1.classList.remove('flipped');
              el2.classList.remove('flipped');
              this.flippedIndices = [];
              this.isLocked = false;
            }, 900);
          }
        }
      });
    });

    submitBtn.addEventListener('click', () => {
      if (typeof this.onSubmit === 'function') {
        submitBtn.setAttribute('disabled', 'true');
        this.onSubmit(true);
      }
    });
  }

  showResult(isCorrect) {
    const card = this.container.querySelector('#memory-match-card');
    if (card) {
      card.style.borderColor = isCorrect ? 'var(--emerald-success)' : 'var(--rose-danger)';
    }
  }

  destroy() {}
}

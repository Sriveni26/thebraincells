/**
 * AIService.js
 * Central AI engine router coordinating Google's hosted `gemma-4-26b-a4b-it`,
 * local Ollama `gemma4`, and an offline adaptive academic generator.
 */

import { GemmaGoogleClient } from './GemmaGoogleClient.js';
import { GemmaOllamaClient } from './GemmaOllamaClient.js';
import { PromptTemplates } from './PromptTemplates.js';

export class AIService {
  constructor() {
    this.googleClient = new GemmaGoogleClient();
    this.ollamaClient = new GemmaOllamaClient();
    this.activeEngine = 'google'; // 'google' | 'ollama' | 'demo'
    
    // Load persisted settings
    this.loadPersistedConfig();

    // Inspector event listeners
    this.onInspectUpdate = null;
  }

  loadPersistedConfig() {
    try {
      const savedKey = localStorage.getItem('learnplay_google_api_key');
      if (savedKey) this.googleClient.setApiKey(savedKey);

      const savedEndpoint = localStorage.getItem('learnplay_ollama_endpoint');
      if (savedEndpoint) this.ollamaClient.setEndpoint(savedEndpoint);

      const savedEngine = localStorage.getItem('learnplay_active_engine');
      if (savedEngine) this.activeEngine = savedEngine;
    } catch (e) {
      console.warn('LocalStorage access error:', e);
    }
  }

  saveConfig({ engine, googleApiKey, ollamaEndpoint }) {
    if (engine) {
      this.activeEngine = engine;
      localStorage.setItem('learnplay_active_engine', engine);
    }
    if (googleApiKey !== undefined) {
      this.googleClient.setApiKey(googleApiKey);
      localStorage.setItem('learnplay_google_api_key', googleApiKey);
    }
    if (ollamaEndpoint !== undefined) {
      this.ollamaClient.setEndpoint(ollamaEndpoint);
      localStorage.setItem('learnplay_ollama_endpoint', ollamaEndpoint);
    }
  }

  getActiveEngineInfo() {
    switch (this.activeEngine) {
      case 'google':
        return {
          id: 'google',
          displayName: 'Google API: gemma-4-26b-a4b-it',
          tag: 'Google Cloud Gemma 4',
          model: 'gemma-4-26b-a4b-it',
          status: this.googleClient.hasApiKey() ? 'configured' : 'needs_key'
        };
      case 'ollama':
        return {
          id: 'ollama',
          displayName: 'Local Ollama: gemma4',
          tag: 'Local Ollama 11434',
          model: 'gemma4',
          status: 'ready'
        };
      case 'demo':
      default:
        return {
          id: 'demo',
          displayName: 'Offline Academic Demo Engine',
          tag: 'Offline Generator',
          model: 'gemma4-demo-sim',
          status: 'ready'
        };
    }
  }

  /**
   * Main method: Analyzes academic text and generates question set
   */
  async generateCurriculum({ text, subject, topic, difficulty, questionCount, gameMode }) {
    const userPrompt = PromptTemplates.buildContentAnalysisPrompt({
      text,
      subject,
      topic,
      difficulty,
      questionCount,
      gameMode
    });
    const systemPrompt = PromptTemplates.ACADEMIC_SYSTEM_INSTRUCTION;

    let result;

    if (this.activeEngine === 'google') {
      if (!this.googleClient.hasApiKey()) {
        console.warn('No Google API key found. Falling back to high-fidelity Academic Demo Generator.');
        result = await this._generateDemoCurriculum({ text, subject, topic, difficulty, questionCount, gameMode });
      } else {
        try {
          const res = await this.googleClient.generateContent(userPrompt, systemPrompt);
          result = res.json;
          this._emitInspect({
            model: 'gemma-4-26b-a4b-it (Google Cloud)',
            prompt: userPrompt,
            rawText: res.rawText,
            latencyMs: res.latencyMs,
            tokenCount: res.tokenCount
          });
        } catch (err) {
          console.warn('Google API error, falling back to Demo Mode with notification:', err.message);
          result = await this._generateDemoCurriculum({ text, subject, topic, difficulty, questionCount, gameMode });
          result._warning = `Google Gemma API note: ${err.message}. Showing simulated output.`;
        }
      }
    } else if (this.activeEngine === 'ollama') {
      try {
        const res = await this.ollamaClient.generateContent(userPrompt, systemPrompt);
        result = res.json;
        this._emitInspect({
          model: 'gemma4 (Local Ollama)',
          prompt: userPrompt,
          rawText: res.rawText,
          latencyMs: res.latencyMs,
          tokenCount: res.tokenCount
        });
      } catch (err) {
        console.warn('Ollama error, falling back to Demo Mode:', err.message);
        result = await this._generateDemoCurriculum({ text, subject, topic, difficulty, questionCount, gameMode });
        result._warning = `Local Ollama error: ${err.message}. Showing simulated output.`;
      }
    } else {
      result = await this._generateDemoCurriculum({ text, subject, topic, difficulty, questionCount, gameMode });
    }

    return result;
  }

  /**
   * Adaptive Remediation method: Generates explanation and new question pattern on error
   */
  async generateAdaptiveRemediation({ conceptName, conceptSummary, failedQuestion, studentAnswer, retryCount }) {
    const userPrompt = PromptTemplates.buildAdaptiveRemediationPrompt({
      conceptName,
      conceptSummary,
      failedQuestion,
      studentAnswer,
      retryCount
    });
    const systemPrompt = PromptTemplates.ACADEMIC_SYSTEM_INSTRUCTION;

    let result;

    if (this.activeEngine === 'google' && this.googleClient.hasApiKey()) {
      try {
        const res = await this.googleClient.generateContent(userPrompt, systemPrompt);
        result = res.json;
        this._emitInspect({
          model: 'gemma-4-26b-a4b-it (Tutor Remediation)',
          prompt: userPrompt,
          rawText: res.rawText,
          latencyMs: res.latencyMs,
          tokenCount: res.tokenCount
        });
      } catch (err) {
        console.warn('Google API tutor remediation error, using fallback:', err.message);
        result = this._generateDemoRemediation({ conceptName, conceptSummary, failedQuestion, studentAnswer, retryCount });
      }
    } else if (this.activeEngine === 'ollama') {
      try {
        const res = await this.ollamaClient.generateContent(userPrompt, systemPrompt);
        result = res.json;
        this._emitInspect({
          model: 'gemma4 (Tutor Remediation)',
          prompt: userPrompt,
          rawText: res.rawText,
          latencyMs: res.latencyMs,
          tokenCount: res.tokenCount
        });
      } catch (err) {
        console.warn('Ollama tutor remediation error, using fallback:', err.message);
        result = this._generateDemoRemediation({ conceptName, conceptSummary, failedQuestion, studentAnswer, retryCount });
      }
    } else {
      result = this._generateDemoRemediation({ conceptName, conceptSummary, failedQuestion, studentAnswer, retryCount });
    }

    return result;
  }

  _emitInspect(data) {
    if (typeof this.onInspectUpdate === 'function') {
      this.onInspectUpdate(data);
    }
  }

  /**
   * High-fidelity Academic Offline Generator
   */
  async _generateDemoCurriculum({ text, subject, topic, difficulty, questionCount, gameMode }) {
    await new Promise(r => setTimeout(r, 450)); // Realistic compute delay

    const sub = (subject || 'Computer Science').toLowerCase();
    
    // Intelligent extraction if text has specific themes
    const isPhysics = sub.includes('physic') || text.toLowerCase().includes('energy') || text.toLowerCase().includes('newton');
    const isBiology = sub.includes('bio') || text.toLowerCase().includes('cell') || text.toLowerCase().includes('dna');
    const isMath = sub.includes('math') || text.toLowerCase().includes('calculus') || text.toLowerCase().includes('derivative');

    let concepts = [];
    let questions = [];
    let bossBattle = {};

    if (isPhysics) {
      concepts = [
        {
          id: 'c_newton',
          name: "Newton's Second Law",
          summary: "Force equals the rate of change of momentum (F = m × a). Acceleration is proportional to net force.",
          baselineDifficulty: "beginner"
        },
        {
          id: 'c_energy',
          name: "Conservation of Energy",
          summary: "Energy cannot be created or destroyed; it transforms between kinetic (½mv²) and potential (mgh) states.",
          baselineDifficulty: "intermediate"
        },
        {
          id: 'c_momentum',
          name: "Linear Momentum & Collisions",
          summary: "Total momentum is conserved in isolated systems. Elastic collisions also conserve kinetic energy.",
          baselineDifficulty: "advanced"
        }
      ];

      questions = [
        {
          id: 'q_phys_1',
          conceptId: 'c_newton',
          conceptName: "Newton's Second Law",
          type: 'quiz',
          difficulty: 'beginner',
          prompt: 'If the net force acting upon an object is tripled while its mass remains constant, how does its acceleration change?',
          options: [
            'It is cut by one-third',
            'It triples proportionally (3× a)',
            'It remains unchanged',
            'It increases by a factor of nine (9× a)'
          ],
          correctAnswer: 'It triples proportionally (3× a)',
          explanation: 'According to Newton’s Second Law (F = ma), acceleration is directly proportional to the applied net force when mass is held constant.',
          hint: 'Look at the linear relation in F = ma.',
          xpReward: 100
        },
        {
          id: 'q_phys_2',
          conceptId: 'c_newton',
          conceptName: "Newton's Second Law",
          type: 'gap',
          difficulty: 'beginner',
          sentenceBefore: 'In the equation F = m × a, the symbol "a" represents',
          targetWord: 'acceleration',
          sentenceAfter: ', which has SI units of meters per second squared (m/s²).',
          wordBank: ['acceleration', 'velocity', 'displacement', 'momentum'],
          correctAnswer: 'acceleration',
          explanation: 'Acceleration defines the rate at which an object changes its velocity over time.',
          hint: 'The rate of change of velocity.',
          xpReward: 100
        },
        {
          id: 'q_phys_3',
          conceptId: 'c_energy',
          conceptName: 'Conservation of Energy',
          type: 'truefalse',
          difficulty: 'intermediate',
          prompt: 'When a roller coaster descends from its highest peak without friction, gravitational potential energy is converted into kinetic energy with zero net energy loss.',
          isTrue: true,
          correctAnswer: true,
          explanation: 'Under the Law of Conservation of Energy, in the absence of non-conservative forces like friction, mechanical energy (PE + KE) remains constant.',
          hint: 'Does mechanical energy conserve in ideal frictionless systems?',
          xpReward: 100
        },
        {
          id: 'q_phys_4',
          conceptId: 'c_energy',
          conceptName: 'Conservation of Energy',
          type: 'match',
          difficulty: 'intermediate',
          prompt: 'Match each physics concept with its fundamental formula:',
          pairs: [
            { term: 'Kinetic Energy', match: '½ m v²' },
            { term: 'Gravitational Potential', match: 'm g h' },
            { term: 'Newtonian Force', match: 'm a' }
          ],
          explanation: 'These three formulas are cornerstones of classical Newtonian dynamics and work-energy theorem.',
          hint: 'Velocity is squared in kinetic energy.',
          xpReward: 100
        },
        {
          id: 'q_phys_5',
          conceptId: 'c_momentum',
          conceptName: 'Linear Momentum & Collisions',
          type: 'mistake',
          difficulty: 'advanced',
          prompt: 'Identify the segment containing an erroneous claim regarding mechanical collisions:',
          segments: [
            'In an inelastic collision, total momentum is conserved',
            'while kinetic energy is perfectly conserved without thermal dissipation',
            'and internal forces balance out to zero.'
          ],
          faultyIndex: 1,
          correctAnswer: 'while kinetic energy is perfectly conserved without thermal dissipation',
          correction: 'kinetic energy is transformed into thermal/deformation energy in inelastic collisions',
          explanation: 'Only perfectly ELASTIC collisions conserve kinetic energy; inelastic collisions lose kinetic energy to heat or deformation.',
          hint: 'Recall the distinction between elastic and inelastic collisions.',
          xpReward: 100
        }
      ];

      bossBattle = {
        bossName: 'Lord of Kinetics: Synthesis Trial',
        description: 'Prove complete mastery of Newtonian mechanics and energy conservation.',
        phases: [
          {
            phaseNumber: 1,
            challenge: 'Phase 1: Force & Mass Vector Coupling',
            question: 'A 2 kg mass subjected to a constant 10 N force travels 4 meters from rest. What is its final kinetic energy?',
            options: ['40 Joules', '20 Joules', '80 Joules', '10 Joules'],
            correctAnswer: '40 Joules',
            damage: 35
          },
          {
            phaseNumber: 2,
            challenge: 'Phase 2: Momentum Transfer Under Inelastic Conditions',
            question: 'Two identical carts moving toward each other at equal speed stick together after colliding. What is their combined post-collision velocity?',
            options: ['Zero (0 m/s)', 'Double the initial speed', 'Half the initial speed', 'Initial speed reversed'],
            correctAnswer: 'Zero (0 m/s)',
            damage: 35
          },
          {
            phaseNumber: 3,
            challenge: 'Phase 3: The Definitive Conservation Paradox',
            question: 'Why does an object in uniform circular motion accelerate even when its speed is constant?',
            options: [
              'Because the velocity vector continuously changes direction',
              'Because friction acts along the circumference',
              'Because speed is secretly increasing',
              'It does not accelerate'
            ],
            correctAnswer: 'Because the velocity vector continuously changes direction',
            damage: 30
          }
        ]
      };
    } else {
      // Default: Computer Science & Data Structures
      concepts = [
        {
          id: 'c_bigo',
          name: 'Asymptotic Analysis & Big-O',
          summary: 'Describes the limiting behavior of an algorithm execution time or memory footprint as input size (n) scales toward infinity.',
          baselineDifficulty: 'beginner'
        },
        {
          id: 'c_graphs',
          name: 'Graph Traversal (BFS vs DFS)',
          summary: 'BFS uses a FIFO queue to discover shortest paths in unweighted graphs; DFS uses a LIFO stack/recursion to explore deep subtrees.',
          baselineDifficulty: 'intermediate'
        },
        {
          id: 'c_dp',
          name: 'Dynamic Programming & Memoization',
          summary: 'Solves complex problems by breaking them down into overlapping subproblems and optimal substructures, caching subproblem solutions.',
          baselineDifficulty: 'advanced'
        }
      ];

      questions = [
        {
          id: 'q_cs_1',
          conceptId: 'c_bigo',
          conceptName: 'Asymptotic Analysis & Big-O',
          type: 'quiz',
          difficulty: 'beginner',
          prompt: 'What is the worst-case time complexity of binary search on a sorted array of size n?',
          options: [
            'O(1) Constant',
            'O(log n) Logarithmic',
            'O(n) Linear',
            'O(n²) Quadratic'
          ],
          correctAnswer: 'O(log n) Logarithmic',
          explanation: 'Binary search halves the search space at each iteration (n, n/2, n/4, ...), resulting in log₂(n) comparison steps.',
          hint: 'The search space is halved after each comparison.',
          xpReward: 100
        },
        {
          id: 'q_cs_2',
          conceptId: 'c_bigo',
          conceptName: 'Asymptotic Analysis & Big-O',
          type: 'gap',
          difficulty: 'beginner',
          sentenceBefore: 'When indexing directly into an array using a known memory offset, the lookup operates in',
          targetWord: 'constant',
          sentenceAfter: 'time complexity, designated as O(1).',
          wordBank: ['constant', 'linear', 'logarithmic', 'exponential'],
          correctAnswer: 'constant',
          explanation: 'Direct index access computes the memory address directly via base + (index × size) without scanning.',
          hint: 'Does not depend on the number of elements.',
          xpReward: 100
        },
        {
          id: 'q_cs_3',
          conceptId: 'c_graphs',
          conceptName: 'Graph Traversal (BFS vs DFS)',
          type: 'truefalse',
          difficulty: 'intermediate',
          prompt: 'Breadth-First Search (BFS) is guaranteed to find the shortest path between two vertices in an unweighted graph.',
          isTrue: true,
          correctAnswer: true,
          explanation: 'BFS explores vertices in order of their distance from the source level by level, ensuring the first time a target vertex is reached represents the minimum edge count.',
          hint: 'Think about how levels expand layer by layer.',
          xpReward: 100
        },
        {
          id: 'q_cs_4',
          conceptId: 'c_graphs',
          conceptName: 'Graph Traversal (BFS vs DFS)',
          type: 'match',
          difficulty: 'intermediate',
          prompt: 'Match each traversal algorithm with its foundational data structure:',
          pairs: [
            { term: 'Breadth-First Search (BFS)', match: 'FIFO Queue' },
            { term: 'Depth-First Search (DFS)', match: 'LIFO Stack / Call Stack' },
            { term: "Dijkstra's Algorithm", match: 'Min-Priority Queue' }
          ],
          explanation: 'Queue maintains level order for BFS, stack enables backtracking for DFS, and priority queue orders candidate edges by weight.',
          hint: 'Queue = First-In First-Out; Stack = Last-In First-Out.',
          xpReward: 100
        },
        {
          id: 'q_cs_5',
          conceptId: 'c_dp',
          conceptName: 'Dynamic Programming & Memoization',
          type: 'mistake',
          difficulty: 'advanced',
          prompt: 'Identify the segment containing an erroneous claim about Dynamic Programming:',
          segments: [
            'Dynamic programming is applicable when a problem exhibits optimal substructure',
            'and completely independent subproblems with zero overlap between branches',
            'allowing sub-solutions to be cached in a table.'
          ],
          faultyIndex: 1,
          correctAnswer: 'and completely independent subproblems with zero overlap between branches',
          correction: 'and overlapping subproblems where identical states are evaluated repeatedly',
          explanation: 'If subproblems were independent without overlap, divide-and-conquer (like merge sort) would be used; DP specifically addresses OVERLAPPING subproblems.',
          hint: 'Why do we store values in a memoization cache?',
          xpReward: 100
        },
        {
          id: 'q_cs_6',
          conceptId: 'c_bigo',
          conceptName: 'Asymptotic Analysis & Big-O',
          type: 'clock',
          difficulty: 'beginner',
          prompt: 'Beat the clock: Which complexity is strictly superior for ultra-large n?',
          options: ['O(1)', 'O(n)', 'O(n²)', 'O(2^n)'],
          correctAnswer: 'O(1)',
          explanation: 'O(1) constant time does not scale with n at all, making it optimal.',
          hint: 'Think of immediate direct access.',
          xpReward: 150
        },
        {
          id: 'q_cs_7',
          conceptId: 'c_graphs',
          conceptName: 'Graph Traversal (BFS vs DFS)',
          type: 'memory',
          difficulty: 'intermediate',
          prompt: 'Memory Match: Flip and pair the graph terms with their traversal paradigms',
          pairs: [
            { term: 'BFS Exploration', match: 'Layer-by-layer concentric rings' },
            { term: 'DFS Exploration', match: 'Deepest leaf branch descent' },
            { term: 'Topological Sort', match: 'Directed Acyclic Graph ordering' }
          ],
          explanation: 'Pairs graph paradigms to their execution behaviors.',
          hint: 'Pair each algorithm with its visual traversal pattern.',
          xpReward: 120
        },
        {
          id: 'q_cs_8',
          conceptId: 'c_dp',
          conceptName: 'Dynamic Programming & Memoization',
          type: 'steps',
          difficulty: 'intermediate',
          prompt: 'Arrange the sequence of steps for solving a Dynamic Programming problem:',
          steps: [
            '1. Characterize the optimal substructure',
            '2. Define the subproblem recurrence relation',
            '3. Compute values bottom-up or with memoization',
            '4. Construct optimal solution from cached results'
          ],
          explanation: 'This 4-step framework is the canonical recipe for Dynamic Programming.',
          hint: 'First characterize structure, then define relation, compute, and reconstruct.',
          xpReward: 120
        }
      ];

      bossBattle = {
        bossName: 'Algorithmic Overlord: Mastery Exam',
        description: 'Overcome the 3-phase sentinel by synthesizing data structures and complexity theory.',
        phases: [
          {
            phaseNumber: 1,
            challenge: 'Phase 1: Memory Hierarchy & Cache Locality',
            question: 'Why does traversing a contiguous array in row-major order outperform linked-list traversals of equal element count?',
            options: [
              'Superior CPU cache locality and hardware prefetching',
              'Arrays require zero memory allocation',
              'Pointers have zero memory cost',
              'Linked lists cannot store primitive integers'
            ],
            correctAnswer: 'Superior CPU cache locality and hardware prefetching',
            damage: 35
          },
          {
            phaseNumber: 2,
            challenge: 'Phase 2: Recurrence Relation Synthesis',
            question: 'According to the Master Theorem, what is the asymptotic runtime of T(n) = 2T(n/2) + O(n)?',
            options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
            correctAnswer: 'O(n log n)',
            damage: 35
          },
          {
            phaseNumber: 3,
            challenge: 'Phase 3: The NP-Completeness Confrontation',
            question: 'If a polynomial-time algorithm is discovered that solves the Traveling Salesperson Problem (TSP), what is the immediate theoretical consequence?',
            options: [
              'P = NP',
              'All cryptographic hashing breaks unconditionally',
              'Linear search runs in O(1)',
              'Computers can solve the Halting Problem'
            ],
            correctAnswer: 'P = NP',
            damage: 30
          }
        ]
      };
    }

    // Filter by preferred game mode if specified and not 'random'
    const requestedMode = (gameMode || 'random').toLowerCase();
    if (requestedMode !== 'random') {
      const modeMatches = questions.filter(q => q.type === requestedMode);
      if (modeMatches.length > 0) {
        questions = modeMatches;
      }
    }

    // Adjust question count
    const targetCount = questionCount || 5;
    if (questions.length > targetCount) {
      questions = questions.slice(0, targetCount);
    }

    const mockText = `${subject || 'Academic Content'}: ${topic || 'Key Concepts'}. Generated via Gemma 4 Adaptive Engine.`;
    this._emitInspect({
      model: 'gemma-4-26b-a4b-it (Offline Simulator)',
      prompt: `[Generated Curriculum for ${subject || 'Topic'}]`,
      rawText: JSON.stringify({ concepts, questions, bossBattle }, null, 2),
      latencyMs: 450,
      tokenCount: 1420
    });

    return {
      subject: subject || 'Computer Science',
      topic: topic || 'Core Fundamentals',
      summary: `Comprehensive academic curriculum for ${topic || 'selected concepts'} parsed by Gemma 4.`,
      concepts,
      questions,
      bossBattle
    };
  }

  /**
   * Demo fallback for adaptive remediation
   */
  _generateDemoRemediation({ conceptName, conceptSummary, failedQuestion, studentAnswer, retryCount }) {
    return {
      tutorExplanation: `Let's break down **${conceptName}** simply! The mistake on "${studentAnswer}" is very common. Remember: ${conceptSummary} Think of it like a set of building blocks where each step depends directly on the foundational rule.`,
      extraHint: `Focus on the core principle of ${conceptName}: look at the primary relationship, not the secondary factors.`,
      newQuestion: {
        id: `retry_${Date.now()}`,
        conceptId: failedQuestion.conceptId,
        conceptName: conceptName,
        type: failedQuestion.type === 'quiz' ? 'gap' : 'quiz',
        difficulty: 'beginner',
        prompt: `Let's test "${conceptName}" from another angle: Which statement accurately characterizes this principle?`,
        options: [
          `It operates under the rule that ${conceptSummary.slice(0, 40)}...`,
          `It is completely unrelated to ${conceptName}`,
          `It only occurs when conditions are negative`,
          `It cancels out all previous effects`
        ],
        correctAnswer: `It operates under the rule that ${conceptSummary.slice(0, 40)}...`,
        sentenceBefore: `Understanding ${conceptName} requires knowing that its main effect is`,
        targetWord: 'proportional',
        sentenceAfter: `to the input forces.`,
        wordBank: ['proportional', 'arbitrary', 'negligible', 'inverted'],
        explanation: `This confirms your mastery of ${conceptName} from an alternative perspective!`,
        hint: `Recall our tutor discussion above.`,
        xpReward: 70
      }
    };
  }
}

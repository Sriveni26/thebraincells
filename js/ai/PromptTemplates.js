/**
 * PromptTemplates.js
 * High-precision structured prompt engineering for Google Gemma 4 (gemma-4-26b-a4b-it & local gemma4).
 */

export const PromptTemplates = {
  /**
   * System instruction to enforce rigorous JSON extraction from academic content.
   */
  ACADEMIC_SYSTEM_INSTRUCTION: `You are Gemma 4, Google DeepMind's premier educational AI model and expert pedagogical tutor.
Your task is to analyze academic material (from textbooks, lecture notes, or research) and generate an adaptive educational curriculum and interactive mini-game questions.

CRITICAL RULES:
1. Grounding: All concepts, questions, and answers MUST be 100% faithfully grounded in the provided academic text. Do NOT fabricate unsupported facts.
2. Output format: You MUST reply with ONLY a single valid JSON object. Do not include introductory text, conversational remarks, or markdown wrapping outside the JSON.
3. Pedagogy: Questions must test conceptual understanding, critical thinking, and application rather than superficial word-matching.`,

  /**
   * User prompt template for initial content breakdown and question generation.
   */
  buildContentAnalysisPrompt({ text, subject, topic, difficulty, questionCount }) {
    return `Analyze the following academic content and generate an adaptive learning session with ${questionCount} questions.

Subject: ${subject || 'Academic Studies'}
Topic: ${topic || 'Core Principles'}
Target Initial Difficulty: ${difficulty || 'adaptive'}

ACADEMIC SOURCE TEXT:
"""
${text}
"""

Generate a JSON object matching this EXACT schema:
{
  "subject": "${subject || 'Academic Studies'}",
  "topic": "${topic || 'Core Principles'}",
  "summary": "Brief 2-sentence summary of the main ideas",
  "concepts": [
    {
      "id": "concept_1",
      "name": "Name of primary concept",
      "summary": "Clear, concise definition of this concept based on the text",
      "baselineDifficulty": "beginner | intermediate | advanced"
    }
  ],
  "questions": [
    {
      "id": "q_1",
      "conceptId": "concept_1",
      "conceptName": "Name of concept",
      "type": "quiz",
      "difficulty": "beginner",
      "prompt": "Clear, engaging academic question testing this concept",
      "options": [
        "Plausible Distractor A",
        "Correct Answer",
        "Plausible Distractor C",
        "Plausible Distractor D"
      ],
      "correctAnswer": "Correct Answer",
      "explanation": "Why this is correct grounded directly in the text",
      "hint": "Gentle guiding hint without giving away the direct answer",
      "xpReward": 100
    },
    {
      "id": "q_2",
      "conceptId": "concept_1",
      "conceptName": "Name of concept",
      "type": "gap",
      "difficulty": "beginner",
      "sentenceBefore": "Text before the blank",
      "targetWord": "TargetWord",
      "sentenceAfter": "text after the blank.",
      "wordBank": ["TargetWord", "Distractor1", "Distractor2", "Distractor3"],
      "correctAnswer": "TargetWord",
      "explanation": "Explanation of the term's role in this context",
      "hint": "Definition or mnemonic hint",
      "xpReward": 100
    },
    {
      "id": "q_3",
      "conceptId": "concept_2",
      "conceptName": "Second concept",
      "type": "truefalse",
      "difficulty": "intermediate",
      "prompt": "An academic statement based on the text",
      "isTrue": true,
      "correctAnswer": true,
      "explanation": "Detailed rationale verifying or debunking the statement",
      "hint": "Check the exact conditions mentioned in the text",
      "xpReward": 100
    },
    {
      "id": "q_4",
      "conceptId": "concept_2",
      "conceptName": "Second concept",
      "type": "match",
      "difficulty": "intermediate",
      "prompt": "Match each term with its correct definition or formula",
      "pairs": [
        {"term": "Term A", "match": "Definition A"},
        {"term": "Term B", "match": "Definition B"},
        {"term": "Term C", "match": "Definition C"}
      ],
      "explanation": "Summary of these paired relationships",
      "hint": "Focus on the defining characteristics of each term",
      "xpReward": 100
    },
    {
      "id": "q_5",
      "conceptId": "concept_3",
      "conceptName": "Third concept",
      "type": "mistake",
      "difficulty": "advanced",
      "prompt": "One segment in this academic statement contains a factual error according to the source. Identify the faulty segment:",
      "segments": ["First correct segment", "The faulty incorrect segment", "Another correct segment"],
      "faultyIndex": 1,
      "correctAnswer": "The faulty incorrect segment",
      "correction": "What the correct phrasing or fact should be",
      "explanation": "Why this segment was incorrect based on the text",
      "hint": "Look for swapped terms or inverted relationships",
      "xpReward": 100
    }
  ],
  "bossBattle": {
    "bossName": "Mastery Sentinel: Synthesis Trial",
    "description": "Synthesizes all ${subject} concepts into a 3-phase challenge",
    "phases": [
      {
        "phaseNumber": 1,
        "challenge": "Synthesizing Core Concepts",
        "question": "Question testing cross-concept relationship",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "damage": 35
      },
      {
        "phaseNumber": 2,
        "challenge": "Application Under Constraint",
        "question": "Higher difficulty scenario question",
        "options": ["W", "X", "Y", "Z"],
        "correctAnswer": "X",
        "damage": 35
      },
      {
        "phaseNumber": 3,
        "challenge": "Definitive Evaluation",
        "question": "Advanced synthesis question",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": "Option 1",
        "damage": 30
      }
    ]
  }
}

Include diverse question types ('quiz', 'gap', 'truefalse', 'match', 'mistake') totaling ${questionCount} questions. Ensure valid JSON output only!`;
  },

  /**
   * User prompt for adaptive remediation when student misses a question.
   * Generates a NEW question pattern for the SAME concept.
   */
  buildAdaptiveRemediationPrompt({ conceptName, conceptSummary, failedQuestion, studentAnswer, retryCount }) {
    return `The student struggled with the following concept and provided an incorrect answer:

Concept: "${conceptName}"
Concept Summary: "${conceptSummary}"
Previous Question Prompt: "${failedQuestion.prompt || failedQuestion.sentenceBefore + ' ___ ' + failedQuestion.sentenceAfter}"
Previous Question Type: "${failedQuestion.type}"
Student's Incorrect Answer: "${studentAnswer}"
Attempt Number: ${retryCount + 1}

You must act as a supportive Gemma 4 AI Academic Tutor.
1. Formulate a simple, encouraging explanation of the concept (without shaming). Explain WHY the misconception happens and HOW to think about it correctly using a relatable analogy or concrete example.
2. Provide a new, gentle hint.
3. Formulate a BRAND NEW question testing this SAME concept ("${conceptName}") using a DIFFERENT question pattern (e.g. if the previous was 'quiz', use 'gap', 'truefalse', or a simpler scenario).

Respond with ONLY this JSON structure:
{
  "tutorExplanation": "Encouraging, clear explanation clarifying the core concept simply and explaining the mistake warmly.",
  "extraHint": "A memorable mnemonic or clear clue.",
  "newQuestion": {
    "id": "retry_${Date.now()}",
    "conceptId": "${failedQuestion.conceptId}",
    "conceptName": "${conceptName}",
    "type": "${failedQuestion.type === 'quiz' ? 'gap' : 'quiz'}",
    "difficulty": "beginner",
    "prompt": "Fresh question prompt testing the exact same concept in a new angle",
    "options": ["Plausible A", "Correct Answer", "Plausible C", "Plausible D"],
    "correctAnswer": "Correct Answer",
    "explanation": "Why this new question confirms understanding of ${conceptName}",
    "hint": "Gentle clue",
    "xpReward": 70
  }
}`;
  }
};

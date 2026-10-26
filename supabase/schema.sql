-- ==============================================================================
-- LEARNPLAY: SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATIONS
-- Version: 4.0.0
-- Architecture: Row Level Security (RLS), Indexed Foreign Keys, Automated XP Accounting
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    player_rank TEXT NOT NULL DEFAULT 'Beginner Learner',
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    best_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
    daily_goal_xp INTEGER NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. STUDY MATERIALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    content_text TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_study_materials_user ON public.study_materials(user_id);
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own study materials"
    ON public.study_materials FOR ALL
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. TOPICS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_topics_material ON public.topics(material_id);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access topics of their materials"
    ON public.topics FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.study_materials sm
        WHERE sm.id = topics.material_id AND sm.user_id = auth.uid()
    ));

-- ------------------------------------------------------------------------------
-- 4. CONCEPTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    summary TEXT NOT NULL,
    baseline_difficulty TEXT NOT NULL DEFAULT 'Level 1: Beginner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_concepts_topic ON public.concepts(topic_id);
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access concepts of their topics"
    ON public.concepts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.topics t
        JOIN public.study_materials sm ON sm.id = t.material_id
        WHERE t.id = concepts.topic_id AND sm.user_id = auth.uid()
    ));

-- ------------------------------------------------------------------------------
-- 5. QUESTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL, -- 'quiz', 'gap', 'match', 'truefalse', 'mistake', 'memory', 'clock', 'steps'
    difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    prompt TEXT NOT NULL,
    options JSONB, -- Array of distractor/answer choices
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    hint TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_questions_concept ON public.questions(concept_id);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read questions of their concepts"
    ON public.questions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.concepts c
        JOIN public.topics t ON t.id = c.topic_id
        JOIN public.study_materials sm ON sm.id = t.material_id
        WHERE c.id = questions.concept_id AND sm.user_id = auth.uid()
    ));

-- ------------------------------------------------------------------------------
-- 6. LEARNING SESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    total_xp_earned INTEGER NOT NULL DEFAULT 0,
    average_mastery NUMERIC(5, 2) DEFAULT 0.00,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON public.learning_sessions(user_id);
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own learning sessions"
    ON public.learning_sessions FOR ALL
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. QUESTION ATTEMPTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    student_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    difficulty_at_attempt INTEGER NOT NULL DEFAULT 1,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_attempts_session ON public.question_attempts(session_id);
CREATE INDEX idx_attempts_concept ON public.question_attempts(concept_id);
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own question attempts"
    ON public.question_attempts FOR ALL
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. CONCEPT MASTERY TABLE (Adaptive State Tracker)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concept_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    current_difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (current_difficulty_level BETWEEN 1 AND 5),
    attempts_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    first_attempt_count INTEGER NOT NULL DEFAULT 0,
    mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
    needs_revision BOOLEAN NOT NULL DEFAULT FALSE,
    last_practiced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '1 day',
    UNIQUE (user_id, concept_id)
);

CREATE INDEX idx_concept_mastery_user ON public.concept_mastery(user_id);
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their concept mastery records"
    ON public.concept_mastery FOR ALL
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. XP TRANSACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    source_type TEXT NOT NULL, -- 'first_attempt', 'retry', 'mini_game', 'session_complete', 'daily_goal', 'topic_master'
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_xp_tx_user ON public.xp_transactions(user_id);
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their XP transactions"
    ON public.xp_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. ACHIEVEMENTS & 11. USER ACHIEVEMENTS TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 100
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are publicly readable"
    ON public.achievements FOR SELECT
    USING (true);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their unlocked achievements"
    ON public.user_achievements FOR ALL
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 12. REVISION SCHEDULE TABLE (Spaced Repetition)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revision_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '1 day',
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'dismissed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_revision_schedule_user ON public.revision_schedule(user_id);
ALTER TABLE public.revision_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their revision schedule"
    ON public.revision_schedule FOR ALL
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- SEED INITIAL ACHIEVEMENTS
-- ------------------------------------------------------------------------------
INSERT INTO public.achievements (slug, title, description, icon, xp_reward)
VALUES 
    ('b_first_game', 'First Game Completed', 'Finish your first learning session.', '🎮', 100),
    ('b_five_correct', 'Five Correct Answers', 'Answer 5 questions correctly.', '🎯', 100),
    ('b_retry_champion', 'Retry Champion', 'Master a concept on a retry attempt.', '🔄', 100),
    ('b_comeback_learner', 'Comeback Learner', 'Recover from an error with guidance.', '💪', 100),
    ('b_difficulty_climber', 'Difficulty Climber', 'Unlock an advanced difficulty challenge.', '🧗', 100),
    ('b_topic_master', 'Topic Master', 'Attain 80%+ mastery across a whole topic.', '🌟', 200),
    ('b_three_streak', 'Three-Day Streak', 'Maintain learning momentum for 3 sessions.', '🔥', 150),
    ('b_seven_streak', 'Seven-Day Streak', 'Achieve a 7-question winning streak.', '⚡', 200),
    ('b_boss_slayer', 'Sentinel Conqueror', 'Defeat the Concept Boss Battle.', '⚔️', 250)
ON CONFLICT (slug) DO NOTHING;

-- Wordle daily words (5 or 6 letters). One word per day via deterministic index.
CREATE TABLE wordle_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  definition_usage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wordle_words_word ON wordle_words(word);
CREATE INDEX idx_wordle_words_created_at ON wordle_words(created_at);

ALTER TABLE wordle_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon wordle_words" ON wordle_words FOR ALL USING (false);

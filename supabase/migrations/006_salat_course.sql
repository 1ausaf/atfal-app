-- Salat course: 13 categories (placeholders; 007 restructures to 14 with full content)
CREATE TABLE IF NOT EXISTS salat_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order" INT NOT NULL UNIQUE CHECK ("order" >= 1 AND "order" <= 13),
  title TEXT NOT NULL,
  title_ar TEXT,
  content_ar TEXT,
  content_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salat_categories_order ON salat_categories("order");

CREATE TABLE IF NOT EXISTS salat_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES salat_categories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'ready_for_test', 'passed', 'failed')),
  requested_at TIMESTAMPTZ,
  tested_at TIMESTAMPTZ,
  tested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_salat_progress_user ON salat_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_salat_progress_category ON salat_progress(category_id);
CREATE INDEX IF NOT EXISTS idx_salat_progress_status ON salat_progress(status) WHERE status = 'ready_for_test';

ALTER TABLE users ADD COLUMN IF NOT EXISTS salat_superstar BOOLEAN NOT NULL DEFAULT false;

INSERT INTO salat_categories ("order", title, title_ar, content_ar, content_en) VALUES
(1, 'Niyaah', 'نية', NULL, 'Declaration of intention.'),
(2, 'Takbir', 'تكبير', NULL, 'Allahu Akbar.'),
(3, 'Thanaa', 'ثناء', NULL, 'Glorification of Allah.'),
(4, 'Ta''awwudh', 'تعوذ', NULL, 'Seeking refuge.'),
(5, 'Surah Al Fatiha', 'سورة الفاتحة', NULL, 'Surah Al-Fatiha.'),
(6, 'Surah (Short)', NULL, NULL, 'Short surah.'),
(7, 'Ruku''', 'ركوع', NULL, 'Bowing.'),
(8, 'Tasmi''', 'تسميع', NULL, 'Rising from Ruku.'),
(9, 'Tahmid', 'تحميد', NULL, 'After Tasmi.'),
(10, 'Sajdah', 'سجدة', NULL, 'Prostration.'),
(11, 'Jilsah', 'جلسة', NULL, 'First sitting.'),
(12, 'Qa''dah', 'قعدة', NULL, 'Tashahhud and Durud.'),
(13, 'Salam', 'السلام', NULL, 'End of prayer.')
ON CONFLICT ("order") DO NOTHING;

ALTER TABLE salat_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE salat_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon salat_categories" ON salat_categories FOR ALL USING (false);
CREATE POLICY "No anon salat_progress" ON salat_progress FOR ALL USING (false);

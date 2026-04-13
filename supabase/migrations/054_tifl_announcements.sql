-- Tifl announcements (regional nazim/admin) and per-user dismissals (once per announcement).

CREATE TABLE tifl_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_tifl_announcements_created_at ON tifl_announcements(created_at DESC);

CREATE TABLE tifl_announcement_dismissals (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES tifl_announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

CREATE INDEX idx_tifl_announcement_dismissals_user ON tifl_announcement_dismissals(user_id);

ALTER TABLE tifl_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon tifl_announcements" ON tifl_announcements FOR ALL USING (false);

ALTER TABLE tifl_announcement_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon tifl_announcement_dismissals" ON tifl_announcement_dismissals FOR ALL USING (false);

-- =====================================================
-- СИСТЕМА КОЛЛАБОВ — ДВУСТОРОННИЙ КОНТРАКТ
-- =====================================================

-- -----------------------------
-- Таблица: collabs
-- -----------------------------
CREATE TABLE IF NOT EXISTS collabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  author1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  title VARCHAR(255) NOT NULL,
  description TEXT,

  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'active', 'paused', 'delete_requested', 'archived')),

  paused_by UUID REFERENCES auth.users(id),
  delete_requested_by UUID REFERENCES auth.users(id),

  author1_share DECIMAL(5,2) NOT NULL DEFAULT 50 CHECK (author1_share >= 0 AND author1_share <= 100),
  author2_share DECIMAL(5,2) NOT NULL DEFAULT 50 CHECK (author2_share >= 0 AND author2_share <= 100),

  pending_author1_share DECIMAL(5,2),
  pending_author2_share DECIMAL(5,2),
  share_change_requested_by UUID REFERENCES auth.users(id),

  author1_confirmed BOOLEAN DEFAULT FALSE,
  author2_confirmed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  CONSTRAINT different_authors CHECK (author1_id <> author2_id),
  CONSTRAINT shares_sum_100 CHECK (author1_share + author2_share = 100)
);

-- -----------------------------
-- Таблица: collab_materials
-- -----------------------------
CREATE TABLE IF NOT EXISTS collab_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_id UUID NOT NULL REFERENCES collabs(id) ON DELETE CASCADE,

  owner_id UUID NOT NULL REFERENCES auth.users(id),
  service_id UUID REFERENCES author_services(id) ON DELETE SET NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  preview_url TEXT,

  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  pending_approval_from UUID REFERENCES auth.users(id),
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- -----------------------------
-- Таблица: collab_history
-- -----------------------------
CREATE TABLE IF NOT EXISTS collab_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_id UUID NOT NULL REFERENCES collabs(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------
-- Индексы
-- -----------------------------
CREATE INDEX IF NOT EXISTS idx_collabs_author1 ON collabs(author1_id);
CREATE INDEX IF NOT EXISTS idx_collabs_author2 ON collabs(author2_id);
CREATE INDEX IF NOT EXISTS idx_collabs_status ON collabs(status);

CREATE INDEX IF NOT EXISTS idx_collab_materials_collab ON collab_materials(collab_id);
CREATE INDEX IF NOT EXISTS idx_collab_materials_owner ON collab_materials(owner_id);

CREATE INDEX IF NOT EXISTS idx_collab_history_collab ON collab_history(collab_id);

-- -----------------------------
-- updated_at trigger
-- -----------------------------
CREATE OR REPLACE FUNCTION update_collab_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS collabs_updated_at ON collabs;
CREATE TRIGGER collabs_updated_at
  BEFORE UPDATE ON collabs
  FOR EACH ROW
  EXECUTE FUNCTION update_collab_timestamp();

-- -----------------------------
-- RLS
-- -----------------------------
ALTER TABLE collabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_history ENABLE ROW LEVEL SECURITY;

-- -------- collabs policies
DROP POLICY IF EXISTS collabs_select ON collabs;
CREATE POLICY collabs_select ON collabs
  FOR SELECT USING (auth.uid() = author1_id OR auth.uid() = author2_id);

DROP POLICY IF EXISTS collabs_insert ON collabs;
CREATE POLICY collabs_insert ON collabs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS collabs_update ON collabs;
CREATE POLICY collabs_update ON collabs
  FOR UPDATE USING (auth.uid() = author1_id OR auth.uid() = author2_id);

-- -------- collab_materials policies
DROP POLICY IF EXISTS collab_materials_select ON collab_materials;
CREATE POLICY collab_materials_select ON collab_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collabs
      WHERE collabs.id = collab_materials.collab_id
        AND (auth.uid() = author1_id OR auth.uid() = author2_id)
    )
  );

DROP POLICY IF EXISTS collab_materials_insert ON collab_materials;
CREATE POLICY collab_materials_insert ON collab_materials
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS collab_materials_update ON collab_materials;
CREATE POLICY collab_materials_update ON collab_materials
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM collabs
      WHERE collabs.id = collab_materials.collab_id
        AND (auth.uid() = author1_id OR auth.uid() = author2_id)
    )
  );

-- -------- collab_history policies
DROP POLICY IF EXISTS collab_history_select ON collab_history;
CREATE POLICY collab_history_select ON collab_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collabs
      WHERE collabs.id = collab_history.collab_id
        AND (auth.uid() = author1_id OR auth.uid() = author2_id)
    )
  );

DROP POLICY IF EXISTS collab_history_insert ON collab_history;
CREATE POLICY collab_history_insert ON collab_history
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

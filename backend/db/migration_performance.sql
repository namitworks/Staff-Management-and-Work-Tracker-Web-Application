USE ddinfoways_staff;

ALTER TABLE performance
  ADD COLUMN IF NOT EXISTS category ENUM(
    'technical',
    'communication',
    'teamwork',
    'punctuality',
    'leadership',
    'general'
  ) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT 0;

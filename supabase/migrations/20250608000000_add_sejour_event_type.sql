-- Add 'sejour' to event_type allowed values
-- Handles both CHECK constraint and PostgreSQL enum column types

DO $$
DECLARE
  constraint_rec RECORD;
  enum_rec RECORD;
BEGIN
  -- Case 1: event_type has a CHECK constraint
  FOR constraint_rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'events'
      AND tc.constraint_type = 'CHECK'
      AND cc.check_clause LIKE '%event_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.events DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
    EXECUTE 'ALTER TABLE public.events ADD CONSTRAINT events_event_type_check ' ||
      'CHECK (event_type IN (''concert'', ''vente'', ''repetition'', ''sejour'', ''autre''))';
    RETURN;
  END LOOP;

  -- Case 2: event_type uses a PostgreSQL enum (udt_name matches a custom type)
  FOR enum_rec IN
    SELECT c.udt_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'events'
      AND c.column_name = 'event_type'
      AND c.udt_name NOT IN ('text', 'varchar', 'char')
  LOOP
    EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS ''sejour''', enum_rec.udt_name);
    RETURN;
  END LOOP;

  -- Case 3: No constraint found - column may be plain text, nothing to do
  NULL;
END;
$$;

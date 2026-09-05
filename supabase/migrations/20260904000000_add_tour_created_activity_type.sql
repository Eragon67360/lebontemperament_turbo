-- The tour POST handler inserts activities.type = 'tour_created', but the enum
-- never had the value: the insert failed at runtime and the activity entry was
-- silently lost. Applied to remote via Management API on 2026-09-04.
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'tour_created';

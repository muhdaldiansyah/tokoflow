-- Migration 038: Reload PostgREST schema cache after column additions
NOTIFY pgrst, 'reload schema';

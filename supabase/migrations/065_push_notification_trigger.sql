-- Migration 065: Push notification trigger
-- Calls send-push Edge Function on orders INSERT/UPDATE via pg_net

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_push_on_order() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM net.http_post(
      url := 'https://eafccoajzmanyflfidlg.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'orders',
        'schema', 'public',
        'record', row_to_json(NEW),
        'old_record', NULL
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM net.http_post(
      url := 'https://eafccoajzmanyflfidlg.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'orders',
        'schema', 'public',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_push_on_order ON orders;
CREATE TRIGGER trg_push_on_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_on_order();

-- Fix audit_logs: Remove client-side INSERT capability and implement server-side only logging

-- Drop the existing INSERT policy that allows any authenticated user to insert
DROP POLICY IF EXISTS "Users can create audit entries" ON public.audit_logs;

-- Create a SECURITY DEFINER function to insert audit logs (only callable by triggers/system)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _user_id uuid,
  _action text,
  _table_name text,
  _record_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details, created_at)
  VALUES (_user_id, _action, _table_name, _record_id, _details, now());
END;
$$;

-- Create trigger function to automatically log lead access/changes
CREATE OR REPLACE FUNCTION public.audit_lead_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action text;
  _details jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'CREATE';
    _details := jsonb_build_object('new_data', row_to_json(NEW));
    PERFORM public.log_audit_event(auth.uid(), _action, 'leads', NEW.id, _details);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'UPDATE';
    _details := jsonb_build_object(
      'old_data', row_to_json(OLD),
      'new_data', row_to_json(NEW),
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(row_to_json(NEW)::jsonb)
        WHERE row_to_json(OLD)::jsonb->key IS DISTINCT FROM value
      )
    );
    PERFORM public.log_audit_event(auth.uid(), _action, 'leads', NEW.id, _details);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'DELETE';
    _details := jsonb_build_object('old_data', row_to_json(OLD));
    PERFORM public.log_audit_event(auth.uid(), _action, 'leads', OLD.id, _details);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on leads table for automatic audit logging
DROP TRIGGER IF EXISTS audit_leads_trigger ON public.leads;
CREATE TRIGGER audit_leads_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_lead_changes();
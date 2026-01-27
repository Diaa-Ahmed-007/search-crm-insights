-- Drop the overly permissive UPDATE policy for sales
DROP POLICY IF EXISTS "Sales can update their leads" ON public.leads;

-- Create a more restrictive UPDATE policy that prevents sales from changing assignment
-- Sales can only update leads they created or are assigned to, but cannot modify assigned_to field
CREATE POLICY "Sales can update lead details only"
ON public.leads
FOR UPDATE
USING (
  (auth.uid() = assigned_to OR auth.uid() = created_by)
  AND NOT has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (auth.uid() = assigned_to OR auth.uid() = created_by)
  AND NOT has_role(auth.uid(), 'admin'::app_role)
);

-- Create a function to prevent sales from changing sensitive assignment fields
CREATE OR REPLACE FUNCTION public.prevent_lead_reassignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for non-admin users
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    -- Prevent changing assigned_to unless you're an admin
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      RAISE EXCEPTION 'Only administrators can reassign leads';
    END IF;
    -- Prevent changing created_by
    IF OLD.created_by IS DISTINCT FROM NEW.created_by THEN
      RAISE EXCEPTION 'Cannot modify lead creator';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce the restriction
DROP TRIGGER IF EXISTS enforce_lead_reassignment ON public.leads;
CREATE TRIGGER enforce_lead_reassignment
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.prevent_lead_reassignment();

-- Create audit_logs table for tracking sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert their own audit entries
CREATE POLICY "Users can create audit entries"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
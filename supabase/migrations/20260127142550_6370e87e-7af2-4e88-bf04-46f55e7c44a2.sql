-- Fix profiles table SELECT policies to use PERMISSIVE (OR logic)
-- This ensures admins can view all profiles OR users can view their own

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add explicit RESTRICTIVE policies to audit_logs to prevent tampering
-- These block all direct INSERT, UPDATE, DELETE from users (only trigger can populate)

CREATE POLICY "Block direct inserts to audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block updates to audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Block deletes from audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);
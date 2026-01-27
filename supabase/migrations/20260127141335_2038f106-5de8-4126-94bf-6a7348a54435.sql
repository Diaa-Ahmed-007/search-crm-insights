-- Fix leads table SELECT policies to use PERMISSIVE (OR logic)
-- This ensures sales staff can ONLY view their assigned leads, while admins can view all

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Sales can view assigned leads" ON public.leads;

-- Create PERMISSIVE SELECT policies (OR logic between them)
-- Admins can view all leads
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sales can ONLY view leads they created or are assigned to
CREATE POLICY "Sales can view assigned leads"
ON public.leads
FOR SELECT
TO authenticated
USING (auth.uid() = assigned_to OR auth.uid() = created_by);
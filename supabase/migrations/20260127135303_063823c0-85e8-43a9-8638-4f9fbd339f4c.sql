-- Fix profiles table: Change RESTRICTIVE policies to PERMISSIVE for proper OR-based access

-- Drop existing RESTRICTIVE SELECT policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies (OR logic - either condition allows access)
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

-- Fix leads table: Change RESTRICTIVE policies to PERMISSIVE for proper OR-based access

-- Drop existing RESTRICTIVE SELECT policies
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Sales can view assigned leads" ON public.leads;

-- Recreate as PERMISSIVE policies (OR logic)
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can view assigned leads"
ON public.leads
FOR SELECT
TO authenticated
USING ((auth.uid() = assigned_to) OR (auth.uid() = created_by));
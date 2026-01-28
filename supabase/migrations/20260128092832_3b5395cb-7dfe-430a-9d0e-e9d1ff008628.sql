-- Fix user_roles table: Ensure only authenticated users can access
-- Current policies already use has_role() for admin checks and auth.uid() for user checks
-- But we need to ensure anonymous users cannot access at all

-- Add explicit policy to block anonymous access
DROP POLICY IF EXISTS "Block anonymous access to user_roles" ON public.user_roles;
CREATE POLICY "Block anonymous access to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Fix leads table: Block anonymous access completely
DROP POLICY IF EXISTS "Block anonymous access to leads" ON public.leads;
CREATE POLICY "Block anonymous access to leads"
ON public.leads
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Fix projects table: Strengthen access control
-- Keep current view policy for authenticated users but block anonymous
DROP POLICY IF EXISTS "Block anonymous access to projects" ON public.projects;
CREATE POLICY "Block anonymous access to projects"
ON public.projects
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Also block anonymous access to areas and units for consistency
DROP POLICY IF EXISTS "Block anonymous access to areas" ON public.areas;
CREATE POLICY "Block anonymous access to areas"
ON public.areas
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "Block anonymous access to units" ON public.units;
CREATE POLICY "Block anonymous access to units"
ON public.units
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Block anonymous access to profiles
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);
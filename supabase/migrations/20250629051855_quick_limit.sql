/*
  # Fix Employee RLS Policies for Initial Admin Creation

  1. Security Updates
    - Update the "Allow initial admin creation" policy to work correctly
    - Ensure the policy allows both anon and authenticated users to create the first admin
    - Fix the condition to properly check for zero admin accounts

  2. Policy Changes
    - Recreate the initial admin creation policy with proper conditions
    - Ensure the policy works for both anon and authenticated roles
*/

-- Drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Allow initial admin creation" ON employees;

-- Recreate the policy with better conditions
CREATE POLICY "Allow initial admin creation" ON employees
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow insertion only when there are no admin employees at all
    NOT EXISTS (
      SELECT 1 FROM employees 
      WHERE role = 'admin'
    )
  );

-- Also ensure we have a policy for authenticated users to insert employees (for admins)
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON employees;

CREATE POLICY "Authenticated users can insert employees" ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is an admin
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = (auth.uid()::text)::bigint 
      AND role = 'admin' 
      AND is_active = true
    )
    OR
    -- Or if this is the initial admin creation (no admins exist)
    NOT EXISTS (
      SELECT 1 FROM employees 
      WHERE role = 'admin'
    )
  );
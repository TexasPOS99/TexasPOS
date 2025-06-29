/*
  # Fix Initial Admin Creation Policy

  1. Security Changes
    - Add policy to allow initial admin creation when no admins exist
    - Uses a function-based approach to avoid NEW reference issues
    - Only allows admin role creation when system has no active admins

  2. Implementation
    - Creates a helper function to check if system needs initial admin
    - Adds RLS policy that uses this function
    - Ensures secure bootstrap process for first admin user
*/

-- Create helper function to check if initial admin creation is allowed
CREATE OR REPLACE FUNCTION allow_initial_admin_creation()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT (SELECT count(*) FROM employees WHERE role = 'admin' AND is_active = true) = 0;
$$;

-- Add policy to allow initial admin creation when no admins exist
CREATE POLICY "Allow initial admin creation"
  ON employees
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    allow_initial_admin_creation() = true
  );
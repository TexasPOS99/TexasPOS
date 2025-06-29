/*
  # Fix Initial Admin Creation Policy

  1. Security Changes
    - Add policy to allow initial admin creation when no admins exist
    - This enables the system to bootstrap with a default admin account
    - Policy is restrictive and only allows admin creation when the table has no admin users

  2. Changes Made
    - Add "Allow initial admin creation" policy for INSERT operations
    - Policy checks that no admin users currently exist before allowing insertion
    - This solves the RLS violation during system initialization
*/

-- Add policy to allow initial admin creation when no admins exist
CREATE POLICY "Allow initial admin creation"
  ON employees
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Only allow if no admin users currently exist
    (SELECT count(*) FROM employees WHERE role = 'admin' AND is_active = true) = 0
    AND NEW.role = 'admin'
  );
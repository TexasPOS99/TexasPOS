/*
  # Fix initial admin creation policy

  1. Changes
    - Drop the existing policy that references a non-existent function
    - Create a new policy that allows initial admin creation when no admins exist
    - Ensure the policy works for both anon and authenticated users

  2. Security
    - Only allows creation when no admin users exist
    - Prevents unauthorized admin creation after initial setup
*/

-- Drop the existing policy that references the non-existent function
DROP POLICY IF EXISTS "Allow initial admin creation" ON employees;

-- Create a new policy that allows initial admin creation
CREATE POLICY "Allow initial admin creation" ON employees
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow creation only if no admin users exist
    (SELECT COUNT(*) FROM employees WHERE role = 'admin') = 0
  );
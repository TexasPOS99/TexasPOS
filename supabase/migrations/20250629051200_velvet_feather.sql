/*
  # Add policy for initial admin creation

  1. Security Changes
    - Add policy to allow creating the first admin account when no admins exist
    - This enables the system to bootstrap itself with an initial admin user
    - Policy is restrictive and only allows admin role creation when table is empty of admins

  2. Policy Details
    - Allows INSERT operations for admin role only
    - Only when no existing admin accounts are found
    - Uses anon role to enable initial setup
*/

-- Create policy to allow initial admin creation when no admins exist
CREATE POLICY "Allow initial admin creation"
  ON employees
  FOR INSERT
  TO anon
  WITH CHECK (
    role = 'admin' AND
    NOT EXISTS (
      SELECT 1 FROM employees 
      WHERE role = 'admin' AND is_active = true
    )
  );
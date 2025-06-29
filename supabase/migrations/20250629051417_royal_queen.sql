/*
  # Fix initial admin creation RLS policy

  1. Functions
    - Create `allow_initial_admin_creation()` function to check if any admin exists
    - This allows creating the first admin account when no admins exist

  2. Security
    - Update RLS policy to properly handle initial admin creation
    - Ensure the function works correctly with the existing policy

  3. Notes
    - This fixes the RLS violation when trying to create the default admin
    - The function returns true only when no active admin accounts exist
*/

-- Create function to check if initial admin creation is allowed
CREATE OR REPLACE FUNCTION allow_initial_admin_creation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow creation if no active admin exists
  RETURN NOT EXISTS (
    SELECT 1 FROM employees 
    WHERE role = 'admin' AND is_active = true
  );
END;
$$;

-- Update the existing policy to ensure it works correctly
DROP POLICY IF EXISTS "Allow initial admin creation" ON employees;

CREATE POLICY "Allow initial admin creation"
  ON employees
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (allow_initial_admin_creation() = true);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION allow_initial_admin_creation() TO anon;
GRANT EXECUTE ON FUNCTION allow_initial_admin_creation() TO authenticated;
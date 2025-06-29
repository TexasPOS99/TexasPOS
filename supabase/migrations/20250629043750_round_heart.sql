/*
  # Populate Employee Data

  1. Employee Records
    - Insert all employees from the provided data
    - Set appropriate roles (Admin for เนม, employee for others)
    - Ensure all employees are active by default

  2. Data Details
    - PIN 2483: เนม (Admin)
    - PIN 1516: ใหม่ (Employee)
    - PIN 1903: เฟิส (Employee)
    - PIN 2111: มิก (Employee)
    - PIN 0106: นัท (Employee)
*/

-- Insert employee data
INSERT INTO employees (pin, name, role, is_active) VALUES
  ('2483', 'เนม', 'admin', true),
  ('1516', 'ใหม่', 'employee', true),
  ('1903', 'เฟิส', 'employee', true),
  ('2111', 'มิก', 'employee', true),
  ('0106', 'นัท', 'employee', true)
ON CONFLICT (pin) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();
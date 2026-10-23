-- Dedicated Campus Eye admin portal account
-- Email: Admin@admin.com
-- Password: Admin1234
USE smart_campus_waste;

INSERT INTO users (role_id, first_name, last_name, email, password_hash, phone, is_active)
SELECT 1, 'System', 'Admin', 'Admin@admin.com', '$2y$10$UIoQaIsD2ae/gyUdaxF3j.1L..PyfReFdCPEPLdT8gy3IYceDCj7y', NULL, 1
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'Admin@admin.com' AND deleted_at IS NULL
);

UPDATE users
SET role_id = 1,
    first_name = 'System',
    last_name = 'Admin',
    password_hash = '$2y$10$UIoQaIsD2ae/gyUdaxF3j.1L..PyfReFdCPEPLdT8gy3IYceDCj7y',
    is_active = 1,
    deleted_at = NULL
WHERE email = 'Admin@admin.com';

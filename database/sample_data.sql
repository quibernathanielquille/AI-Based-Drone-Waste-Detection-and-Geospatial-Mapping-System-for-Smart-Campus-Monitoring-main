-- Sample Data for Smart Campus Waste Detection System
USE smart_campus_waste;

INSERT INTO roles (name, slug, description) VALUES
('Administrator', 'administrator', 'Full system access including user management'),
('Personnel', 'environmental_officer', 'Campus waste monitoring and reporting');

-- Password for sample campus users: password
-- Admin portal login: Admin@admin.com / Admin1234
INSERT INTO users (role_id, first_name, last_name, email, password_hash, phone, is_active) VALUES
(1, 'System', 'Admin', 'Admin@admin.com', '$2y$10$UIoQaIsD2ae/gyUdaxF3j.1L..PyfReFdCPEPLdT8gy3IYceDCj7y', NULL, 1),
(1, 'Maria', 'Santos', 'admin@campus.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '09171234501', 1),
(2, 'Juan', 'Reyes', 'officer@campus.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '09171234502', 1),
(2, 'Ana', 'Cruz', 'ana.cruz@campus.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '09171234503', 1);

INSERT INTO waste_detections (detected_by, waste_category, latitude, longitude, confidence_score, detection_date, detection_time, description, zone_name, is_hotspot, status) VALUES
(2, 'plastic', 7.31353980, 125.67035530, 94.50, CURDATE(), '08:30:00', 'Plastic bottles near cafeteria', 'Main Campus Cafeteria', 1, 'verified'),
(2, 'biodegradable', 7.31382780, 125.67063330, 88.20, CURDATE(), '09:15:00', 'Food waste accumulation', 'Student Center', 1, 'pending'),
(2, 'paper', 7.31322780, 125.66993330, 91.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '14:20:00', 'Scattered paper near library', 'DNSC Library', 0, 'verified'),
(3, 'metal', 7.31412780, 125.67113330, 87.30, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '11:00:00', 'Metal cans near parking', 'Campus Parking Area', 0, 'resolved'),
(2, 'glass', 7.31292780, 125.66963330, 92.10, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '16:45:00', 'Broken glass fragments', 'Science Laboratory', 1, 'verified'),
(3, 'cardboard', 7.31452780, 125.67163330, 85.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '10:30:00', 'Cardboard boxes near dumpster', 'Engineering Building', 0, 'pending'),
(2, 'biodegradable', 7.31302780, 125.67013330, 78.50, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '13:00:00', 'Compostable waste pile', 'New Visayas Gate', 1, 'verified'),
(2, 'plastic', 7.31252780, 125.66913330, 96.00, DATE_SUB(CURDATE(), INTERVAL 10 DAY), '07:45:00', 'Plastic containers detected', 'Administration Building', 1, 'pending');

INSERT INTO reports (generated_by, title, report_type, date_from, date_to, total_detections, summary_json, file_format, status) VALUES
(1, 'Weekly Campus Waste Summary', 'weekly', DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE(), 15,
 '{"categories":{"plastic":5,"biodegradable":3,"paper":2}}', 'pdf', 'generated'),
(2, 'Daily Detection Report', 'daily', CURDATE(), CURDATE(), 2,
 '{"categories":{"plastic":1,"biodegradable":1}}', 'csv', 'exported');

INSERT INTO analytics_logs (metric_type, metric_key, metric_value, metric_data, recorded_at, period) VALUES
('category_count', 'plastic', 12, '{"zone":"North Quad"}', CURDATE(), 'daily'),
('category_count', 'biodegradable', 8, NULL, CURDATE(), 'daily'),
('detection_frequency', 'total', 25, NULL, CURDATE(), 'weekly'),
('hotspot_count', 'active', 4, NULL, CURDATE(), 'daily'),
('monthly_trend', '2026-06', 45, '{"trend":"up"}', CURDATE(), 'monthly');

INSERT INTO activity_logs (user_id, action, module, description, ip_address) VALUES
(1, 'login', 'auth', 'Administrator logged in', '127.0.0.1'),
(2, 'create', 'waste_detections', 'Created new waste detection #1', '127.0.0.1'),
(1, 'generate', 'reports', 'Generated weekly report', '127.0.0.1');

INSERT INTO settings (user_id, setting_key, setting_value, setting_group, is_public) VALUES
(NULL, 'campus_name', 'Davao del Norte State College (DNSC)', 'system', 1),
(NULL, 'default_map_lat', '7.3135278', 'system', 1),
(NULL, 'default_map_lng', '125.6703333', 'system', 1),
(NULL, 'default_map_zoom', '16', 'system', 1),
(1, 'theme_primary', '#4ADE80', 'theme', 0),
(1, 'email_notifications', '1', 'notification', 0),
(1, 'push_notifications', '0', 'notification', 0),
(2, 'theme_primary', '#4ADE80', 'theme', 0);

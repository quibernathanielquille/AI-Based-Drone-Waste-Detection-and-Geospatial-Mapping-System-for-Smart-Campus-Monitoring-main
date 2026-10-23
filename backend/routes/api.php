<?php

$router->get('/health', fn() => Response::success(['status' => 'ok', 'time' => date('c')]));

$auth = RoleMiddleware::auth();
$admin = RoleMiddleware::adminOnly();

// Auth
$router->post('/auth/register', fn() => (new AuthController())->register());
$router->post('/auth/login', fn() => (new AuthController())->login());
$router->post('/auth/forgot-password', fn() => (new AuthController())->forgotPassword());
$router->post('/auth/reset-password', fn() => (new AuthController())->resetPassword());
$router->post('/auth/logout', fn() => (new AuthController())->logout(), [$auth]);
$router->get('/auth/me', fn() => (new AuthController())->me(), [$auth]);

// Dashboard
$router->get('/dashboard', fn() => (new DashboardController())->index(), [$auth]);

// Waste Detections
$router->get('/waste-detections', fn() => (new WasteDetectionController())->index(), [$auth]);
$router->get('/waste-detections/user-stats', fn() => (new WasteDetectionController())->userStats(), [$admin]);
$router->get('/waste-detections/{id}', fn($id) => (new WasteDetectionController())->show($id), [$auth]);
$router->post('/waste-detections', fn() => (new WasteDetectionController())->store(), [$auth]);
$router->post('/waste-detections/{id}', fn($id) => (new WasteDetectionController())->update($id), [$auth]);
$router->put('/waste-detections/{id}', fn($id) => (new WasteDetectionController())->update($id), [$auth]);
$router->delete('/waste-detections/{id}', fn($id) => (new WasteDetectionController())->destroy($id), [$auth]);

// Map
$router->get('/map/detections', fn() => (new MapController())->detections(), [$auth]);

// Reports
$router->get('/reports', fn() => (new ReportController())->index(), [$auth]);
$router->get('/reports/{id}', fn($id) => (new ReportController())->show($id), [$auth]);
$router->post('/reports/preview', fn() => (new ReportController())->preview(), [$auth]);
$router->post('/reports/generate', fn() => (new ReportController())->generate(), [$auth]);
$router->post('/reports/export', fn() => (new ReportController())->export(), [$auth]);

// Analytics
$router->get('/analytics', fn() => (new AnalyticsController())->index(), [$auth]);

// Users (Admin only)
$router->get('/users', fn() => (new UserController())->index(), [$admin]);
$router->get('/users/roles', fn() => (new UserController())->roles(), [$admin]);
$router->get('/users/{id}', fn($id) => (new UserController())->show($id), [$admin]);
$router->post('/users', fn() => (new UserController())->store(), [$admin]);
$router->put('/users/{id}', fn($id) => (new UserController())->update($id), [$admin]);
$router->delete('/users/{id}', fn($id) => (new UserController())->destroy($id), [$admin]);
$router->post('/users/{id}/reset-password', fn($id) => (new UserController())->resetPassword($id), [$admin]);

// Settings
$router->get('/settings', fn() => (new SettingsController())->index(), [$auth]);
$router->put('/settings/profile', fn() => (new SettingsController())->updateProfile(), [$auth]);
$router->put('/settings/password', fn() => (new SettingsController())->changePassword(), [$auth]);
$router->put('/settings/notifications', fn() => (new SettingsController())->updateNotifications(), [$auth]);
$router->put('/settings/theme', fn() => (new SettingsController())->updateTheme(), [$auth]);
$router->put('/settings/system', fn() => (new SettingsController())->updateSystem(), [$admin]);
$router->get('/settings/activity-logs', fn() => (new SettingsController())->activityLogs(), [$auth]);

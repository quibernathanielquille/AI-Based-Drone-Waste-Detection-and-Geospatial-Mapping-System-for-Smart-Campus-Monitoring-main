# Deployment & Installation Guide
## AI-Based Drone Waste Detection and Geospatial Mapping System

---

## Prerequisites

| Software | Version |
|----------|---------|
| XAMPP | PHP 8+, MySQL/MariaDB, Apache |
| Node.js | 18+ |
| npm | 9+ |

---

## 1. XAMPP Setup Guide

1. Download and install [XAMPP](https://www.apachefriends.org/) with PHP 8.
2. Start **Apache** and **MySQL** from the XAMPP Control Panel.
3. Place this project in `C:\xampp\htdocs\` (already configured if using default path).
4. Enable Apache modules (edit `httpd.conf`):
   - `LoadModule rewrite_module modules/mod_rewrite.so`
5. Set `AllowOverride All` for `htdocs` directory.

---

## 2. Database Import Guide

### Option A: phpMyAdmin

1. Open http://localhost/phpmyadmin
2. Click **Import**
3. Select `database/schema.sql` → Execute
4. Select `database/sample_data.sql` → Execute

### Option B: MySQL CLI

```bash
cd "C:\xampp\mysql\bin"
mysql -u root -p < "C:\xampp\htdocs\AI-Based Drone Waste Detection and Geospatial Mapping System for Smart Campus Monitoring\database\schema.sql"
mysql -u root -p < "C:\xampp\htdocs\AI-Based Drone Waste Detection and Geospatial Mapping System for Smart Campus Monitoring\database\sample_data.sql"
```

### Verify

```sql
USE smart_campus_waste;
SHOW TABLES;
SELECT email, role_id FROM users;
```

---

## 3. Backend Configuration

Edit `backend/config/database.php` if needed:

```php
'username' => 'root',
'password' => '',  // Set if MySQL has password
```

Edit `backend/config/jwt.php` — change `secret` in production.

Ensure uploads folder is writable:

```
backend/uploads/waste/
```

### Test API

```
GET http://localhost/AI-Based%20Drone%20Waste%20Detection%20and%20Geospatial%20Mapping%20System%20for%20Smart%20Campus%20Monitoring/backend/api/auth/login
```

POST login with JSON body should return JWT.

---

## 4. Frontend Installation

```powershell
cd "C:\xampp\htdocs\AI-Based Drone Waste Detection and Geospatial Mapping System for Smart Campus Monitoring\frontend"
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

### Production Build

```powershell
npm run build
```

Serve `frontend/dist` via Apache or copy to `htdocs/smart-campus/`.

---

## 5. Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@campus.edu | password |
| Environmental Officer | officer@campus.edu | password |

---

## 6. Full System Integration Checklist

### Authentication
- [ ] Login with admin credentials
- [ ] Login with officer credentials
- [ ] Remember Me persists session
- [ ] Forgot/Reset password flow works
- [ ] Logout clears token
- [ ] Protected routes redirect to login

### Role Management
- [ ] Officer cannot access `/users`
- [ ] Admin can access all modules
- [ ] Sidebar hides User Management for officers

### Dashboard
- [ ] KPI cards load from API
- [ ] Charts render (Pie, Bar, Line, Area)
- [ ] Mini map shows detection points
- [ ] Recent activities and detections display

### Waste Detection CRUD
- [ ] List with search, filter, pagination
- [ ] Add detection with image upload
- [ ] Edit and delete detection
- [ ] View detection modal

### GIS Mapping
- [ ] Map loads with markers
- [ ] Category and date filters work
- [ ] Marker popups show details
- [ ] Heatmap toggle works
- [ ] Location search navigates map

### Reports
- [ ] Report table loads
- [ ] Generate daily/weekly/monthly reports
- [ ] Export CSV, Excel, PDF

### Analytics
- [ ] All chart types render
- [ ] Summary cards show correct data
- [ ] Smart insights section populated

### User Management (Admin)
- [ ] CRUD users
- [ ] Assign roles
- [ ] Reset password

### Settings
- [ ] Profile update
- [ ] Change password
- [ ] Notification settings
- [ ] Theme configuration
- [ ] System settings (admin)
- [ ] Activity logs

### Security
- [ ] JWT required for protected endpoints
- [ ] 401 redirects to login
- [ ] Passwords hashed with bcrypt
- [ ] Prepared statements used
- [ ] File upload validation

---

## 7. Production Checklist

- [ ] Change JWT secret in `backend/config/jwt.php`
- [ ] Set `debug` => false in `backend/config/app.php`
- [ ] Use strong MySQL password
- [ ] Restrict CORS to production domain
- [ ] Enable HTTPS
- [ ] Set proper file permissions on `uploads/`
- [ ] Remove sample reset tokens from forgot-password response
- [ ] Build frontend: `npm run build`
- [ ] Configure Apache virtual host
- [ ] Regular database backups
- [ ] Monitor `activity_logs` table

---

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on API routes | Enable mod_rewrite; check `.htaccess` in `backend/api/` |
| CORS errors | Verify `frontend_url` in `backend/config/app.php` |
| Database connection failed | Check XAMPP MySQL running; verify credentials |
| Blank charts | Ensure sample data imported; check browser console |
| Image upload fails | Create `backend/uploads/waste/` with write permissions |
| Login fails | Re-import sample_data.sql; password is `password` |

---

## Project Structure Reference

See `docs/ARCHITECTURE.md` for complete system architecture documentation.

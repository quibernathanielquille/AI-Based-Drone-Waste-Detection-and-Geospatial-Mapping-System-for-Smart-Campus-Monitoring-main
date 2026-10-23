# Campus Eye — Data Dictionary

**Database:** `smart_campus_waste`  
**DBMS:** MySQL / MariaDB (XAMPP)  
**System:** AI-Based Drone Waste Detection and Geospatial Mapping System for Smart Campus Monitoring

---

## Table 1: `roles`

Stores user role definitions (Administrator, Personnel).

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique role identifier |
| name | VARCHAR(100) | NOT NULL | Display name (e.g. Administrator, Personnel) |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | System code (e.g. administrator, environmental_officer) |
| description | TEXT | NULL | Role description |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date/time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date/time |
| deleted_at | TIMESTAMP | NULL | Soft-delete marker |

---

## Table 2: `users`

Stores system accounts for administrators and personnel.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique user identifier |
| role_id | INT UNSIGNED | FK → roles(id), NOT NULL | User role reference |
| first_name | VARCHAR(100) | NOT NULL | User first name |
| last_name | VARCHAR(100) | NOT NULL | User last name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| phone | VARCHAR(20) | NULL | Contact phone number |
| avatar | VARCHAR(500) | NULL | Profile image path/URL |
| is_active | TINYINT(1) | NOT NULL, DEFAULT 1 | Account active flag (1=active) |
| remember_token | VARCHAR(100) | NULL | Remember-me token |
| reset_token | VARCHAR(255) | NULL | Password reset token |
| reset_token_expires_at | TIMESTAMP | NULL | Reset token expiry |
| last_login_at | TIMESTAMP | NULL | Last successful login |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date/time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last profile update |
| deleted_at | TIMESTAMP | NULL | Soft-delete marker |

---

## Table 3: `waste_detections`

Stores drone/AI waste detection records with geospatial data.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique detection identifier |
| detected_by | INT UNSIGNED | FK → users(id), NULL | User who added the detection |
| waste_category | ENUM | NOT NULL, DEFAULT 'plastic' | biodegradable, cardboard, glass, metal, paper, plastic |
| latitude | DECIMAL(10,8) | NOT NULL | GPS latitude (campus location) |
| longitude | DECIMAL(11,8) | NOT NULL | GPS longitude (campus location) |
| confidence_score | DECIMAL(5,2) | NOT NULL, CHECK 0–100 | YOLO model confidence (%) |
| waste_image | VARCHAR(500) | NULL | Uploaded/annotated image path |
| detection_date | DATE | NOT NULL | Date waste was detected |
| detection_time | TIME | NOT NULL | Time waste was detected |
| description | TEXT | NULL | Notes or YOLO result description |
| zone_name | VARCHAR(100) | NULL | Campus zone/area label |
| is_hotspot | TINYINT(1) | NOT NULL, DEFAULT 0 | High-priority hotspot flag |
| status | ENUM | NOT NULL, DEFAULT 'pending' | pending, verified, resolved, archived |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date/time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date/time |
| deleted_at | TIMESTAMP | NULL | Soft-delete marker |

---

## Table 4: `reports`

Stores generated waste report metadata (PDF/CSV exports).

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique report identifier |
| generated_by | INT UNSIGNED | FK → users(id), NOT NULL | User who created the report |
| title | VARCHAR(255) | NOT NULL | Report title |
| report_type | ENUM | NOT NULL, DEFAULT 'summary' | daily, weekly, monthly, custom, summary |
| date_from | DATE | NULL | Report period start date |
| date_to | DATE | NULL | Report period end date |
| waste_category | VARCHAR(50) | NULL | Optional category filter |
| total_detections | INT UNSIGNED | NOT NULL, DEFAULT 0 | Detection count in report |
| summary_json | JSON | NULL | Aggregated stats (categories, hotspots) |
| file_path | VARCHAR(500) | NULL | Saved export file path |
| file_format | ENUM | NOT NULL, DEFAULT 'none' | pdf, excel, csv, none |
| status | ENUM | NOT NULL, DEFAULT 'generated' | draft, generated, exported, archived |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Report creation date/time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date/time |
| deleted_at | TIMESTAMP | NULL | Soft-delete marker |

---

## Table 5: `analytics_logs`

Stores pre-aggregated analytics snapshots for dashboard performance.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique log identifier |
| metric_type | VARCHAR(100) | NOT NULL | Metric category (e.g. category_count) |
| metric_key | VARCHAR(100) | NULL | Sub-key (e.g. waste category name) |
| metric_value | DECIMAL(15,4) | NOT NULL, DEFAULT 0 | Numeric metric value |
| metric_data | JSON | NULL | Extra metric details |
| recorded_at | DATE | NOT NULL | Date metric was recorded |
| period | ENUM | NOT NULL, DEFAULT 'daily' | daily, weekly, monthly, yearly |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date/time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date/time |

---

## Table 6: `activity_logs`

Stores audit trail of user actions in the system.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique log identifier |
| user_id | INT UNSIGNED | FK → users(id), NULL | User who performed the action |
| action | VARCHAR(100) | NOT NULL | Action type (login, create, update, delete) |
| module | VARCHAR(100) | NOT NULL | System module (auth, waste_detections, reports) |
| description | TEXT | NULL | Human-readable log message |
| ip_address | VARCHAR(45) | NULL | Client IP address |
| user_agent | VARCHAR(500) | NULL | Browser/client info |
| metadata | JSON | NULL | Extra structured log data |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Action date/time |

---

## Table 7: `settings`

Stores system-wide and per-user configuration (key-value).

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique setting identifier |
| user_id | INT UNSIGNED | FK → users(id), NULL | NULL = system setting; set = user setting |
| setting_key | VARCHAR(100) | NOT NULL | Setting name (e.g. campus_name, theme) |
| setting_value | TEXT | NULL | Setting value |
| setting_group | ENUM | NOT NULL, DEFAULT 'system' | system, profile, notification, theme |
| is_public | TINYINT(1) | NOT NULL, DEFAULT 0 | Visible to frontend if 1 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date/time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date/time |

**Unique constraint:** `(setting_key, user_id)`

---

## Entity Relationships Summary

| Parent Table | Child Table | Foreign Key | Relationship | On Delete |
|--------------|-------------|-------------|--------------|-----------|
| roles | users | role_id | One-to-Many | RESTRICT |
| users | waste_detections | detected_by | One-to-Many | SET NULL |
| users | reports | generated_by | One-to-Many | RESTRICT |
| users | activity_logs | user_id | One-to-Many | SET NULL |
| users | settings | user_id | One-to-Many | CASCADE |
| — | analytics_logs | — | Standalone | — |

---

## Figure Caption (for thesis)

*Table X. Data Dictionary of the Campus Eye Database (smart_campus_waste)*

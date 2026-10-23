# Database Design Documentation

## ER Diagram Explanation

```
┌─────────────┐       ┌─────────────┐       ┌──────────────────┐
│    roles    │1────N │    users    │1────N │ waste_detections │
│─────────────│       │─────────────│       │──────────────────│
│ id (PK)     │       │ id (PK)     │       │ id (PK)          │
│ name        │       │ role_id(FK) │       │ detected_by (FK) │
│ slug        │       │ email (UQ)  │       │ waste_category   │
└─────────────┘       │ password    │       │ latitude/longitude│
                      └──────┬──────┘       └──────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌────────────┐  ┌──────────┐
        │ reports  │  │activity_logs│  │ settings │
        │──────────│  │────────────│  │──────────│
        │generated │  │ user_id(FK)│  │user_id   │
        │_by (FK)  │  └────────────┘  │(nullable)│
        └──────────┘                   └──────────┘

        ┌────────────────┐
        │ analytics_logs │  (standalone metrics snapshots)
        └────────────────┘
```

### Entity Descriptions

| Table | Purpose |
|-------|---------|
| **roles** | Administrator and Environmental Officer role definitions |
| **users** | System accounts with authentication credentials |
| **waste_detections** | Core drone AI detection records with geospatial data |
| **reports** | Generated report metadata and export references |
| **analytics_logs** | Pre-aggregated metrics for dashboard performance |
| **activity_logs** | Audit trail for user actions |
| **settings** | System-wide and per-user configuration key-value store |

## Relationships

| Parent | Child | Type | On Delete |
|--------|-------|------|-----------|
| roles | users | 1:N | RESTRICT |
| users | waste_detections | 1:N | SET NULL |
| users | reports | 1:N | RESTRICT |
| users | activity_logs | 1:N | SET NULL |
| users | settings | 1:N | CASCADE |

## Constraints Summary

- **UNIQUE:** `users.email`, `roles.slug`, `settings(setting_key, user_id)`
- **CHECK:** `confidence_score` between 0 and 100
- **ENUM:** waste categories, report types, detection status
- **Soft Delete:** `deleted_at` on users, waste_detections, reports, roles

## Indexes

Optimized for: login by email, spatial queries (lat/lng), date-range filters, category filters, activity log lookups, analytics aggregation.

## Sample Data

See `database/sample_data.sql` for:
- 2 roles
- 3 users (1 admin, 2 officers)
- 8 waste detections with campus coordinates
- 2 reports, 5 analytics logs, 3 activity logs, 8 settings

**Login:** `admin@campus.edu` / `password`

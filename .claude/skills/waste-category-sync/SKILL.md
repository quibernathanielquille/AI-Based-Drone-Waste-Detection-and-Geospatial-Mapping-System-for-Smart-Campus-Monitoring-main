---
name: waste-category-sync
description: Add, rename, or remove a waste category (e.g. "e-waste", "organic") consistently across the YOLO ML service, PHP backend config, MySQL ENUM, and the frontend/admin apps. Use whenever waste categories or model class names change.
---

# Waste Category Sync

Categories currently: biodegradable, cardboard, glass, metal, paper, plastic.
The same list is hardcoded in several places; missing one causes silent bugs
(wrong colors, rejected DB inserts, empty charts).

## Checklist (do in this order)
1. **ML service** — `ml_service/config.py`
   - Add class to `GARBAGE_CLASSES` and `GARBAGE_TO_CATEGORY` (or the PLASTIC equivalents).
   - Check `ml_service/class_mapper.py` still maps it (unknown classes fall back to `name.lower()`).
2. **Backend config** — `backend/config/waste.php`: add slug to `categories`, `labels`, and a hex `colors` entry.
3. **Database** — create a NEW migration file `database/migrate_<change>.sql` modeled on
   `migrate_waste_categories.sql`:
   - `ALTER TABLE waste_detections MODIFY waste_category ENUM(...) NOT NULL DEFAULT 'plastic';`
   - Remap old rows with UPDATE before altering the ENUM.
   - Also update `database/schema.sql` and `sample_data.sql`, and `analytics_logs.metric_key` rows if relevant.
4. **Frontends** — grep both `frontend/src` and `admin/src` for an existing slug (e.g. `cardboard`):
   `grep -rn "cardboard" frontend/src admin/src backend`
   Update filters, chart color maps, legends, `utils/constants.js`, report PDF code (`frontend/src/utils/reportPdf.js`).
5. **Docs** — update `docs/DATABASE.md` and `docs/DATA_DICTIONARY.md`.

## Verify
- `grep -rni "<old_or_new_slug>" .` shows it in all of: ml_service, backend/config, database, frontend, admin, docs.
- POST a detection with the new category through the API — it must be accepted.
- Map markers, dashboard chart, and filter dropdown show the new category with the right color.
- `npm run build` passes in `frontend/` and `admin/`.

## Don'ts
- Don't edit `*.pt` weights; a new model class requires retraining (see `colab_upload/Run_Training.ipynb`).
- Don't run the migration against a real DB without telling the user.

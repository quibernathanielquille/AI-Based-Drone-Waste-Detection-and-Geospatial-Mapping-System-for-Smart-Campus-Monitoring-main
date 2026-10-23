# AGENTS.md — Campus Eye: AI-Based Drone Waste Detection & Geospatial Mapping

Guidance for AI coding agents (Codex, Claude Code, Cursor, Copilot, etc.).
Claude Code reads CLAUDE.md, which points here.

## What this project is
Full-stack smart-campus system (DNSC, Panabo City). Drone/campus images go to a YOLO
service, detections are stored via a PHP API into MySQL, and shown on a Leaflet map,
dashboard, analytics and reports.

## Architecture (4 services)
| Folder        | Stack                              | Default URL / port                       |
|---------------|------------------------------------|------------------------------------------|
| `frontend/`   | React 19 + Vite, Axios, Leaflet, Chart.js | http://localhost:5173             |
| `admin/`      | React + Vite (admin panel)         | http://localhost:5174                    |
| `backend/`    | PHP 8, custom MVC, JWT, PDO        | Apache/XAMPP -> `/backend/api`           |
| `ml_service/` | Python, FastAPI, Ultralytics YOLO  | http://localhost:8000                    |
| `database/`   | MySQL `smart_campus_waste`         | schema.sql, sample_data.sql, migrations  |

Data flow: Image -> `ml_service/app.py` -> frontend -> `POST /waste-detections` -> MySQL -> map/dashboard/reports.

## Run commands
- Frontend: `cd frontend && npm install && npm run dev` (also `npm run build`, `npm run lint`)
- Admin:    `cd admin && npm install && npm run dev`
- ML:       `cd ml_service && pip install -r requirements.txt && python -m uvicorn app:app --port 8000`
- DB:       import `database/schema.sql` then `database/sample_data.sql` (phpMyAdmin or mysql CLI)
- Backend:  serve the project through XAMPP Apache (mod_rewrite on, AllowOverride All)
- Health check: GET `{API}/health`

## Code conventions
### Backend (PHP)
- Routes live ONLY in `backend/routes/api.php`; guard with `$auth` or `$admin` (RoleMiddleware).
- Controllers extend `core/Controller`; models extend `core/Model`. Keep logic thin in controllers.
- Always respond via `Response::success()/error()/notFound()...` (shape: success, message, data, errors).
- Validate input with `Validator`. Use PDO prepared statements ONLY — never interpolate SQL.
- Call `$this->logActivity(...)` for create/update/delete actions.
### Frontend (React)
- All HTTP calls go through `src/services/api.js` (add a `xxxService` object); never call axios directly in pages.
- Shared constants (API URL, theme, campus map center) live in `src/utils/constants.js`.
- Auth state: `contexts/AuthContext.jsx`; protect pages with `ProtectedRoute`.
- `frontend/` and `admin/` duplicate several components/utilities — check both when changing shared UI.
### ML service (Python)
- Two models: `garbage_best.pt` (6 classes) and `plastic_best.pt` (Bag/Bottle/Cup -> plastic).
- Class names are mapped to category slugs in `config.py` + `class_mapper.py`. Confidence threshold: 0.35.

## Waste categories (single source of truth is split across 6 places!)
`biodegradable, cardboard, glass, metal, paper, plastic`
If you add/rename one, use the `waste-category-sync` skill — it must be updated in ml_service,
backend config, DB ENUM, and both frontends.

## Rules for agents
1. Work on a feature branch, never commit directly to `main`.
2. Do not commit: `.env*`, `node_modules/`, `dist/`, `backend/uploads/*`, `__pycache__/`.
3. `*.pt` and `*.zip` are tracked with Git LFS (see `.gitattributes`) — don't rewrite them as normal files.
4. Never hardcode secrets. `backend/config/jwt.php` secret and DB password must be changed for production.
5. Don't touch `ml_service/*.pt` weights or the `Pictures/` assets unless asked.
6. After changes: run `npm run lint` + `npm run build` in any touched frontend; hit `/health` for backend.
7. Update `docs/` (ARCHITECTURE, DATABASE, DATA_DICTIONARY) when schema or endpoints change.

## Known gotchas / tech debt
- `README` default logins (`admin@campus.edu` / `password`) are for demo only.
- `backend/config/app.php` has `debug => true` and hardcoded localhost URLs containing the project folder name (spaces encoded as %20).
- `ml_service` CORS is `allow_origins=["*"]` — restrict for deployment.
- `ml_service/config.py` expects optional dataset folders (`GARBAGE CLASSIFICATION`, `Plastic_trained`) that are not in the repo; weights are loaded from `ml_service/`.

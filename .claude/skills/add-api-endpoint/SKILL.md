---
name: add-api-endpoint
description: Add a new REST endpoint to the custom PHP MVC backend and wire it into the React frontend. Use when the user asks for a new API route, controller method, model query, or a new page that needs backend data.
---

# Add an API Endpoint (PHP MVC + React)

## Backend steps
1. **Route** — add to `backend/routes/api.php`, following the existing style:
   `$router->get('/things/{id}', fn($id) => (new ThingController())->show($id), [$auth]);`
   Use `[$admin]` for admin-only; list static routes (e.g. `/things/stats`) BEFORE `/things/{id}`.
2. **Controller** — `backend/controllers/ThingController.php`, `extends Controller`.
   - Read body with `$this->getJsonInput()`, current user with `$this->getAuthUser()`.
   - Validate with `$this->validator`; return errors via `Response::error('...', $errors, 422)`.
   - Return with `Response::success($data, 'message')`; `Response::notFound()` when missing.
   - Call `$this->logActivity('create', 'things', '...')` on writes.
3. **Model** — `backend/models/Thing.php`, `extends Model`. PDO prepared statements only.
4. **Schema** — if a table is needed, add it to `database/schema.sql` plus a separate migration file.

## Frontend steps
5. Add a `thingService` in `frontend/src/services/api.js` (and `admin/src/services/api.js` if the admin app uses it):
   `export const thingService = { list: (params) => api.get('/things', { params }) };`
6. Use the service from a page/component; handle loading + error states. Responses are `{success, message, data, errors}`.

## Verify
- `GET {API}/health` still works; call the new route with a JWT (login first at `/auth/login`).
- Test 401 (no token), 403 (wrong role), 404, and 422 (bad input) paths.
- `npm run lint && npm run build` in the touched frontend.
- Update `docs/ARCHITECTURE.md` / `docs/DATA_DICTIONARY.md`.

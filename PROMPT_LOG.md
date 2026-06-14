# Prompt Log

---

## Session 1 — 2026-06-14

**Instructions given:**
- Read PLAN.md and continue with the project from scratch (all steps were unchecked).

**Work done:**
- Scaffolded `TodoListApp.Api/` (.NET 10 Web API) and `TodoListApp.Tests/` (xUnit) projects; created `TodoListApp.sln`.
- Built `TodoItem.cs` model (Id, Text, IsCompleted, Order).
- Built `TodoRepository.cs` — lock-based in-memory CRUD + reorder.
- Built `Program.cs` — minimal API endpoints: GET `/todos`, POST `/todos`, PUT `/todos/{id}`, PATCH `/todos/reorder`, DELETE `/todos/{id}`. Configured static file serving so the API also hosts the frontend (same-origin, no CORS needed).
- Built `TodoListApp.Client/` — `index.html`, `style.css`, `app.js` with: add form, validation (shared `validateText`), checkbox toggle with completed styling, inline edit with Enter/Escape shortcuts, delete, HTML5 drag-and-drop with optimistic reorder + backend PATCH.
- Wrote 11 xUnit tests covering all backend scenarios — all pass.
- Updated PLAN.md with all completed steps.

**Remaining:**
- Smoke test the full happy path end-to-end in the browser (`dotnet run` from `TodoListApp.Api/`, then open `http://localhost:5074`).

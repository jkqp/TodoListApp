# Plan: Todo List App

## Goal
Build a full-stack todo list application where users can manage a personal task list with full CRUD operations, inline editing, completion toggling, and drag-and-drop reordering — backed by a C# .NET 9 API and a plain Vanilla JS frontend.

## Context
- Fresh repository at `C:\Programming\C#\TodoListApp` with only a README and this plan.
- Stack: C# .NET 9 Web API (backend), Vanilla JS + HTML + CSS (frontend, no build tooling).
- Greenfield build — no existing files, patterns, or dependencies to work around.
- The backend exposes a REST API consumed by the frontend via `fetch`.
- Drag-and-drop reordering requires persisting item order, so `TodoItem` needs an `Order` field.
- This is a portfolio/demo app — it must be runnable and demoable in the browser.

## Decisions (resolved)
- **Persistence**: In-memory only. The list resets on server restart. No database needed.
- **.NET version**: .NET 9 (current standard).
- **Frontend**: Vanilla JS — plain HTML, CSS, and JavaScript files. No React, no Vite, no bundler.
- **HTTP client**: `fetch` (built-in — no extra dependencies).
- **Drag-and-drop**: HTML5 native Drag and Drop API (no library needed).
- **Frontend tests**: Skipped — vanilla JS + jsdom setup without a bundler is high-friction for a demo. The browser smoke test covers the happy path. Backend logic is unit-tested via xUnit.

## Constraints
- Language/framework: C# .NET 9 backend, Vanilla JS frontend — no switching.
- Shared validation logic for add and edit fields must live in one reusable JS function (not duplicated).
- Drag-and-drop must persist order server-side (not just visually reorder).
- No user authentication — single shared list.
- Every Claude session must append a summary of new instructions to `PROMPT_LOG.md`.
- All frontend decisions must prioritize browser demoability.

## Scope

**In scope:**
- C# .NET 9 Web API with endpoints: GET all, POST create, PUT update (text + completion), PATCH reorder, DELETE
- Vanilla JS frontend: add item input + button, checkbox toggle, strikethrough/grey styling for completed items, inline edit per item, HTML5 drag-and-drop reordering, delete button per item
- Shared JS validation: non-empty text required for both add and edit fields; red border + "Field must have content to submit" error message on empty submit
- Backend xUnit tests: add item, reject empty item, edit item, reject empty edit, toggle check, uncheck, delete, reorder
- Browser smoke test of the full happy path (not automated — manual or Playwright if time permits)
- `PROMPT_LOG.md` — running log of user instructions to Claude per session

**Out of scope:**
- User authentication or multi-user support
- Due dates, priorities, labels, or categories
- Persistent database (in-memory only)
- Mobile-specific UI or responsive design beyond basic usability
- Undo/redo, search, or filtering
- Frontend unit tests (skipped for this demo stack)

## Success Criteria
- A user can type text into the add field and submit it; a new item appears in the list.
- Submitting an empty add field shows a red-bordered input and "Field must have content to submit".
- Clicking an item's checkbox marks it completed: text becomes grey with a strikethrough.
- Clicking the checkbox again un-checks the item and removes the strikethrough.
- Clicking the edit button on an item makes its text editable inline; saving persists the change.
- Submitting an empty edit field shows the same red border + error message (shared validation function).
- Items can be dragged and dropped to reorder; the new order persists after a page refresh.
- Clicking delete removes the item from the list.
- All backend xUnit tests pass.
- The full happy path is demoable end-to-end in the browser.

## Implementation Steps

### Backend
- [ ] Scaffold C# .NET 9 Web API project under `TodoListApp.Api/`
- [ ] Define `TodoItem` model: `Id` (Guid), `Text` (string), `IsCompleted` (bool), `Order` (int)
- [ ] Implement in-memory repository (thread-safe list or concurrent dictionary)
- [ ] Implement API endpoints: GET `/todos`, POST `/todos`, PUT `/todos/{id}`, PATCH `/todos/reorder`, DELETE `/todos/{id}`
- [ ] Configure CORS to allow requests from the frontend origin (e.g., `file://` or `localhost:*`)
- [ ] Confirm endpoints work via Swagger UI
- [ ] Write xUnit tests: add, reject-empty-add, edit, reject-empty-edit, toggle-complete, uncheck, delete, reorder

### Frontend
- [ ] Create `TodoListApp.Client/` folder with `index.html`, `style.css`, `app.js`
- [ ] Implement shared `validateText(value)` function in `app.js` (returns error string or null)
- [ ] Implement `renderList()` — fetches GET `/todos` and builds the DOM list
- [ ] Implement add item: input + button, calls POST, re-renders list, validates before submit
- [ ] Implement checkbox toggle: calls PUT with flipped `IsCompleted`, re-renders
- [ ] Implement completed styling: grey text + strikethrough via CSS class
- [ ] Implement inline edit: replaces text span with input on edit click, calls PUT on save, validates
- [ ] Implement delete: calls DELETE, removes item from DOM
- [ ] Implement HTML5 drag-and-drop reordering: `draggable="true"`, `dragstart`/`dragover`/`drop` events, calls PATCH `/todos/reorder` on drop
- [ ] Smoke test full happy path in the browser

## Risks / Watch-outs
- **Drag-and-drop + order persistence**: Every reorder must PATCH the backend. If the API call fails, the UI and server will be out of sync — optimistic update with rollback on failure is the safe pattern.
- **Shared validation**: Write `validateText()` before building either the add or edit field, or you'll duplicate it and have to refactor.
- **CORS**: The frontend served from `file://` or a local server will hit the .NET API on a different port — CORS must be configured in the API from day one.
- **HTML5 DnD on mobile**: The native HTML5 DnD API does not work on touch screens. Acceptable for a desktop demo; call it out if asked.
- **In-memory thread safety**: Use a lock or `ConcurrentDictionary` in the repository — parallel requests on the same list can corrupt state.

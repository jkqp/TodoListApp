# Todo List App

A full-stack todo list application built as a portfolio demo, showcasing a C# .NET 10 REST API paired with a Vanilla JS frontend. No frameworks, no bundlers — just clean, readable code end to end.

## Features

- Add tasks with validated input (empty submissions are rejected)
- Check/uncheck tasks with strikethrough styling for completed items
- Inline edit any task's text
- Delete tasks
- Drag and drop to reorder tasks — order persists server-side
- 11 xUnit integration tests covering all backend scenarios

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | C# .NET 10 Web API (minimal API) |
| Storage | In-memory (resets on restart) |
| Frontend | Vanilla JS, HTML, CSS — no framework |
| Tests | xUnit + `WebApplicationFactory` |

## Running the App

**Prerequisites:** [.NET 10 SDK](https://dotnet.microsoft.com/download)

```bash
cd TodoListApp.Api
dotnet run
```

Then open **http://localhost:5074** in your browser.

The API serves the frontend as static files, so one command is all it takes — no separate frontend server needed.

## Running the Tests

```bash
dotnet test
```

All 11 tests should pass. Tests run against an in-process test server using `WebApplicationFactory` — no external dependencies required.

## Project Structure

```
TodoListApp/
├── TodoListApp.Api/        # .NET 10 Web API
│   ├── Program.cs          # Endpoints, DI, static file serving
│   ├── TodoItem.cs         # Model: Id, Text, IsCompleted, Order
│   └── TodoRepository.cs   # Thread-safe in-memory store
├── TodoListApp.Client/     # Vanilla JS frontend (served by the API)
│   ├── index.html
│   ├── style.css
│   └── app.js              # All UI logic, fetch calls, drag-and-drop
├── TodoListApp.Tests/      # xUnit integration tests
│   └── TodoApiTests.cs
└── TodoListApp.sln
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/todos` | Get all todos, ordered |
| `POST` | `/todos` | Create a todo `{ text }` |
| `PUT` | `/todos/{id}` | Update text and completion `{ text, isCompleted }` |
| `PATCH` | `/todos/reorder` | Persist new order `{ orderedIds: [...] }` |
| `DELETE` | `/todos/{id}` | Delete a todo |

Swagger UI is available at **http://localhost:5074/openapi/v1.json** when running in Development mode.

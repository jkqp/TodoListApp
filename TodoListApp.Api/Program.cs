using Microsoft.Extensions.FileProviders;
using TodoListApp.Api;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<TodoRepository>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Serve the Vanilla JS frontend from the sibling Client folder
var clientPath = Path.GetFullPath(
    Path.Combine(builder.Environment.ContentRootPath, "..", "TodoListApp.Client"));

if (Directory.Exists(clientPath))
{
    var provider = new PhysicalFileProvider(clientPath);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = provider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = provider });
}

app.MapGet("/todos", (TodoRepository repo) =>
    Results.Ok(repo.GetAll()));

app.MapPost("/todos", (TodoRepository repo, CreateTodoRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Text))
        return Results.BadRequest("Field must have content to submit");

    var item = repo.Add(req.Text.Trim());
    return Results.Created($"/todos/{item.Id}", item);
});

app.MapPut("/todos/{id:guid}", (TodoRepository repo, Guid id, UpdateTodoRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Text))
        return Results.BadRequest("Field must have content to submit");

    var item = repo.Update(id, req.Text.Trim(), req.IsCompleted);
    return item is null ? Results.NotFound() : Results.Ok(item);
});

app.MapPatch("/todos/reorder", (TodoRepository repo, ReorderRequest req) =>
{
    var result = repo.Reorder(req.OrderedIds);
    return result is null ? Results.BadRequest("Invalid ID list") : Results.Ok(result);
});

app.MapDelete("/todos/{id:guid}", (TodoRepository repo, Guid id) =>
    repo.Delete(id) ? Results.NoContent() : Results.NotFound());

app.Run();

public partial class Program { }

record CreateTodoRequest(string Text);
record UpdateTodoRequest(string Text, bool IsCompleted);
record ReorderRequest(List<Guid> OrderedIds);

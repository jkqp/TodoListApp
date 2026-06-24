using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using TodoListApp.Api;

namespace TodoListApp.Tests;

public class TodoApiTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var response = await _client.GetAsync("/todos");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AddItem_WithValidText_ReturnsCreatedItem()
    {
        var response = await _client.PostAsJsonAsync("/todos", new { Text = "Buy milk" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<TodoItem>();
        Assert.NotNull(item);
        Assert.Equal("Buy milk", item.Text);
        Assert.False(item.IsCompleted);
    }

    [Fact]
    public async Task AddItem_WithEmptyText_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/todos", new { Text = "" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddItem_WithWhitespaceText_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/todos", new { Text = "   " });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task EditItem_WithValidText_UpdatesText()
    {
        var created = await CreateItem("Original");

        var updateResponse = await _client.PutAsJsonAsync($"/todos/{created.Id}",
            new { Text = "Updated", IsCompleted = false });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<TodoItem>();
        Assert.Equal("Updated", updated!.Text);
    }

    [Fact]
    public async Task EditItem_WithEmptyText_ReturnsBadRequest()
    {
        var created = await CreateItem("Original");

        var updateResponse = await _client.PutAsJsonAsync($"/todos/{created.Id}",
            new { Text = "", IsCompleted = false });

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Fact]
    public async Task AddItem_WithDefaultCategory_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/todos", new { Text = "Buy milk", Category = "Category" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task EditItem_WithDefaultCategory_ReturnsBadRequest()
    {
        var created = await CreateItem("Original");

        var updateResponse = await _client.PutAsJsonAsync($"/todos/{created.Id}",
            new { Text = "Updated", IsCompleted = false, Category = "Category" });

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Fact]
    public async Task ToggleComplete_ChecksItem()
    {
        var created = await CreateItem("Task");

        var updateResponse = await _client.PutAsJsonAsync($"/todos/{created.Id}",
            new { Text = "Task", IsCompleted = true });

        var updated = await updateResponse.Content.ReadFromJsonAsync<TodoItem>();
        Assert.True(updated!.IsCompleted);
    }

    [Fact]
    public async Task ToggleComplete_UnchecksItem()
    {
        var created = await CreateItem("Task");
        await _client.PutAsJsonAsync($"/todos/{created.Id}", new { Text = "Task", IsCompleted = true });

        var updateResponse = await _client.PutAsJsonAsync($"/todos/{created.Id}",
            new { Text = "Task", IsCompleted = false });

        var updated = await updateResponse.Content.ReadFromJsonAsync<TodoItem>();
        Assert.False(updated!.IsCompleted);
    }

    [Fact]
    public async Task DeleteItem_ReturnsNoContent()
    {
        var created = await CreateItem("To delete");

        var deleteResponse = await _client.DeleteAsync($"/todos/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteItem_SubsequentUpdate_ReturnsNotFound()
    {
        var created = await CreateItem("To delete");
        await _client.DeleteAsync($"/todos/{created.Id}");

        var updateResponse = await _client.PutAsJsonAsync($"/todos/{created.Id}",
            new { Text = "Ghost", IsCompleted = false });

        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);
    }

    [Fact]
    public async Task Reorder_ChangesItemOrder()
    {
        await using var isolated = new WebApplicationFactory<Program>();
        var client = isolated.CreateClient();

        var r1 = await client.PostAsJsonAsync("/todos", new { Text = "First" });
        var r2 = await client.PostAsJsonAsync("/todos", new { Text = "Second" });
        var item1 = await r1.Content.ReadFromJsonAsync<TodoItem>();
        var item2 = await r2.Content.ReadFromJsonAsync<TodoItem>();

        var reorderResponse = await client.PatchAsJsonAsync("/todos/reorder",
            new { OrderedIds = new[] { item2!.Id, item1!.Id } });

        Assert.Equal(HttpStatusCode.OK, reorderResponse.StatusCode);
        var reordered = await reorderResponse.Content.ReadFromJsonAsync<List<TodoItem>>();
        Assert.Equal(item2.Id, reordered![0].Id);
        Assert.Equal(item1.Id, reordered[1].Id);
    }

    private async Task<TodoItem> CreateItem(string text)
    {
        var response = await _client.PostAsJsonAsync("/todos", new { Text = text });
        return (await response.Content.ReadFromJsonAsync<TodoItem>())!;
    }
}

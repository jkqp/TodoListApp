namespace TodoListApp.Api;

public class TodoItem
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public int Order { get; set; }
}

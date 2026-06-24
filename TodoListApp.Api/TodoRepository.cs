namespace TodoListApp.Api;

public class TodoRepository
{
    private readonly List<TodoItem> _items = new();
    private readonly object _lock = new();

    public List<TodoItem> GetAll()
    {
        lock (_lock)
            return _items.OrderBy(x => x.Order).ToList();
    }

    public TodoItem Add(string text)
    {
        lock (_lock)
        {
            var item = new TodoItem
            {
                Id = Guid.NewGuid(),
                Text = text,
                IsCompleted = false,
                Order = _items.Count > 0 ? _items.Max(x => x.Order) + 1 : 0
            };
            _items.Add(item);
            return item;
        }
    }

    public TodoItem? Update(Guid id, string text, bool isCompleted)
    {
        lock (_lock)
        {
            var item = _items.FirstOrDefault(x => x.Id == id);
            if (item is null) return null;
            item.Text = text;
            item.IsCompleted = isCompleted;
            return item;
        }
    }

    public bool Delete(Guid id)
    {
        lock (_lock)
        {
            var item = _items.FirstOrDefault(x => x.Id == id);
            if (item is null) return false;
            _items.Remove(item);
            return true;
        }
    }

    public List<TodoItem>? Reorder(List<Guid> orderedIds)
    {
        lock (_lock)
        {
            if (orderedIds.Count != _items.Count || orderedIds.Any(id => !_items.Any(x => x.Id == id)))
                return null;

            for (int i = 0; i < orderedIds.Count; i++)
            {
                var item = _items.First(x => x.Id == orderedIds[i]);
                item.Order = i;
            }
            return _items.OrderBy(x => x.Order).ToList();
        }
    }
}

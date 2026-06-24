const API = "";

// ── Validation ─────────────────────────────────────────────────────────────

function validateText(value) {
  return value.trim().length === 0 ? "Field must have content to submit" : null;
}

function applyValidation(input, errorEl, errorMsg) {
  if (errorMsg) {
    input.classList.add("error");
    errorEl.textContent = errorMsg;
    return false;
  }
  input.classList.remove("error");
  errorEl.textContent = "";
  return true;
}

// ── API helpers ─────────────────────────────────────────────────────────────

async function fetchTodos() {
  const res = await fetch(`${API}/todos`);
  return res.json();
}

async function createTodo(text, category) {
  const res = await fetch(`${API}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, category }),
  });
  return res.json();
}

async function updateTodo(id, text, isCompleted, category) {
  const res = await fetch(`${API}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, isCompleted, category }),
  });
  return res.ok ? res.json() : null;
}

async function deleteTodo(id) {
  await fetch(`${API}/todos/${id}`, { method: "DELETE" });
}

async function reorderTodos(orderedIds) {
  await fetch(`${API}/todos/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
}

// ── Drag-and-drop state ─────────────────────────────────────────────────────

let dragSrcId = null;

// ── Render ──────────────────────────────────────────────────────────────────

async function renderList() {
  const todos = await fetchTodos();
  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  if (todos.length === 0) {
    list.innerHTML = '<li class="empty-state">No tasks yet — add one above!</li>';
    return;
  }

  todos.forEach((todo) => {
    const li = buildItem(todo);
    list.appendChild(li);
  });
}

function buildItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item";
  li.dataset.id = todo.id;
  li.draggable = true;

  // Drag events
  li.addEventListener("dragstart", (e) => {
    dragSrcId = todo.id;
    li.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
    document
      .querySelectorAll(".todo-item.drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  });

  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragSrcId !== todo.id) li.classList.add("drag-over");
  });

  li.addEventListener("dragleave", () => li.classList.remove("drag-over"));

  li.addEventListener("drop", async (e) => {
    e.preventDefault();
    li.classList.remove("drag-over");
    if (dragSrcId === todo.id) return;

    const list = document.getElementById("todo-list");
    const items = [...list.querySelectorAll(".todo-item[data-id]")];
    const ids = items.map((el) => el.dataset.id);

    const srcIdx = ids.indexOf(dragSrcId);
    const dstIdx = ids.indexOf(todo.id);
    ids.splice(srcIdx, 1);
    ids.splice(dstIdx, 0, dragSrcId);

    // Optimistic DOM reorder
    const srcEl = list.querySelector(`[data-id="${dragSrcId}"]`);
    const dstEl = list.querySelector(`[data-id="${todo.id}"]`);
    if (srcIdx < dstIdx) {
      dstEl.after(srcEl);
    } else {
      dstEl.before(srcEl);
    }

    await reorderTodos(ids);
  });

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.isCompleted;
  checkbox.addEventListener("change", async () => {
    await updateTodo(todo.id, todo.text, checkbox.checked, todo.category);
    span.classList.toggle("completed", checkbox.checked);
  });

  // Text span
  const span = document.createElement("span");
  span.className = "todo-text" + (todo.isCompleted ? " completed" : "");
  span.textContent = todo.text;

  // Category badge (read-only in view mode)
  const categoryBadge = document.createElement("span");
  categoryBadge.className = "category-badge";
  categoryBadge.textContent = todo.category;

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.className = "btn-icon btn-edit";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => enterEditMode(li, todo, span, editBtn, deleteBtn));

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-icon btn-delete";
  deleteBtn.textContent = "Del";
  deleteBtn.addEventListener("click", async () => {
    await deleteTodo(todo.id);
    li.remove();
    if (document.querySelectorAll(".todo-item[data-id]").length === 0) {
      document.getElementById("todo-list").innerHTML =
        '<li class="empty-state">No tasks yet — add one above!</li>';
    }
  });

  li.append(checkbox, span, categoryBadge, editBtn, deleteBtn);
  return li;
}

function buildCategorySelect(currentCategory) {
  const select = document.createElement("select");
  select.className = "category-select";
  ["Category", "Cleaning", "Work", "Life"].forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    if (opt === currentCategory) option.selected = true;
    select.appendChild(option);
  });
  return select;
}

function enterEditMode(li, todo, span, editBtn, deleteBtn) {
  li.draggable = false;

  span.replaceWith(buildEditField(li, todo, span, editBtn, deleteBtn));

  const badge = li.querySelector(".category-badge");
  const categorySelect = buildCategorySelect(todo.category);
  const categoryErrorSpan = document.createElement("span");
  categoryErrorSpan.className = "inline-error category-error";
  badge.replaceWith(categorySelect);
  categorySelect.after(categoryErrorSpan);

  categorySelect.addEventListener("change", () => {
    if (categorySelect.value !== "Category") {
      categorySelect.classList.remove("error");
      categoryErrorSpan.textContent = "";
    }
  });

  editBtn.replaceWith(buildSaveButton(li, todo, span, editBtn, deleteBtn));

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn-icon btn-cancel";
  cancelBtn.textContent = "✕";
  cancelBtn.addEventListener("click", () => exitEditMode(li, todo, span, editBtn, deleteBtn));
  deleteBtn.replaceWith(cancelBtn);

  li.querySelector(".edit-input").focus();
}

function buildEditField(li, todo, span, editBtn, deleteBtn) {
  const errorSpan = document.createElement("span");
  errorSpan.className = "inline-error";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit-input";
  input.value = todo.text;
  input.dataset.role = "edit-input";

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") await trySave(li, todo, span, editBtn, deleteBtn, input, errorSpan);
    if (e.key === "Escape") exitEditMode(li, todo, span, editBtn, deleteBtn);
  });

  // Wrap in a fragment so we can insert both
  const wrapper = document.createDocumentFragment();
  wrapper.append(input, errorSpan);
  return wrapper;
}

function buildSaveButton(li, todo, span, editBtn, deleteBtn) {
  const saveBtn = document.createElement("button");
  saveBtn.className = "btn-icon btn-save";
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", async () => {
    const input = li.querySelector(".edit-input");
    const errorSpan = li.querySelector(".inline-error");
    await trySave(li, todo, span, editBtn, deleteBtn, input, errorSpan);
  });
  return saveBtn;
}

async function trySave(li, todo, span, editBtn, deleteBtn, input, errorSpan) {
  const categorySelect = li.querySelector(".category-select");
  const categoryErrorSpan = li.querySelector(".category-error");

  const textError = validateText(input.value);
  const categoryError = categorySelect ? validateCategory(categorySelect.value) : null;
  const textValid = applyValidation(input, errorSpan, textError);
  const categoryValid = applyValidation(categorySelect, categoryErrorSpan, categoryError);
  if (!textValid || !categoryValid) return;

  const category = categorySelect ? categorySelect.value : todo.category;
  const updated = await updateTodo(todo.id, input.value.trim(), todo.isCompleted, category);
  if (!updated) return;

  todo.text = updated.text;
  todo.isCompleted = updated.isCompleted;
  todo.category = updated.category;
  span.textContent = todo.text;

  exitEditMode(li, todo, span, editBtn, deleteBtn);
}

function exitEditMode(li, todo, span, editBtn, deleteBtn) {
  const input = li.querySelector(".edit-input");
  const categorySelect = li.querySelector(".category-select");
  const categoryErrorSpan = li.querySelector(".category-error");
  const saveBtn = li.querySelector(".btn-save");
  const cancelBtn = li.querySelector(".btn-cancel");

  if (input) {
    const textErrorSpan = li.querySelector(".inline-error:not(.category-error)");
    if (textErrorSpan) textErrorSpan.remove();
    input.replaceWith(span);
  }
  if (categoryErrorSpan) categoryErrorSpan.remove();
  if (categorySelect) {
    const badge = document.createElement("span");
    badge.className = "category-badge";
    badge.textContent = todo.category;
    categorySelect.replaceWith(badge);
  }
  if (saveBtn) saveBtn.replaceWith(editBtn);
  if (cancelBtn) cancelBtn.replaceWith(deleteBtn);

  li.draggable = true;
}

// ── Add form ────────────────────────────────────────────────────────────────

function validateCategory(value) {
  return value === "Category" ? "must have a category" : null;
}

function initAddForm() {
  const form = document.getElementById("add-form");
  const input = document.getElementById("add-input");
  const categorySelect = document.getElementById("add-category");
  const errorEl = document.getElementById("add-error");
  const categoryErrorEl = document.getElementById("add-category-error");

  async function handleAdd() {
    const textError = validateText(input.value);
    const categoryError = validateCategory(categorySelect.value);
    const textValid = applyValidation(input, errorEl, textError);
    const categoryValid = applyValidation(categorySelect, categoryErrorEl, categoryError);
    if (!textValid || !categoryValid) return;

    await createTodo(input.value.trim(), categorySelect.value);
    input.value = "";
    categorySelect.value = "Category";
    await renderList();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleAdd();
  });

  input.addEventListener("input", () => {
    if (input.classList.contains("error") && input.value.trim().length > 0) {
      input.classList.remove("error");
      errorEl.textContent = "";
    }
  });

  categorySelect.addEventListener("change", () => {
    if (categorySelect.value !== "Category") {
      categorySelect.classList.remove("error");
      categoryErrorEl.textContent = "";
    }
  });
}

// ── Boot ────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initAddForm();
  renderList();
});

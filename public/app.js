// API endpoints
const API_BASE = '/api/todos';

// DOM elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');

// State
let todos = [];
let editingId = null;

// Fetch all todos
async function fetchTodos() {
    try {
        const response = await fetch(API_BASE);
        todos = await response.json();
        renderTodos();
    } catch (error) {
        alert('Failed to load todos');
    }
}

// Add a new todo
async function addTodo() {
    const text = todoInput.value.trim();

    if (!text) {
        alert('Please enter a todo');
        return;
    }

    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    if (response.ok) {
        const newTodo = await response.json();
        todos.push(newTodo);
        todoInput.value = '';
        renderTodos();
    }
}

// Toggle todo
async function toggleTodo(id) {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
    });

    if (response.ok) {
        const updated = await response.json();
        const index = todos.findIndex(t => t.id === id);
        todos[index] = updated;
        renderTodos();
    }
}

// Delete todo
async function deleteTodo(id) {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        todos = todos.filter(t => t.id !== id);
        renderTodos();
    }
}

// Start editing
function startEdit(id) {
    editingId = id;
    renderTodos();
}

// Save edit
async function saveEdit(id) {
    const input = document.getElementById(`edit-input-${id}`);
    const newText = input.value.trim();

    if (!newText) {
        alert("Todo cannot be empty");
        return;
    }

    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
    });

    if (response.ok) {
        const updated = await response.json();
        const index = todos.findIndex(t => t.id === id);
        todos[index] = updated;
        editingId = null;
        renderTodos();
    }
}

// Cancel edit
function cancelEdit() {
    editingId = null;
    renderTodos();
}

// Render todos
function renderTodos() {
    if (todos.length === 0) {
        todoList.innerHTML = '<div class="empty-state">No todos yet. Add one above!</div>';
    } else {
        todoList.innerHTML = todos.map(todo => {

            if (editingId === todo.id) {
                return `
                <div class="todo-item">
                    <input type="text" id="edit-input-${todo.id}" value="${escapeHtml(todo.text)}" />
                    <button onclick="saveEdit(${todo.id})">Save</button>
                    <button onclick="cancelEdit()">Cancel</button>
                </div>
                `;
            }

            return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <input 
                    type="checkbox"
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo(${todo.id})"
                />
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button onclick="startEdit(${todo.id})">Edit</button>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
            </div>
            `;
        }).join('');
    }

    updateStats();
}

// Update stats
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    totalCount.textContent = `Total: ${total}`;
    completedCount.textContent = `Completed: ${completed}`;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Events
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// Init
fetchTodos();

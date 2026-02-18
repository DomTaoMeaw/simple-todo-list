const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TODOS_FILE = path.join(__dirname, 'todos.json');

app.use(express.json());
app.use(express.static('public'));

/* --------------------------
   File Utilities (Async)
---------------------------*/

async function initTodosFile() {
  try {
    await fs.access(TODOS_FILE);
  } catch {
    await fs.writeFile(TODOS_FILE, JSON.stringify([]));
  }
}

async function readTodos() {
  const data = await fs.readFile(TODOS_FILE, 'utf8');
  return JSON.parse(data);
}

async function writeTodos(todos) {
  await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
}

/* --------------------------
   Middleware
---------------------------*/

function validateId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  req.todoId = id;
  next();
}

/* --------------------------
   Routes
---------------------------*/

// Get all todos
app.get('/api/todos', async (req, res, next) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (err) {
    next(err);
  }
});

// Add todo
app.post('/api/todos', async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const todos = await readTodos();

    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    await writeTodos(todos);

    res.status(201).json(newTodo);
  } catch (err) {
    next(err);
  }
});

// Toggle completion
app.put('/api/todos/:id', validateId, async (req, res, next) => {
  try {
    const todos = await readTodos();
    const todo = todos.find(t => t.id === req.todoId);

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todo.completed = !todo.completed;

    await writeTodos(todos);

    res.json(todo);
  } catch (err) {
    next(err);
  }
});

// Delete todo
app.delete('/api/todos/:id', validateId, async (req, res, next) => {
  try {
    const todos = await readTodos();
    const filtered = todos.filter(t => t.id !== req.todoId);

    if (filtered.length === todos.length) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await writeTodos(filtered);

    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/* --------------------------
   Error Handler
---------------------------*/

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

/* --------------------------
   Startup
---------------------------*/

initTodosFile();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

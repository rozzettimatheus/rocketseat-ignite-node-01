const express = require("express");
const cors = require("cors");
const { v4: uuidv4, validate } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({
      error: `User does not exists`,
    });
  }

  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.find((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({
      error: "User already exists",
    });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { title, deadline } = request.body;
  const { id } = request.params;

  if (!validate(id)) {
    return response.status(404).json({
      error: "ID must be in UUID format",
    });
  }

  const user = users.find((user) => user.username === username);

  const idx = user.todos.findIndex((todo) => todo.id === id);

  if (idx < 0) {
    return response.status(404).json({ error: "TODO not found" });
  }

  const todo = {
    ...user.todos[idx],
    title,
    deadline: new Date(deadline),
  };

  user.todos[idx] = todo;

  return response.json(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;

  if (!validate(id)) {
    return response.status(404).json({
      error: "ID must be in UUID format",
    });
  }

  const user = users.find((user) => user.username === username);

  const idx = user.todos.findIndex((todo) => todo.id === id);

  if (idx === -1) {
    return response.status(404).json({ error: "TODO not found" });
  }

  user.todos[idx].done = true;

  return response.json(user.todos[idx]);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;

  if (!validate(id)) {
    return response.status(404).json({
      error: "ID must be in UUID format",
    });
  }

  const user = users.find((user) => user.username === username);

  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: "TODO not found" });
  }

  user.todos.splice(todo, 1);

  return response.status(204).send();
});

module.exports = app;

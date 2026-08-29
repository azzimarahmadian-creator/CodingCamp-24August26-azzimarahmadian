// @vitest-environment jsdom

/**
 * Unit / Property-Based tests for TodoList
 * Feature: todo-list-life-dashboard
 *
 * Loads js/app.js by wrapping it in a function that returns its top-level
 * namespaces so they can be used in a jsdom test environment.
 */

import { describe, it, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_SRC = readFileSync(resolve(__dirname, "../../js/app.js"), "utf-8");

// Wrap app source in a factory function that returns the module-level objects.
// app.js uses `const` at the top scope, so wrapping in a function body makes
// them available as local bindings that can be explicitly returned.
// eslint-disable-next-line no-new-func
const createApp = new Function(
  APP_SRC + "\nreturn { Utils, Storage, TodoList, todoState };"
);

// ---------------------------------------------------------------------------
// Minimal DOM fixture — all element IDs that TodoList reads / writes
// ---------------------------------------------------------------------------

function buildDOM() {
  document.body.innerHTML = `
    <form id="todo-form">
      <input id="todo-input" type="text" />
      <button type="submit">Add</button>
    </form>
    <p id="todo-input-error" hidden></p>
    <ul id="todo-list" role="list"></ul>
    <p id="storage-error" hidden></p>
  `;
}

// ---------------------------------------------------------------------------
// Per-test state — rebuilt fresh for every test (and for every fc run)
// ---------------------------------------------------------------------------

let app;

beforeEach(() => {
  localStorage.clear();
  buildDOM();
  app = createApp();
  app.todoState.tasks = [];
  app.todoState.editingId = null;
});

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// Property 13: Tasks render in insertion order
// Feature: todo-list-life-dashboard, Property 13: Tasks render in insertion order
// ---------------------------------------------------------------------------

describe("Property 13: Tasks render in insertion order", () => {
  it("rendered DOM order matches insertion (ascending createdAt) order", () => {
    // Feature: todo-list-life-dashboard, Property 13: Tasks render in insertion order
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          { minLength: 0, maxLength: 10 }
        ),
        (texts) => {
          // Reset state and DOM for each generated input
          app.todoState.tasks = [];
          app.todoState.editingId = null;
          buildDOM();

          // Add tasks sequentially — each addTask call uses Date.now() for
          // createdAt, so tasks are stamped in insertion order
          for (const text of texts) {
            app.TodoList.addTask(text);
          }

          // Read the rendered <li> elements from the DOM
          const listEl = document.getElementById("todo-list");
          const renderedItems = Array.from(listEl.querySelectorAll("li"));

          // Must have exactly as many items as texts added
          if (renderedItems.length !== texts.length) return false;

          // Extract text from each task's .task__text span in DOM order
          const renderedTexts = renderedItems.map(li => {
            const span = li.querySelector(".task__text");
            return span ? span.textContent : null;
          });

          // Expected order: tasks sorted by ascending createdAt
          const sortedTasks = app.todoState.tasks
            .slice()
            .sort((a, b) => a.createdAt - b.createdAt);

          const expectedTexts = sortedTasks.map(t => t.text);

          // Each DOM position must match the corresponding sorted task text
          for (let i = 0; i < expectedTexts.length; i++) {
            if (renderedTexts[i] !== expectedTexts[i]) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

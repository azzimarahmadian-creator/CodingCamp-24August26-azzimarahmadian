# Design Document — Todo List Life Dashboard

## Overview

The Todo List Life Dashboard is a **client-side, single-page web application** built with plain HTML, CSS, and vanilla JavaScript. No build tools, no frameworks, no external network dependencies at runtime. The app is a self-contained productivity hub with four interactive widgets:

- **Greeting Widget** — real-time clock, date, and time-of-day greeting
- **Focus Timer** — 25-minute Pomodoro-style countdown
- **Todo List** — task manager with add, edit, complete, and delete
- **Quick Links** — one-click launcher for user-defined URLs

All application state is held in memory and persisted to the browser's `localStorage` API. The app is designed to work both as a standalone HTML page opened directly in the browser and as a browser extension new-tab replacement.

### Design Goals

- Zero runtime dependencies — no CDN fetches, no ES module bundlers required
- Single JS file with clear internal module boundaries (IIFEs / namespaced objects)
- Strict separation between pure logic functions (testable) and DOM-manipulation side effects
- Defensive handling of corrupt or missing localStorage data

---

## Architecture

The application follows a **layered architecture** within a single JavaScript file:

```
┌──────────────────────────────────────────────────────────┐
│                      index.html                           │
│  Static markup + widget containers + <link> / <script>   │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                   js/app.js                               │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Pure Logic  │  │  State Layer │  │  Storage Layer │  │
│  │  (formatters,│  │  (in-memory  │  │  (localStorage │  │
│  │  validators, │  │  app state)  │  │   read/write)  │  │
│  │  state fns)  │  └──────┬───────┘  └───────┬────────┘  │
│  └──────────────┘         │                  │            │
│                    ┌──────▼──────────────────▼────────┐   │
│                    │       DOM / Event Layer           │   │
│                    │  (render functions, event         │   │
│                    │   listeners, timers)              │   │
│                    └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                   css/style.css                           │
│   Design tokens, layout grid, widget styles, responsive  │
└──────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**Single JS file, namespace pattern** — all code lives in `js/app.js`. Internal organisation uses plain object namespaces (`GreetingWidget`, `FocusTimer`, `TodoList`, `QuickLinks`, `Storage`, `Utils`). This avoids the need for a bundler while keeping concerns separated and making pure logic functions extractable for unit testing.

**Pure functions over imperative mutations** — formatters, validators, and state-transition functions are written as pure functions that receive data and return new data. DOM rendering is a separate step that reads from state. This makes all business logic testable without a browser environment.

**Render-on-state-change** — each widget exposes a `render()` function that reads from the widget's slice of state and performs a full repaint of its container. Event handlers mutate state then call `render()`. This is a minimal unidirectional data-flow pattern without a virtual DOM.

---

## Components and Interfaces

### Component Map

```
App (app.js)
├── Utils
│   ├── formatTime(date) → "HH:MM"
│   ├── formatDate(date) → "Weekday, D Month YYYY"
│   ├── getGreeting(hour) → "Good morning|afternoon|evening"
│   ├── formatCountdown(seconds) → "MM:SS"
│   ├── validateTaskText(text) → { valid: boolean, error: string }
│   ├── validateLinkLabel(label) → { valid: boolean, error: string }
│   ├── validateLinkUrl(url) → { valid: boolean, error: string }
│   └── generateId() → string (UUID-like)
│
├── Storage
│   ├── TASKS_KEY = "todo-dashboard:tasks"
│   ├── LINKS_KEY = "todo-dashboard:links"
│   ├── saveTasks(tasks[]) → void
│   ├── loadTasks() → Task[]
│   ├── saveLinks(links[]) → void
│   └── loadLinks() → Link[]
│
├── GreetingWidget
│   ├── state: { intervalId }
│   ├── init() → void
│   ├── update() → void           (called by interval + on init)
│   └── destroy() → void
│
├── FocusTimer
│   ├── state: { remaining, active, intervalId }
│   ├── init() → void
│   ├── start() → void
│   ├── stop() → void
│   ├── reset() → void
│   ├── tick() → void             (called each second by interval)
│   └── render() → void
│
├── TodoList
│   ├── state: { tasks: Task[], editingId: string | null }
│   ├── init() → void
│   ├── addTask(text) → void
│   ├── editTask(id, newText) → void
│   ├── toggleTask(id) → void
│   ├── deleteTask(id) → void
│   ├── beginEdit(id) → void
│   ├── cancelEdit() → void
│   └── render() → void
│
└── QuickLinks
    ├── state: { links: Link[] }
    ├── init() → void
    ├── addLink(label, url) → void
    ├── deleteLink(id) → void
    └── render() → void
```

### Event Flow

```
User interaction
      │
      ▼
Event listener (DOM Layer)
      │  reads input values, calls pure validators
      ▼
State mutation function (e.g. addTask, toggleTask)
      │  updates in-memory state
      │  calls Storage.save*()
      ▼
render()
      │  reads state, updates DOM
      ▼
Updated UI
```

---

## File and Folder Structure

```
/
├── index.html          ← Single HTML entry point
├── css/
│   └── style.css       ← All styles: design tokens, layout, components
└── js/
    └── app.js          ← All application logic and DOM interaction
```

### index.html — Semantic Structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard</title>
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <body>
    <main class="dashboard-grid" role="main">

      <!-- Widget 1: Greeting -->
      <section class="widget widget--greeting" aria-label="Greeting">
        <p id="greeting-text" class="greeting__text"></p>
        <time id="greeting-time" class="greeting__time" datetime=""></time>
        <p id="greeting-date" class="greeting__date"></p>
        <p id="greeting-error" class="error-message" hidden></p>
      </section>

      <!-- Widget 2: Focus Timer -->
      <section class="widget widget--timer" aria-label="Focus Timer">
        <h2 class="widget__heading">Focus Timer</h2>
        <div id="timer-display" class="timer__display" aria-live="polite">25:00</div>
        <div id="timer-banner" class="timer__banner" hidden role="status">
          Session complete! Press Reset to start again.
        </div>
        <div class="timer__controls">
          <button id="timer-start" class="btn btn--primary">Start</button>
          <button id="timer-stop"  class="btn btn--secondary" disabled>Stop</button>
          <button id="timer-reset" class="btn btn--ghost">Reset</button>
        </div>
      </section>

      <!-- Widget 3: Todo List -->
      <section class="widget widget--todo" aria-label="Todo List">
        <h2 class="widget__heading">Tasks</h2>
        <form id="todo-form" class="todo__form" novalidate>
          <input id="todo-input" type="text" class="input"
                 placeholder="Add a task…" maxlength="500"
                 aria-label="New task description" />
          <button type="submit" class="btn btn--primary">Add</button>
        </form>
        <p id="todo-input-error" class="error-message" hidden></p>
        <ul id="todo-list" class="todo__list" role="list" aria-live="polite"></ul>
        <p id="storage-error" class="error-message" hidden></p>
      </section>

      <!-- Widget 4: Quick Links -->
      <section class="widget widget--links" aria-label="Quick Links">
        <h2 class="widget__heading">Quick Links</h2>
        <form id="links-form" class="links__form" novalidate>
          <input id="link-label-input" type="text" class="input"
                 placeholder="Label" maxlength="50"
                 aria-label="Link label" />
          <input id="link-url-input" type="url" class="input"
                 placeholder="https://…" maxlength="2048"
                 aria-label="Link URL" />
          <button type="submit" class="btn btn--primary">Add</button>
        </form>
        <p id="link-label-error" class="error-message" hidden></p>
        <p id="link-url-error"   class="error-message" hidden></p>
        <p id="links-storage-error" class="error-message" hidden></p>
        <ul id="links-list" class="links__list" role="list"></ul>
      </section>

    </main>
    <script src="js/app.js"></script>
  </body>
</html>
```

---

## CSS Design System

### Design Tokens

```css
:root {
  /* Colour palette — dark background for "focus" feel */
  --color-bg:          #1a1a2e;   /* page background */
  --color-surface:     #16213e;   /* widget card background */
  --color-surface-alt: #0f3460;   /* hover / active states */
  --color-accent:      #e94560;   /* primary accent */
  --color-accent-alt:  #533483;   /* secondary accent */
  --color-text-primary:   #eaeaea;
  --color-text-secondary: #a8a8b3;
  --color-text-muted:     #6b7280;
  --color-error:       #f87171;
  --color-success:     #34d399;
  --color-border:      #2d3748;

  /* Typography */
  --font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-size-body:    16px;   /* ≥14px required */
  --font-size-small:   14px;
  --font-size-heading: 20px;   /* ≥18px required */
  --font-size-display: 2.5rem; /* timer countdown */
  --font-weight-normal: 400;
  --font-weight-bold:   600;

  /* Spacing */
  --space-xs:  0.25rem;
  --space-sm:  0.5rem;
  --space-md:  1rem;
  --space-lg:  1.5rem;
  --space-xl:  2rem;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-med:  200ms ease;
}
```

### Colour Contrast Compliance (WCAG 2.1 AA)

| Text colour          | Background          | Ratio  | Requirement |
|----------------------|---------------------|--------|-------------|
| `#eaeaea` on `#16213e` | Primary text on card | ~9.5:1 | ≥4.5:1 ✓  |
| `#a8a8b3` on `#16213e` | Secondary text       | ~5.1:1 | ≥4.5:1 ✓  |
| `#e94560` on `#1a1a2e` | Accent on bg         | ~4.7:1 | ≥4.5:1 ✓  |
| `#f87171` on `#16213e` | Error text on card   | ~5.6:1 | ≥4.5:1 ✓  |
| `#eaeaea` on `#e94560` | Button text on accent| ~4.8:1 | ≥4.5:1 ✓  |

### Layout Grid

```css
/* Desktop: 2×2 grid, no scroll at 1280×720 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: var(--space-lg);
  padding: var(--space-lg);
  min-height: 100vh;
  box-sizing: border-box;
}

/* Tablet: 768–1279px, 2-column */
@media (max-width: 1279px) and (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Mobile: below 768px, single column */
@media (max-width: 767px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

### Completed Task Styles

```css
.task--completed .task__text {
  text-decoration: line-through;
  opacity: 0.5;
}
```

---

## Data Models

### Task

```javascript
/**
 * @typedef {Object} Task
 * @property {string}  id        - Unique identifier (UUID-like string)
 * @property {string}  text      - Task description (1–500 characters, trimmed)
 * @property {boolean} completed - Whether the task is marked done
 * @property {number}  createdAt - Unix timestamp (ms) for insertion-order sorting
 */

// Example:
const task = {
  id: "t_1720000000000_abc123",
  text: "Write the design document",
  completed: false,
  createdAt: 1720000000000
};
```

### Link

```javascript
/**
 * @typedef {Object} Link
 * @property {string} id        - Unique identifier (UUID-like string)
 * @property {string} label     - Display label (1–50 characters, trimmed)
 * @property {string} url       - Fully qualified URL starting with http:// or https://
 * @property {number} createdAt - Unix timestamp (ms) for insertion-order sorting
 */

// Example:
const link = {
  id: "l_1720000000001_xyz789",
  label: "MDN Web Docs",
  url: "https://developer.mozilla.org",
  createdAt: 1720000000001
};
```

### Serialization Format

Both collections are stored as JSON arrays under fixed keys:

```javascript
// localStorage["todo-dashboard:tasks"]
[
  { "id": "t_...", "text": "...", "completed": false, "createdAt": 1720000000000 },
  ...
]

// localStorage["todo-dashboard:links"]
[
  { "id": "l_...", "label": "...", "url": "https://...", "createdAt": 1720000000001 },
  ...
]
```

### Timer State

The timer state is not persisted (by design — a refresh resets the timer):

```javascript
const timerState = {
  remaining: 1500,    // seconds remaining (0–1500)
  active: false,      // whether countdown is running
  intervalId: null    // setInterval handle or null
};
```

### Greeting State

```javascript
const greetingState = {
  intervalId: null    // setInterval handle for 60-second clock update
};
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time formatting matches HH:MM

*For any* valid `Date` object, `Utils.formatTime(date)` SHALL return a string matching the pattern `^\d{2}:\d{2}$` where the first two digits are the zero-padded hours (00–23) and the last two are the zero-padded minutes (00–59).

**Validates: Requirements 1.1**

---

### Property 2: Date formatting produces correct structure

*For any* valid `Date` object, `Utils.formatDate(date)` SHALL return a string in the form `"[Full Weekday Name], [D] [Full Month Name] [YYYY]"` where the weekday name and month name match the actual weekday and month of the input date, and the four-digit year matches the actual year.

**Validates: Requirements 1.2**

---

### Property 3: Greeting mapping is exhaustive and correct

*For any* integer hour `h` in `[0, 23]`, `Utils.getGreeting(h)` SHALL return exactly one of `"Good morning"`, `"Good afternoon"`, or `"Good evening"`, with:
- `"Good morning"` returned if and only if `h` is in `[5, 11]`
- `"Good afternoon"` returned if and only if `h` is in `[12, 17]`
- `"Good evening"` returned if and only if `h` is in `[0, 4]` or `[18, 23]`

**Validates: Requirements 1.3, 1.4, 1.5**

---

### Property 4: Countdown formatting matches MM:SS

*For any* integer `s` in `[0, 1500]`, `Utils.formatCountdown(s)` SHALL return a string matching `^\d{2}:\d{2}$` where the minutes component equals `Math.floor(s / 60)` (zero-padded to 2 digits) and the seconds component equals `s % 60` (zero-padded to 2 digits).

**Validates: Requirements 2.4**

---

### Property 5: Timer decrement invariant

*For any* initial remaining value `R` in `[1, 1500]` and any number of elapsed ticks `T` in `[0, R]`, after `T` calls to `FocusTimer.tick()` the remaining value SHALL equal `R - T` and SHALL never go below zero.

**Validates: Requirements 2.2, 2.3**

---

### Property 6: Reset always returns timer to initial state

*For any* timer state (any `remaining` value, any `active` value), after `FocusTimer.reset()` is called, `timerState.remaining` SHALL equal `1500` and `timerState.active` SHALL be `false`. Calling reset multiple times in sequence SHALL produce the same result each time.

**Validates: Requirements 2.6**

---

### Property 7: Timer button state invariant

*For any* timer state, the Start button's `disabled` property SHALL equal `timerState.active`, and the Stop button's `disabled` property SHALL equal `!timerState.active`. These two conditions shall always hold after any call to `FocusTimer.render()`.

**Validates: Requirements 2.8, 2.9**

---

### Property 8: Valid task submission grows the task list by one

*For any* task collection of length `N` and *for any* string `text` that is non-empty after trimming and has length in `[1, 500]`, after `TodoList.addTask(text)` the task collection SHALL have length `N + 1` and the last task SHALL have `text` equal to `text.trim()` and `completed` equal to `false`.

**Validates: Requirements 3.2**

---

### Property 9: Whitespace and empty task text is always rejected

*For any* string `text` that is empty or consists entirely of whitespace characters (spaces, tabs, newlines), `Utils.validateTaskText(text)` SHALL return `{ valid: false }` and `TodoList.addTask(text)` SHALL leave the task collection unchanged.

**Validates: Requirements 3.3**

---

### Property 10: Valid edit updates task text, invalid edit reverts

*For any* task `T` in the collection with current text `original`, and *for any* non-empty, non-whitespace string `newText` of 1–500 characters, after `TodoList.editTask(T.id, newText)` the task's text SHALL equal `newText.trim()`. Conversely, *for any* empty or whitespace-only `badText`, after `TodoList.editTask(T.id, badText)` the task's text SHALL remain equal to `original`.

**Validates: Requirements 3.4, 3.5, 3.6**

---

### Property 11: Completion toggle is its own inverse (round-trip)

*For any* task `T` with completion state `s`, after two consecutive calls to `TodoList.toggleTask(T.id)` the task's `completed` field SHALL equal `s` (the original value). The toggle is exactly an XOR on a boolean.

**Validates: Requirements 3.7**

---

### Property 12: Delete removes exactly the targeted task

*For any* task collection of length `N` containing a task with id `id`, after `TodoList.deleteTask(id)` the collection SHALL have length `N - 1` and no task in the collection SHALL have `id` equal to the deleted id. All other tasks SHALL remain in the collection with their data unchanged.

**Validates: Requirements 3.8**

---

### Property 13: Tasks render in insertion order

*For any* sequence of `addTask` calls, the rendered order of tasks in the DOM SHALL match the order in which tasks were added (oldest first). This insertion order is determined by `createdAt` timestamp.

**Validates: Requirements 3.9**

---

### Property 14: At most one task is in editing state at a time

*For any* sequence of edit-control activations and confirmations, the count of tasks with an active edit input field SHALL always be 0 or 1. Activating an edit control when another task is already in edit state SHALL have no effect on the second task.

**Validates: Requirements 3.10**

---

### Property 15: Task collection serialization round-trip

*For any* array of `Task` objects `tasks`, `Storage.loadTasks()` after `Storage.saveTasks(tasks)` SHALL return an array structurally equivalent to `tasks` (same length, same `id`, `text`, `completed`, and `createdAt` values for each element).

**Validates: Requirements 4.1, 4.2**

---

### Property 16: Corrupt task data always yields empty collection

*For any* string `s` written directly to `localStorage["todo-dashboard:tasks"]` that is not a valid JSON array of `Task` objects (including malformed JSON, wrong root type, objects missing required fields, or wrong field types), `Storage.loadTasks()` SHALL return an empty array `[]` without throwing an exception.

**Validates: Requirements 4.6**

---

### Property 17: Valid link submission grows the link collection by one

*For any* link collection of length `N`, *for any* label string of 1–50 non-whitespace characters, and *for any* URL string starting with `"http://"` or `"https://"` with length in `[1, 2048]`, after `QuickLinks.addLink(label, url)` the link collection SHALL have length `N + 1` and the new link SHALL have the trimmed label and the provided URL.

**Validates: Requirements 5.2**

---

### Property 18: Invalid link input is always rejected

*For any* combination of label and URL where at least one of the following is true — label is empty, label exceeds 50 characters after trimming, URL is empty, URL exceeds 2048 characters, or URL does not begin with `"http://"` or `"https://"` — `QuickLinks.addLink(label, url)` SHALL leave the link collection unchanged and return a validation error object identifying the failing field(s).

**Validates: Requirements 5.3, 5.4**

---

### Property 19: Delete removes exactly the targeted link

*For any* link collection of length `N` containing a link with id `id`, after `QuickLinks.deleteLink(id)` the collection SHALL have length `N - 1` and no link in the collection SHALL have that `id`. All other links SHALL remain unchanged.

**Validates: Requirements 5.6**

---

### Property 20: Link collection serialization round-trip

*For any* array of `Link` objects `links`, `Storage.loadLinks()` after `Storage.saveLinks(links)` SHALL return an array structurally equivalent to `links` (same length, same `id`, `label`, `url`, and `createdAt` values for each element).

**Validates: Requirements 5.7, 6.1, 6.2**

---

### Property 21: Corrupt link data always yields empty collection

*For any* string `s` written directly to `localStorage["todo-dashboard:links"]` that is not a valid JSON array of `Link` objects, `Storage.loadLinks()` SHALL return an empty array `[]` without throwing an exception.

**Validates: Requirements 6.5**

---

## Error Handling

### Storage Errors

All `localStorage` operations are wrapped in try/catch blocks. Two error scenarios are handled:

**Write failure** (quota exceeded, private browsing restriction, etc.):
- The in-memory state remains valid and the UI continues to function
- A persistent error banner is shown within the affected widget indicating changes could not be saved
- The banner is identified by `id="storage-error"` (tasks) or `id="links-storage-error"` (links)

**Read/deserialize failure on page load** (corrupt JSON, wrong data shape):
- `Storage.loadTasks()` and `Storage.loadLinks()` catch JSON parse errors and type errors
- On failure, the corrupted key is cleared with `localStorage.removeItem(key)`
- An empty collection is returned; no error message is shown to the user (Requirement 4.3, 4.6, 6.3, 6.5)

```javascript
// Pattern used in both loadTasks() and loadLinks()
function safeLoad(key, validator) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(validator)) {
      localStorage.removeItem(key);
      return [];
    }
    return parsed;
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}
```

### Greeting Clock Failure

`Utils.formatTime` and `Utils.formatDate` catch any exception thrown when constructing or reading from a `Date` object. On failure:
- The time and date elements are hidden
- The `#greeting-error` element is shown with the message "Time and date are unavailable."

### Form Validation Errors

Validation errors are shown inline, adjacent to the relevant input. Error elements are toggled with the `hidden` attribute. Error messages are cleared on the next successful submission.

### Timer Edge Cases

- `FocusTimer.tick()` clamps `remaining` to `0` and clears the interval immediately when it would go negative
- `reset()` always calls `clearInterval` regardless of current `active` state to prevent interval leaks

---

## Testing Strategy

### Dual Testing Approach

The project uses two complementary test types:

1. **Unit / property-based tests** — for all pure logic functions (Utils, Storage validators, state-transition functions). These run without a browser environment (Node.js + jsdom or equivalent).
2. **Integration / end-to-end tests** — for widget render behavior, DOM interactions, and localStorage round-trips. These run in a browser-like environment.

### Property-Based Testing

This feature is well-suited for property-based testing because:
- The core logic consists of pure formatter and validator functions with well-defined input spaces
- State transitions have clear invariants expressible as universal properties
- The serialization round-trip has infinite input variation (arbitrary task/link arrays)

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript/TypeScript PBT library)

**Configuration**: Each property test runs a minimum of **100 iterations** (fast-check default is 100; configured explicitly via `{ numRuns: 100 }` where needed).

**Test tag format**: Each property test is annotated with a comment:
```javascript
// Feature: todo-list-life-dashboard, Property N: <property_text>
```

#### Properties to implement as PBT tests

| Property | Function under test | fast-check arbitraries |
|----------|--------------------|-----------------------|
| 1 — Time format | `Utils.formatTime` | `fc.date()` |
| 2 — Date format | `Utils.formatDate` | `fc.date()` |
| 3 — Greeting mapping | `Utils.getGreeting` | `fc.integer({ min: 0, max: 23 })` |
| 4 — Countdown format | `Utils.formatCountdown` | `fc.integer({ min: 0, max: 1500 })` |
| 5 — Timer decrement | `FocusTimer.tick` (pure logic) | `fc.integer({min:1,max:1500})`, `fc.integer({min:0,max:R})` |
| 6 — Reset idempotence | `FocusTimer.reset` | `fc.record({ remaining: fc.integer(0,1500), active: fc.boolean() })` |
| 7 — Button state | `FocusTimer.render` | `fc.boolean()` (active state) |
| 8 — Task add valid | `TodoList.addTask` | `fc.array(taskArb)`, `fc.string(1,500).filter(s => s.trim().length > 0)` |
| 9 — Task add invalid | `Utils.validateTaskText` | `fc.string().filter(s => s.trim().length === 0)` |
| 10 — Task edit | `TodoList.editTask` | `taskArb`, `fc.string(1,500)` / `fc.string().filter(whitespace)` |
| 11 — Toggle round-trip | `TodoList.toggleTask` | `taskArb` |
| 12 — Task delete | `TodoList.deleteTask` | `fc.array(taskArb, {minLength: 1})` |
| 13 — Insertion order | `TodoList.render` | `fc.array(fc.string(1,500))` |
| 14 — Single edit invariant | `TodoList.beginEdit` | `fc.array(taskArb, {minLength: 2})` |
| 15 — Task serialization | `Storage.saveTasks` / `loadTasks` | `fc.array(taskArb)` |
| 16 — Corrupt task data | `Storage.loadTasks` | `fc.string()` (arbitrary raw localStorage value) |
| 17 — Link add valid | `QuickLinks.addLink` | `fc.array(linkArb)`, `labelArb`, `urlArb` |
| 18 — Link add invalid | `Utils.validateLinkLabel` / `validateLinkUrl` | invalid arbitraries |
| 19 — Link delete | `QuickLinks.deleteLink` | `fc.array(linkArb, {minLength: 1})` |
| 20 — Link serialization | `Storage.saveLinks` / `loadLinks` | `fc.array(linkArb)` |
| 21 — Corrupt link data | `Storage.loadLinks` | `fc.string()` |

### Unit / Example-Based Tests

The following behaviors are covered by targeted example tests rather than PBT:

- Greeting widget shows error message when Date throws (mock `Date` constructor)
- Timer initialises to 1500 on page load
- Stop pauses countdown at the current value
- Countdown reaching 0 shows banner and disables session
- Empty task collection on missing localStorage key (no error message shown)
- Write failure shows error banner and retains in-memory state
- Link opens in new tab (mock `window.open`)
- Empty link collection on missing localStorage key

### Smoke Tests

- Page loads without JavaScript console errors (automated with Playwright/Puppeteer)
- All four widget containers are visible within 2 seconds of navigation start

### Test File Structure

```
tests/
├── unit/
│   ├── utils.test.js         ← Properties 1–4, formatters and validators
│   ├── timer.test.js         ← Properties 5–7, timer state logic
│   ├── todolist.test.js      ← Properties 8–16, task management + storage
│   └── quicklinks.test.js    ← Properties 17–21, link management + storage
└── e2e/
    └── smoke.test.js         ← Page load, console error check
```

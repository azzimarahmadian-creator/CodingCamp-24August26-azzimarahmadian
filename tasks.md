# Implementation Plan: Todo List Life Dashboard

## Overview

Implement a zero-dependency, single-page productivity dashboard as three files: `index.html`, `css/style.css`, and `js/app.js`. The implementation follows a strict layer order — scaffolding → styles → pure logic (Utils + Storage) → widget logic → bootstrap — so that each step produces a testable, runnable increment.

---

## Tasks

- [x] 1. Project scaffolding — create file structure and HTML skeleton
  - Create the directory layout: `css/`, `js/`, `tests/unit/`, `tests/e2e/`
  - Write `index.html` with the full semantic markup defined in the design: `<main class="dashboard-grid">` containing all four `<section>` widget containers with their IDs, ARIA labels, `aria-live` regions, and button elements exactly as specified
  - Link `css/style.css` and `js/app.js` from `index.html`
  - Add `package.json` with `vitest` and `fast-check` dev dependencies, plus a `"test"` script that runs `vitest --run`
  - _Requirements: 8.1_

- [x] 2. CSS design system — tokens, reset, and base styles
  - [x] 2.1 Write design tokens and reset in `css/style.css`
    - Define all `:root` CSS custom properties exactly as specified in the design: colour palette (`--color-bg`, `--color-surface`, `--color-surface-alt`, `--color-accent`, `--color-accent-alt`, text colours, error, success, border), typography (`--font-family`, all `--font-size-*`, `--font-weight-*`), spacing (`--space-xs` through `--space-xl`), borders (`--radius-sm/md/lg`), transitions
    - Apply a minimal CSS reset (box-sizing, margin/padding zeroing on common elements)
    - Set `body` to use `var(--font-family)`, `var(--font-size-body)`, `var(--color-text-primary)`, and `var(--color-bg)` background
    - _Requirements: 7.3, 7.4_

  - [x] 2.2 Implement dashboard layout grid and responsive breakpoints
    - Write `.dashboard-grid` as a 2×2 CSS Grid with `gap: var(--space-lg)`, `padding: var(--space-lg)`, `min-height: 100vh`
    - Add `@media (max-width: 1279px) and (min-width: 768px)` rule keeping 2-column grid
    - Add `@media (max-width: 767px)` rule collapsing to single column
    - _Requirements: 7.1, 7.5, 7.6_

- [x] 3. Widget, component, and utility styles
  - [x] 3.1 Write widget card, heading, and shared component styles
    - Style `.widget` card: background `var(--color-surface)`, border-radius `var(--radius-lg)`, padding `var(--space-lg)`
    - Style `.widget__heading`: `font-size: var(--font-size-heading)`, `font-weight: var(--font-weight-bold)`, color `var(--color-text-primary)`
    - Style `.btn` base, `.btn--primary`, `.btn--secondary`, `.btn--ghost` variants using design token colours; ensure text-on-button contrast meets WCAG AA (see contrast table in design)
    - Style `.input` text fields: border `var(--color-border)`, radius `var(--radius-sm)`, focus ring using `--color-accent`
    - Style `.error-message` in `var(--color-error)`, `font-size: var(--font-size-small)`; the `[hidden]` attribute hides the element
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 3.2 Write widget-specific styles (greeting, timer, todo, links)
    - Greeting: `.greeting__time` as large display text; `.greeting__date` in `var(--color-text-secondary)`
    - Timer: `.timer__display` in `var(--font-size-display)` (2.5rem), centered, monospace-friendly; `.timer__banner` as a highlighted status bar (hidden by default)
    - Todo: `.todo__list` as unstyled list; `.task--completed .task__text` with `text-decoration: line-through` and `opacity: 0.5`; inline edit input expands to fill available width
    - Links: `.links__list` as a flex-wrap list of buttons; link buttons use `.btn` styles; delete control is a small icon/text button adjacent to each link button
    - _Requirements: 3.9, 7.2_

- [x] 4. Utils module — pure formatting and validation functions
  - [x] 4.1 Implement time and date formatters in `js/app.js` under the `Utils` namespace
    - `Utils.formatTime(date)` — returns zero-padded `"HH:MM"` string from a `Date` object
    - `Utils.formatDate(date)` — returns `"[Full Weekday], [D] [Full Month] [YYYY]"` using `toLocaleDateString` or manual day/month arrays
    - `Utils.getGreeting(hour)` — maps integer 0–23 to `"Good morning"` (5–11), `"Good afternoon"` (12–17), or `"Good evening"` (0–4, 18–23)
    - `Utils.formatCountdown(seconds)` — converts integer 0–1500 to zero-padded `"MM:SS"` string
    - `Utils.generateId()` — returns a unique string prefixed with a widget letter (e.g., `"t_"` for tasks) combining `Date.now()` and a random suffix
    - Wrap all date operations in try/catch; on error return a sentinel value that callers can detect
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4_

  - [ ]* 4.2 Write property tests for Utils formatters (Properties 1–4)
    - **Property 1: Time format** — `fc.date()` → `Utils.formatTime` result matches `/^\d{2}:\d{2}$/`, hours 00–23, minutes 00–59
    - **Property 2: Date format** — `fc.date()` → `Utils.formatDate` result contains correct weekday, month name, and 4-digit year
    - **Property 3: Greeting mapping** — `fc.integer({ min: 0, max: 23 })` → `Utils.getGreeting` returns exactly one of the three strings, with correct hour-range boundaries
    - **Property 4: Countdown format** — `fc.integer({ min: 0, max: 1500 })` → `Utils.formatCountdown` result matches `/^\d{2}:\d{2}$/`, minutes = `Math.floor(s/60)`, seconds = `s % 60`
    - Place in `tests/unit/utils.test.js`; annotate each with `// Feature: todo-list-life-dashboard, Property N: ...`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4_

  - [x] 4.3 Implement input validators in `js/app.js` under the `Utils` namespace
    - `Utils.validateTaskText(text)` — returns `{ valid: false, error: "..." }` when text is empty or whitespace-only, or exceeds 500 chars; otherwise `{ valid: true }`
    - `Utils.validateLinkLabel(label)` — rejects empty, whitespace-only, or >50-char labels
    - `Utils.validateLinkUrl(url)` — rejects empty, >2048-char, or URLs not starting with `http://` or `https://`
    - _Requirements: 3.2, 3.3, 5.2, 5.3, 5.4_

  - [ ]* 4.4 Write property tests for validators (Properties 9, 18)
    - **Property 9: Whitespace/empty task rejection** — `fc.string().filter(s => s.trim().length === 0)` → `validateTaskText` returns `{ valid: false }`
    - **Property 18: Invalid link rejection** — arbitraries for empty labels, >50-char labels, empty URLs, >2048-char URLs, URLs without http/https prefix → `validateLinkLabel` / `validateLinkUrl` return `{ valid: false }`
    - Place in `tests/unit/utils.test.js`
    - _Requirements: 3.3, 5.3, 5.4_

- [x] 5. Storage module — localStorage persistence with corruption recovery
  - [x] 5.1 Implement `Storage` namespace in `js/app.js`
    - Define `Storage.TASKS_KEY = "todo-dashboard:tasks"` and `Storage.LINKS_KEY = "todo-dashboard:links"`
    - Implement `Storage.saveTasks(tasks)` — JSON-serialises the array and writes to `TASKS_KEY`; wraps in try/catch and returns `{ ok: false, error }` on failure
    - Implement `Storage.loadTasks()` — reads `TASKS_KEY`, parses JSON, validates that result is an array of objects each having `id` (string), `text` (string), `completed` (boolean), `createdAt` (number); on any failure calls `localStorage.removeItem(TASKS_KEY)` and returns `[]`
    - Implement `Storage.saveLinks(links)` and `Storage.loadLinks()` symmetrically for `Link` objects (`id`, `label`, `url`, `createdAt`)
    - Use the `safeLoad` pattern from the design's Error Handling section
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 5.2 Write property tests for Storage serialization round-trips (Properties 15, 16, 20, 21)
    - **Property 15: Task serialization round-trip** — `fc.array(taskArb)` → `saveTasks` then `loadTasks` returns structurally equivalent array
    - **Property 16: Corrupt task data yields empty array** — `fc.string()` written directly to `localStorage[TASKS_KEY]` → `loadTasks()` returns `[]` without throwing
    - **Property 20: Link serialization round-trip** — `fc.array(linkArb)` → `saveLinks` then `loadLinks` returns structurally equivalent array
    - **Property 21: Corrupt link data yields empty array** — `fc.string()` written directly to `localStorage[LINKS_KEY]` → `loadLinks()` returns `[]` without throwing
    - Mock `localStorage` with `jsdom` or a hand-rolled stub; define `taskArb` and `linkArb` arbitraries
    - Place in `tests/unit/todolist.test.js` (Properties 15–16) and `tests/unit/quicklinks.test.js` (Properties 20–21)
    - _Requirements: 4.1, 4.2, 4.6, 5.7, 6.1, 6.2, 6.5_

- [x] 6. Greeting Widget
  - [ ] 6.1 Implement `GreetingWidget` in `js/app.js`
    - `GreetingWidget.init()` — calls `update()` immediately, then sets a 60-second `setInterval` storing the handle in `greetingState.intervalId`
    - `GreetingWidget.update()` — creates a `new Date()`, calls `Utils.formatTime`, `Utils.formatDate`, `Utils.getGreeting(date.getHours())`; sets `#greeting-time` `textContent` and `datetime` attribute, `#greeting-date` `textContent`, `#greeting-text` `textContent`; hides `#greeting-error`
    - Wrap the entire `update()` body in try/catch; on error hide the time/date elements and show `#greeting-error` with `"Time and date are unavailable."`
    - `GreetingWidget.destroy()` — calls `clearInterval(greetingState.intervalId)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 7. Focus Timer
  - [x] 7.1 Implement timer state and core tick/reset logic in `js/app.js`
    - Define `timerState = { remaining: 1500, active: false, intervalId: null }`
    - `FocusTimer.tick()` — decrements `timerState.remaining` by 1; if result reaches 0, clamps to 0, calls `clearInterval`, sets `active = false`, and calls `render()` to show the session-end banner; otherwise calls `render()`
    - `FocusTimer.reset()` — calls `clearInterval(timerState.intervalId)`, sets `remaining = 1500`, `active = false`, `intervalId = null`, hides banner, calls `render()`
    - _Requirements: 2.1, 2.6, 2.7_

  - [ ]* 7.2 Write property tests for timer tick and reset (Properties 5, 6)
    - **Property 5: Timer decrement invariant** — `fc.integer({min:1,max:1500})` for R, `fc.integer({min:0,max:R})` for T → after T `tick()` calls remaining === R - T and never below 0
    - **Property 6: Reset idempotence** — `fc.record({ remaining: fc.integer(0,1500), active: fc.boolean() })` → after `reset()`, `remaining === 1500` and `active === false`; calling twice gives the same result
    - Place in `tests/unit/timer.test.js`
    - _Requirements: 2.2, 2.3, 2.6_

  - [x] 7.3 Implement timer start, stop, and render
    - `FocusTimer.start()` — if `active` is already true, no-op; otherwise sets `active = true`, starts `setInterval(FocusTimer.tick, 1000)`, calls `render()`
    - `FocusTimer.stop()` — if `active` is false, no-op; otherwise calls `clearInterval`, sets `active = false`, calls `render()`
    - `FocusTimer.render()` — sets `#timer-display` `textContent` to `Utils.formatCountdown(timerState.remaining)`; toggles `disabled` on `#timer-start` (disabled when `active`) and `#timer-stop` (disabled when `!active`); shows/hides `#timer-banner` when `remaining === 0`
    - `FocusTimer.init()` — attaches click listeners to `#timer-start`, `#timer-stop`, `#timer-reset`; calls `render()`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 2.9_

  - [ ]* 7.4 Write property test for timer button state invariant (Property 7)
    - **Property 7: Button state invariant** — `fc.boolean()` for `active` → after `render()`, `startBtn.disabled === active` and `stopBtn.disabled === !active`
    - Use jsdom to provide a minimal DOM for the render assertions
    - Place in `tests/unit/timer.test.js`
    - _Requirements: 2.8, 2.9_

- [~] 8. Todo List
  - [x] 8.1 Implement `TodoList` state and add/delete operations in `js/app.js`
    - Define `todoState = { tasks: [], editingId: null }`
    - `TodoList.addTask(text)` — calls `Utils.validateTaskText(text)`; on failure shows `#todo-input-error` and returns; on success creates a `Task` object (`id` via `Utils.generateId()`, `text: text.trim()`, `completed: false`, `createdAt: Date.now()`), pushes to `todoState.tasks`, calls `Storage.saveTasks()`; on storage error shows `#storage-error`; calls `render()`, clears `#todo-input`, hides error
    - `TodoList.deleteTask(id)` — filters `todoState.tasks` removing the task with matching `id`, calls `Storage.saveTasks()`, calls `render()`
    - `TodoList.toggleTask(id)` — finds task by `id`, flips `completed`, calls `Storage.saveTasks()`, calls `render()`
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 4.1, 4.5_

  - [ ]* 8.2 Write property tests for task add and delete (Properties 8, 9, 12)
    - **Property 8: Valid task add grows list by one** — `fc.array(taskArb)` for initial state, `fc.string(1,500).filter(s => s.trim().length > 0)` for text → after `addTask`, collection length is N+1, last task has trimmed text, `completed === false`
    - **Property 9: Whitespace task text rejected** — `fc.string().filter(s => s.trim().length === 0)` → `addTask` leaves collection unchanged
    - **Property 12: Delete removes exactly the target** — `fc.array(taskArb, {minLength:1})` → after `deleteTask(id)`, length is N-1, no task has the deleted id, all others unchanged
    - Place in `tests/unit/todolist.test.js`
    - _Requirements: 3.2, 3.3, 3.8_

  - [x] 8.3 Implement `TodoList` edit operations
    - `TodoList.beginEdit(id)` — if `todoState.editingId !== null`, no-op (single-edit guard); sets `todoState.editingId = id`, calls `render()`
    - `TodoList.cancelEdit()` — sets `todoState.editingId = null`, calls `render()`
    - `TodoList.editTask(id, newText)` — calls `Utils.validateTaskText(newText)`; on failure calls `cancelEdit()` (reverts to previous text); on success updates `task.text = newText.trim()`, sets `editingId = null`, calls `Storage.saveTasks()`, calls `render()`
    - _Requirements: 3.4, 3.5, 3.6, 3.10_

  - [ ]* 8.4 Write property tests for edit operations (Properties 10, 14)
    - **Property 10: Valid edit updates text; invalid edit reverts** — `taskArb` + valid `newText` → `editTask` sets text to `newText.trim()`; whitespace/empty `badText` → text unchanged
    - **Property 14: At most one task in editing state** — `fc.array(taskArb, {minLength:2})` → after `beginEdit(id1)`, calling `beginEdit(id2)` leaves `editingId === id1` (no-op), count of editing items always ≤ 1
    - Place in `tests/unit/todolist.test.js`
    - _Requirements: 3.4, 3.5, 3.6, 3.10_

  - [x] 8.5 Implement `TodoList.render()` and `init()`
    - `TodoList.render()` — clears `#todo-list`; sorts tasks by `createdAt` ascending; for each task creates an `<li>` with: a checkbox (or button) for toggle, a `<span class="task__text">` (adds `task--completed` class when `completed`), an edit button, a delete button; if `editingId === task.id` replaces the text span with an `<input>` pre-populated with `task.text` and confirm/cancel buttons; disables edit/complete/delete controls on all other tasks when `editingId !== null`
    - `TodoList.init()` — loads tasks from `Storage.loadTasks()` into `todoState.tasks`, attaches `submit` listener on `#todo-form`, calls `render()`
    - _Requirements: 3.1, 3.2, 3.4, 3.9, 3.10, 4.2, 4.3_

  - [-] 8.6 Write property test for insertion order (Property 13)
    - **Property 13: Tasks render in insertion order** — `fc.array(fc.string({minLength:1,maxLength:500}).filter(s => s.trim().length > 0))` → after sequential `addTask` calls, the rendered DOM order matches insertion order (ascending `createdAt`)
    - Use jsdom to verify DOM ordering
    - Place in `tests/unit/todolist.test.js`
    - _Requirements: 3.9_

  - [ ]* 8.7 Write property test for toggle round-trip (Property 11)
    - **Property 11: Toggle is its own inverse** — `taskArb` → two consecutive `toggleTask` calls restore original `completed` value
    - Place in `tests/unit/todolist.test.js`
    - _Requirements: 3.7_

- [~] 9. Checkpoint — run all unit tests so far
  - Ensure all tests pass, ask the user if questions arise.

- [~] 10. Quick Links
  - [ ] 10.1 Implement `QuickLinks` state and add/delete operations in `js/app.js`
    - Define `linksState = { links: [] }`
    - `QuickLinks.addLink(label, url)` — calls `Utils.validateLinkLabel(label)` and `Utils.validateLinkUrl(url)`; shows relevant inline error elements (`#link-label-error`, `#link-url-error`) for failures and returns; on success creates a `Link` object, pushes to `linksState.links`, calls `Storage.saveLinks()`; on storage error shows `#links-storage-error`; calls `render()`; clears inputs
    - `QuickLinks.deleteLink(id)` — filters `linksState.links`, calls `Storage.saveLinks()`, calls `render()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 6.1, 6.4_

  - [ ]* 10.2 Write property tests for link add and delete (Properties 17, 18, 19)
    - **Property 17: Valid link add grows collection by one** — `fc.array(linkArb)`, valid `labelArb` (1–50 non-whitespace chars), valid `urlArb` (http/https prefix, ≤2048 chars) → after `addLink`, collection length is N+1, new link has trimmed label and provided URL
    - **Property 18: Invalid link rejected** — arbitraries for each failure case → `addLink` leaves collection unchanged
    - **Property 19: Delete removes exactly the target link** — `fc.array(linkArb, {minLength:1})` → after `deleteLink(id)`, length is N-1, no link has the deleted id, all others unchanged
    - Place in `tests/unit/quicklinks.test.js`
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [~] 10.3 Implement `QuickLinks.render()` and `init()`
    - `QuickLinks.render()` — clears `#links-list`; for each link creates an `<li>` containing: a `<button>` with `textContent = link.label` that calls `window.open(link.url, '_blank', 'noopener')` on click, and a delete `<button>`; sorts by `createdAt` ascending
    - `QuickLinks.init()` — loads links from `Storage.loadLinks()` into `linksState.links`, attaches `submit` listener on `#links-form`, calls `render()`
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 6.2, 6.3_

- [ ] 11. App bootstrap — `DOMContentLoaded` wiring
  - Add a `DOMContentLoaded` listener at the bottom of `js/app.js` that calls `GreetingWidget.init()`, `FocusTimer.init()`, `TodoList.init()`, and `QuickLinks.init()` in sequence
  - Ensure all widget `init` calls are inside the listener so no DOM queries run before the page is ready
  - _Requirements: 1.6, 2.1, 4.2, 6.2, 8.2, 8.4_

- [ ] 12. Accessibility and cross-browser polish
  - [ ] 12.1 Audit and complete ARIA attributes and keyboard navigation
    - Verify `aria-live="polite"` is present on `#timer-display` and `#todo-list` as specified in the HTML skeleton
    - Ensure all interactive controls are reachable and operable via keyboard (Tab, Enter, Space); no focus traps outside the edit-input workflow
    - When `TodoList.beginEdit(id)` is called, programmatically move focus to the inline edit `<input>`; when `cancelEdit()` or `editTask()` resolves, return focus to the task's edit button
    - Confirm all `<button>` elements have accessible names (visible text or `aria-label`); confirm error paragraphs use `role="alert"` or `aria-live="assertive"` where appropriate for immediate announcement
    - _Requirements: 7.4, 8.3_

  - [ ] 12.2 Verify response time and no-console-error constraints
    - Open `index.html` in a browser and confirm all four widgets render immediately on load (no flicker of empty state)
    - Confirm no JavaScript errors appear in the console during a full interaction sequence (add task, edit task, toggle, delete; add link, delete link; start/stop/reset timer)
    - _Requirements: 8.2, 8.3, 8.4_

- [ ] 13. Final checkpoint — run full test suite
  - Run `npm test` (vitest --run); ensure all unit tests pass with 0 failures.
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all non-starred tasks are required
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations per property (`numRuns: 100`)
- Each property test file must annotate tests with `// Feature: todo-list-life-dashboard, Property N: <title>`
- The `taskArb` and `linkArb` arbitraries should be defined once in a shared test helper and imported into each unit test file
- The timer state (`timerState`) is intentionally not persisted — a page refresh resets it to 1500 seconds
- All `localStorage` operations must be wrapped in try/catch to satisfy Requirements 4.5 and 6.4
- The single-edit-at-a-time guard in `beginEdit` (Property 14) must be implemented before `render()` uses `editingId` to disable controls

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "3.2"] },
    { "id": 2, "tasks": ["4.1", "4.3"] },
    { "id": 3, "tasks": ["4.2", "4.4", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1", "7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 6, "tasks": ["7.4", "8.2", "8.3"] },
    { "id": 7, "tasks": ["8.4", "8.5", "10.1"] },
    { "id": 8, "tasks": ["8.6", "8.7", "10.2", "10.3"] },
    { "id": 9, "tasks": ["12.1", "12.2"] }
  ]
}
```

# Requirements Document

## Introduction

The Todo List Life Dashboard is a client-side, single-page web application built with HTML, CSS, and vanilla JavaScript. It serves as a personal productivity hub combining a real-time greeting, a focus timer, a task manager, and a quick-links launcher � all persisted in browser Local Storage with no backend server required. The application must work as a standalone web page or browser extension across modern browsers (Chrome, Firefox, Edge, Safari).

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current time, date, and a contextual greeting.
- **Focus_Timer**: The UI component that manages a 25-minute countdown timer.
- **Todo_List**: The UI component that manages the collection of user tasks.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links**: The UI component that manages user-defined shortcut buttons linking to external URLs.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Time_of_Day_Greeting**: A text greeting derived from the current hour (morning / afternoon / evening).
- **Active_Session**: The period during which the Focus_Timer is counting down.
- **Completed_Task**: A Task whose completion state is marked as done.

---

## Requirements

### Requirement 1: Real-Time Greeting Display

**User Story:** As a user, I want to see the current time, date, and a personalised greeting when I open the Dashboard, so that I am immediately oriented and welcomed.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updating every 60 seconds.
2. THE Greeting_Widget SHALL display the current date in a human-readable format matching the pattern "[Full Weekday Name], [Day] [Full Month Name] [4-digit Year]" (e.g., "Monday, 14 July 2025").
3. WHEN the current hour is between 05:00 and 11:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good morning".
4. WHEN the current hour is between 12:00 and 17:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good afternoon".
5. WHEN the current hour is between 18:00 and 23:59 inclusive, OR the current hour is between 00:00 and 04:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good evening".
6. WHEN the Dashboard page is loaded, THE Greeting_Widget SHALL render the correct time, date, and greeting within 500 milliseconds.
7. IF the Greeting_Widget fails to retrieve the current time or date from the system clock, THEN THE Greeting_Widget SHALL display an error message indicating that the time and date are unavailable.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can follow a focused work session structure.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes (1500 seconds).
2. WHILE no Active_Session is in progress and the remaining countdown value equals 1500 seconds, WHEN the user activates the Start control, THE Focus_Timer SHALL begin decrementing the countdown from 1500 seconds by one second per real-world second.
3. WHILE no Active_Session is in progress and the remaining countdown value is less than 1500 seconds, WHEN the user activates the Start control, THE Focus_Timer SHALL resume decrementing the countdown from the current remaining value by one second per real-world second.
4. WHILE an Active_Session is in progress, THE Focus_Timer SHALL display the remaining time in MM:SS format.
5. WHILE an Active_Session is in progress, WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown at the current remaining value.
6. WHEN the user activates the Reset control, THE Focus_Timer SHALL restore the countdown value to 1500 seconds and terminate any Active_Session.
7. WHEN the countdown reaches 0 seconds, THE Focus_Timer SHALL terminate the Active_Session, stop decrementing, and display a non-interactive banner message indicating the session has ended until the user activates the Reset control.
8. WHILE an Active_Session is in progress, THE Focus_Timer SHALL disable the Start control and enable the Stop control.
9. WHILE no Active_Session is in progress, THE Focus_Timer SHALL enable the Start control and disable the Stop control.

---

### Requirement 3: To-Do List — Task Management

**User Story:** As a user, I want to add, edit, complete, and delete tasks in a to-do list, so that I can track and manage my personal tasks throughout the day.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field accepting up to 500 characters and a submit control for adding a new Task.
2. WHEN the user submits a new Task with a non-empty, non-whitespace-only text description of 1 to 500 characters, THE Todo_List SHALL append the Task to the task collection and clear the input field.
3. IF the user submits a new Task with an empty or whitespace-only text description, THEN THE Todo_List SHALL reject the submission, display an error message indicating the task text is required, and retain focus on the input field.
4. WHEN the user activates the edit control on a Task, THE Todo_List SHALL replace the Task's display text with an editable input field pre-populated with the Task's current text.
5. WHEN the user confirms an edit with a non-empty, non-whitespace-only text description of 1 to 500 characters, THE Todo_List SHALL update the Task's text to the trimmed new value and restore the Task to its non-editable display state.
6. IF the user confirms an edit with an empty or whitespace-only text description, THEN THE Todo_List SHALL discard the edit, restore the Task's previous text, and return the Task to its non-editable display state.
7. WHEN the user activates the complete control on a Task, THE Todo_List SHALL toggle the Task's completion state between complete and incomplete.
8. WHEN the user activates the delete control on a Task, THE Todo_List SHALL permanently remove the Task from the task collection with no confirmation prompt.
9. THE Todo_List SHALL display all Tasks in the order they were added, with Completed_Tasks rendered with a strikethrough style on the task text and at a reduced opacity of 50% compared to incomplete Tasks.
10. WHILE a Task is in the editable state, THE Todo_List SHALL prevent activating the edit, complete, or delete controls on any other Task.

---

### Requirement 4: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that my task list is preserved across browser sessions.

#### Acceptance Criteria

1. WHEN the task collection changes (task added, edited, completed, or deleted), THE Todo_List SHALL serialize the current task collection as JSON and write it to Local_Storage.
2. WHEN the Dashboard page is loaded, THE Todo_List SHALL read the task collection from Local_Storage, deserialize the JSON value, and render each Task in the restored collection.
3. IF no task data exists in Local_Storage on page load, THEN THE Todo_List SHALL render an empty task collection with no error message displayed to the user.
4. THE Local_Storage key used to store tasks SHALL follow the format `<app-name>:tasks`, where `<app-name>` is a fixed identifier unique to this application, ensuring no collision with keys written by other applications on the same origin.
5. IF Local_Storage is unavailable or the write operation fails (e.g., storage quota exceeded), THEN THE Todo_List SHALL retain the current task collection in memory and display an error message indicating that changes could not be saved.
6. IF the value read from Local_Storage on page load cannot be deserialized as a valid task collection, THEN THE Todo_List SHALL discard the stored value, clear the corresponding Local_Storage key, and render an empty task collection with no error message displayed to the user.

---

### Requirement 5: Quick Links — Link Management

**User Story:** As a user, I want to add, open, and delete quick-link buttons for my favourite websites, so that I can navigate to them with a single click.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide an input field accepting a link label of 1–50 characters, an input field accepting a URL of 1–2048 characters, and a submit control for adding a new Link.
2. WHEN the user submits a new Link with a label of 1–50 non-whitespace characters and a URL beginning with "http://" or "https://", THE Quick_Links SHALL add the Link to the link collection and render a clickable button labelled with the link label.
3. IF the user submits a new Link with an empty label, a label exceeding 50 characters, an empty URL, or a URL exceeding 2048 characters, THEN THE Quick_Links SHALL reject the submission, retain the entered values in the input fields, and display an inline validation message identifying which field failed validation.
4. IF the user submits a new Link with a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL reject the submission, retain the entered values in the input fields, and display an inline validation message indicating the URL format requirement.
5. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab without navigating away from the current page.
6. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL permanently remove the Link from the link collection and remove the corresponding button from the rendered list within 300 milliseconds.
7. THE Quick_Links SHALL persist the link collection across page reloads such that all Links present before a reload are present and functional after the reload.

---

### Requirement 6: Quick Links — Persistence

**User Story:** As a user, I want my quick links to be saved automatically, so that my link shortcuts are preserved across browser sessions.

#### Acceptance Criteria

1. WHEN the link collection changes (link added or deleted), THE Quick_Links SHALL write the current link collection to Local_Storage within 500 milliseconds of the change.
2. WHEN the Dashboard page is loaded, THE Quick_Links SHALL read the link collection from Local_Storage and render all previously saved Link buttons within 1 second of page load initiation.
3. IF no link data exists in Local_Storage on page load, THEN THE Quick_Links SHALL render an empty link collection without displaying an error message to the user.
4. IF Local_Storage is unavailable or the write operation fails, THEN THE Quick_Links SHALL display an error message indicating that links cannot be saved, and the in-memory link collection SHALL remain unchanged.
5. IF the data read from Local_Storage on page load is not valid link collection data, THEN THE Quick_Links SHALL discard the corrupted data, render an empty link collection, and display an error message indicating that saved links could not be loaded.
6. THE Local_Storage key used to store links SHALL be unique to the Dashboard to avoid conflicts with other applications sharing the same origin.

---

### Requirement 7: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and visually organised interface, so that I can use the Dashboard comfortably without distraction.

#### Acceptance Criteria

1. THE Dashboard SHALL organise all four widgets (Greeting_Widget, Focus_Timer, Todo_List, Quick_Links) within a single page without requiring vertical scrolling on a 1280×720 viewport or larger.
2. THE Dashboard SHALL apply a clear visual hierarchy by rendering each widget with a visible heading or label that is distinct from the widget's body content.
3. THE Dashboard SHALL use a font size no smaller than 14px for body text and no smaller than 18px for widget headings or labels.
4. THE Dashboard SHALL apply colour contrast between text and background colours meeting the WCAG 2.1 AA minimum ratio of 4.5:1 for normal text (below 18px or below 14px bold) and 3:1 for large text (18px or above, or 14px bold or above).
5. WHEN the viewport width is below 768px, THE Dashboard SHALL reflow the layout to a single-column arrangement so that all widgets remain usable on small screens.
6. WHEN the viewport width is between 768px and 1279px inclusive, THE Dashboard SHALL arrange the widgets in a two-column grid so that all four widgets are visible without vertical scrolling on a 768×1024 viewport.

---

### Requirement 8: Code Structure and Performance

**User Story:** As a developer, I want the codebase to follow the defined folder and file conventions, so that the project remains maintainable and consistent.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly one HTML file, exactly one CSS file located inside the `css/` directory, and exactly one JavaScript file located inside the `js/` directory.
2. THE Dashboard SHALL load and visually paint all widgets within 2 seconds, measured from navigation start to the point where all widget containers display their content, with no external network requests at runtime, tested under a simulated connection of at least 25 Mbps download speed and at most 50 ms round-trip latency.
3. WHILE the user performs any sequence of supported interactions (page load, button clicks, and input submissions), THE Dashboard SHALL produce no JavaScript errors or uncaught exceptions in the browser console on the current stable release of Chrome, Firefox, Edge, and Safari.
4. WHEN the user interacts with any control (button click, input submission), THE Dashboard SHALL produce a visible change in the UI reflecting the new state within 100 milliseconds of the interaction event.
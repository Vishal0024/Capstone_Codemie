@EPMCDMETST-67543
Feature: Show created and edited dates on todo cards
  As a Pro To-Do user
  I want to see when each task was created and last edited directly on its task card
  So that I can tell how old a task is and whether it changed recently without opening it

  Story: https://jiraeu.epam.com/browse/EPMCDMETST-67543
  Every scenario title is identical to a Playwright test title in tests/e2e/EPMCDMETST-67543.spec.js.
  Scenarios marked "fixture" stub GET /todos with page.route (design-review D-3); all others use the real server.

  # The two sign-up / log-in regression scenarios perform these steps themselves as their subject.
  Background:
    Given a new user has signed up with a unique timestamped e-mail address
    And the user has logged in

  # ---------------------------------------------------------------- AC-001
  @AC-001
  Scenario: New task shows Created with today's date
    When the user creates a task "Buy milk" with description "2 litres"
    Then the card "Buy milk" shows "Created " followed by today's date in DD Mon YYYY format
    And the Created text has no colon

  @AC-001 @AC-003
  Scenario: Welcome task of a new user shows Created and no Edited label
    Then the card "Welcome to your To-Do List!" shows "Created " followed by today's date
    And the card "Welcome to your To-Do List!" has no "todo-edited" element

  # ---------------------------------------------------------------- AC-002
  @AC-002
  Scenario: Dates use the DD Mon YYYY format
    Given (fixture) GET /todos returns a task created "2026-01-09T12:00:00.000Z" and updated "2026-12-31T12:00:00.000Z"
    When the task list is rendered
    Then the card shows "Created 09 Jan 2026"
    And the card shows "Edited 31 Dec 2026"
    And both texts match the pattern "<Label> DD Mon YYYY" with an English 3-letter month
    And no time of day is shown

  @AC-002
  Scenario: Dates are shown in the user's local time zone
    Given (fixture) GET /todos returns a task created "2026-10-05T12:00:00.000Z" and updated "2026-10-06T12:00:00.000Z"
    When the list is rendered in a browser with time zone "Pacific/Kiritimati" (UTC+14)
    Then the card shows "Created 06 Oct 2026" and "Edited 07 Oct 2026"
    Given (fixture) GET /todos returns a task created "2026-10-05T03:00:00.000Z" and updated "2026-10-06T03:00:00.000Z"
    When the list is rendered in a browser with time zone "America/Los_Angeles" (UTC-7)
    Then the card shows "Created 04 Oct 2026" and "Edited 05 Oct 2026"

  # ---------------------------------------------------------------- AC-003
  @AC-003 @AC-005
  Scenario: Edited label appears after a task is edited
    Given the user has created a task "Draft report"
    And the card "Draft report" has no "todo-edited" element
    When the user waits more than 1000 ms
    And the user edits the task title to "Final report" and saves
    Then the card "Final report" shows "Created " followed by today's date
    And the card "Final report" shows " · " followed by "Edited " and today's date
    And the page was not reloaded

  @AC-003
  Scenario: Edited label is hidden when last-updated is within 1000 ms of creation
    Given (fixture) GET /todos returns tasks updated 0 ms, 1 ms, 500 ms and exactly 1000 ms after creation
    When the task list is rendered
    Then none of these cards has a "todo-edited" element or a separator

  @AC-003
  Scenario: Edited label is shown when last-updated is more than 1000 ms after creation
    Given (fixture) GET /todos returns tasks updated 1001 ms, 1500 ms and 1 day after creation
    When the task list is rendered
    Then each card shows "Edited " followed by its last-updated date in DD Mon YYYY format

  @AC-003
  Scenario: Edited label is hidden when last-updated is before creation
    Given (fixture) GET /todos returns a task whose last-updated date is 1 day before its creation date
    When the task list is rendered
    Then the card shows "Created " with its creation date
    And the card has no "todo-edited" element

  @AC-003
  Scenario: Toggling a task to Completed counts as an edit
    Given the user has created a task "Pay rent"
    When the user waits more than 1000 ms
    And the user clicks "Mark Complete" on the card "Pay rent"
    Then the card "Pay rent" shows "Edited " followed by today's date
    # Known limitation KL-2: the frontend cannot tell a status toggle from a content edit.

  # ---------------------------------------------------------------- AC-004
  @AC-004
  Scenario: Missing or invalid creation date shows the Not available fallback
    Given (fixture) GET /todos returns tasks whose createdAt is missing, null, "", "   ", "not-a-date" and true, each with a valid updatedAt
    When the task list is rendered
    Then every one of these cards shows exactly "Created: Not available"
    And none of these cards has a "todo-edited" element

  @AC-004
  Scenario: Missing or invalid last-updated date shows no Edited label
    Given (fixture) GET /todos returns tasks with a valid createdAt and an updatedAt that is missing, null, "", "not-a-date" and true
    When the task list is rendered
    Then every card shows "Created " followed by its formatted creation date
    And none of these cards has a "todo-edited" element

  @AC-004
  Scenario: Numeric timestamps are formatted as dates
    Given (fixture) GET /todos returns a task whose createdAt and updatedAt are numeric millisecond timestamps 2 days apart
    When the task list is rendered
    Then the card shows "Created " and "Edited " followed by the dates in DD Mon YYYY format

  @AC-004
  Scenario: Invalid dates never break the list or show raw error text
    Given (fixture) GET /todos returns a valid task, a task without any dates and a task whose createdAt is an HTML string
    When the task list is rendered
    Then all three cards are rendered
    And no page error is raised
    And no card text contains "Invalid Date", "NaN" or "undefined"
    And the HTML string is not rendered as markup

  # ---------------------------------------------------------------- AC-005
  @AC-005
  Scenario: Created date appears immediately after creating a task without a page reload
    When the user creates a task "Call plumber"
    Then the card "Call plumber" shows "Created " followed by today's date right after saving
    And the page was not reloaded

  # ---------------------------------------------------------------- AC-006
  @AC-006
  Scenario: Created and Edited are on one line with a middle-dot separator on desktop
    Given (fixture) GET /todos returns a task edited 1 day after creation
    When the task list is rendered at a desktop viewport of 1280x800
    Then the Created and Edited texts are on the same line
    And the separator " · " is visible between them
    And a desktop screenshot is captured

  @AC-006
  Scenario: Dates stack and stay fully visible at mobile width 375px
    Given (fixture) GET /todos returns a task edited 1 day after creation
    When the task list is rendered at a viewport of 375x667
    Then the Edited text is on a line below the Created text
    And the separator is hidden
    And the date container has no horizontal overflow
    And the date font size is at least 0.8em of the card font size
    And a mobile screenshot is captured

  @AC-006
  Scenario: Dates switch to the stacked layout at the 480px breakpoint
    Given (fixture) GET /todos returns a task edited 1 day after creation
    When the viewport width is 481px
    Then the Created and Edited texts are on the same line
    When the viewport width is 480px
    Then the Edited text is on a line below the Created text

  @AC-006
  Scenario: Date text keeps the card metadata style and readable contrast
    Given (fixture) GET /todos returns a task edited 1 day after creation
    When the task list is rendered
    Then the date container has class "todo-timestamp"
    And its computed colour is rgb(107, 114, 128)
    And its contrast ratio against white is at least 4.5:1
    And its font size is 0.85em of the card font size

  # ---------------------------------------------------------------- AC-007
  @AC-007
  Scenario: Regression: user can sign up
    Given a visitor opens the app
    When the visitor signs up with a name, a unique e-mail and a password
    Then the message "Signup successful! Please login." is shown
    And the login form is displayed

  @AC-007
  Scenario: Regression: user can log in
    Given a visitor has signed up
    When the visitor logs in with the same e-mail and password
    Then the header shows the user's name and e-mail
    And the welcome task card is shown

  @AC-007
  Scenario: Regression: user can create a task
    When the user creates a task "Water plants" with description "Balcony"
    Then a card "Water plants" with description "Balcony" and status "Active" is shown

  @AC-007
  Scenario: Regression: user can edit a task
    Given the user has created a task "Old title"
    When the user changes the title to "New title" and the description to "New desc" and saves
    Then a card "New title" with description "New desc" is shown
    And no card "Old title" is shown

  @AC-007
  Scenario: Regression: user can mark a task complete
    Given the user has created a task "Finish book"
    When the user clicks "Mark Complete" on the card "Finish book"
    Then the card "Finish book" shows status "Completed" and the button "Mark Active"

  @AC-007
  Scenario: Regression: user can filter tasks by status
    Given the user has an active task "Active one" and a completed task "Done one"
    When the user selects the filter "Completed"
    Then only the card "Done one" is shown
    When the user selects the filter "Active"
    Then the card "Active one" is shown and the card "Done one" is not shown

  @AC-007
  Scenario: Regression: user can sort tasks by title
    Given the user has created tasks "Bravo task" and then "Alpha task"
    When the user selects "Sort by Title"
    Then the cards are ordered "Alpha task", "Bravo task", "Welcome to your To-Do List!"

  @AC-007
  Scenario: Regression: user can search tasks
    Given the user has created tasks "Groceries list" and "Gym session"
    When the user types "groceries" into the search box
    Then only the card "Groceries list" is shown

  @AC-007
  Scenario: Regression: user can delete a task
    Given the user has created a task "Temporary task"
    When the user clicks "Delete" on the card "Temporary task" and accepts the confirmation
    Then no card "Temporary task" is shown

  # ---------------------------------------------------------------- AC-008
  @AC-008
  Scenario: Card date markup exposes test ids and no legacy Updated text
    Given (fixture) GET /todos returns one edited task and one never-edited task
    When the task list is rendered
    Then each card contains exactly one "todo-dates" element with exactly one "todo-created" element
    And only the edited card contains a "todo-edited" element and a separator
    And no card text contains "Updated:"

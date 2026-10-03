Feature: Due dates for todos (EPMCDMETST-67513)
  As a Pro To-Do user
  I want to give my todos an optional due date, sort by it and see what is overdue
  So that I can prioritise my work

  Background:
    Given a freshly signed-up user is logged in

  @EPMCDMETST-67514 @EPMCDMETST-67515
  Scenario: TC-001 Create a todo with a date-only due date
    When I POST /todos with dueDate "2099-01-02"
    Then the response status is 201
    And dueDate is "2099-01-02T00:00:00.000Z"
    And GET /todos returns that todo with the same dueDate

  @EPMCDMETST-67514 @EPMCDMETST-67515
  Scenario: TC-002 Create a todo without a due date
    When I POST /todos without a dueDate field
    Then the response status is 201 and dueDate is null

  @EPMCDMETST-67515
  Scenario Outline: TC-003 Reject invalid due dates
    When I POST /todos with dueDate <value>
    Then the response status is 400 with error "Invalid dueDate"

    Examples:
      | value        |
      | "not-a-date" |
      | "2026-13-01" |
      | "2026-02-31" |
      | 12345        |
      | true         |

  @EPMCDMETST-67515
  Scenario: TC-003b Normalise a full timestamp to ISO UTC
    When I POST /todos with dueDate "2099-03-15T10:30:00+02:00"
    Then dueDate is "2099-03-15T08:30:00.000Z"

  @EPMCDMETST-67515
  Scenario: TC-004 Set a due date on update
    Given a todo without a due date
    When I PUT it with dueDate "2099-05-10"
    Then GET /todos/:id returns dueDate "2099-05-10T00:00:00.000Z"

  @EPMCDMETST-67515
  Scenario: TC-005 Keep or clear the due date on update
    Given a todo with dueDate "2099-05-11"
    When I PUT it without a dueDate key
    Then dueDate is unchanged
    When I PUT it with dueDate null
    Then dueDate is null
    When I PUT it with dueDate ""
    Then dueDate is null

  @EPMCDMETST-67515
  Scenario: TC-005b Invalid due date on update leaves the stored value unchanged
    Given a todo with dueDate "2099-05-11"
    When I PUT it with dueDate "2026-02-31"
    Then the response status is 400 with error "Invalid dueDate"
    And dueDate is still "2099-05-11T00:00:00.000Z"

  @EPMCDMETST-67515
  Scenario: TC-005c Required fields on update
    When I PUT a todo with an empty title or a missing description
    Then the response status is 400 with error "Invalid input"

  @EPMCDMETST-67516
  Scenario: TC-006 Sort by due date
    Given todos B (2099-01-01), A (2099-01-02), A2 (2099-01-02) and C (no due date)
    When I GET /todos?sort=dueDate
    Then the order starts B, A, A2
    And every undated todo comes after every dated one

  @EPMCDMETST-67516
  Scenario: TC-007 Filter overdue todos
    Given an incomplete todo due 2020-01-01, an incomplete todo due 2099-01-01, a completed todo due 2020-01-01 and an undated todo
    When I GET /todos?filter=overdue
    Then only the incomplete todo due 2020-01-01 is returned

  @EPMCDMETST-67514
  Scenario: TC-008 Legacy record without a dueDate key
    Given a stored todo with no dueDate property
    Then GET /todos and GET /todos/:id return it with dueDate null

  @EPMCDMETST-67517
  Scenario: TC-009 UI create with a due date
    When I sign up, log in and create "X" from the add modal with due date 2099-01-02
    Then its card shows "Due: 1/2/2099"
    And the card is not marked overdue

  @EPMCDMETST-67517
  Scenario: TC-010 UI edit pre-fills and changes the due date
    Given a todo due 2099-01-02
    When I open Edit
    Then the due date field shows "2099-01-02"
    When I change it to 2099-01-03 and save
    Then the card shows "Due: 1/3/2099"

  @EPMCDMETST-67517
  Scenario: TC-011 UI clear the due date
    Given a todo with a due date
    When I clear the due date in Edit and save
    Then the card has no due line and the API returns dueDate null

  @EPMCDMETST-67518
  Scenario: TC-012 UI overdue highlight and filter
    Given todos that are overdue, due in the future, and completed but past due
    Then only the overdue card has the class "overdue" and an "OVERDUE" badge
    When I choose "Overdue" in the filter
    Then only the overdue todo is listed

  @EPMCDMETST-67518
  Scenario: TC-013 UI sort by due date
    When I choose "Sort by Due date"
    Then the cards are listed with the earliest due date first and undated todos last

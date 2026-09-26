const { test, expect } = require('@playwright/test');

// Run all tests serially in one worker so apiToken is shared
test.describe.configure({ mode: 'serial' });

const TEST_EMAIL = `e2e-summary-${Date.now()}@example.com`;
const TEST_PASSWORD = 'e2etest123';
const TEST_NAME = 'E2E Summary Tester';

let apiToken = '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function deleteAllTodos(request) {
  const res = await request.get('/todos', { headers: { Authorization: apiToken } });
  if (!res.ok()) return;
  const todos = await res.json();
  if (!Array.isArray(todos)) return;
  for (const t of todos) {
    await request.delete(`/todos/${t.id}`, { headers: { Authorization: apiToken } });
  }
}

async function apiCreate(request, title, description = 'test description') {
  const res = await request.post('/todos', {
    headers: { Authorization: apiToken },
    data: { title, description, completed: false },
  });
  return res.json();
}

async function apiToggle(request, id) {
  await request.fetch(`/todos/${id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: apiToken },
  });
}

async function injectTokenAndLoad(page) {
  await page.evaluate((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('name', data.name);
    localStorage.setItem('email', data.email);
  }, { token: apiToken, name: TEST_NAME, email: TEST_EMAIL });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.locator('#summary-label').waitFor({ state: 'visible', timeout: 10000 });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

test.beforeAll(async ({ request }) => {
  await request.post('/signup', {
    data: { name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  const loginRes = await request.post('/login', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  const data = await loginRes.json();
  apiToken = data.token;
});

test.beforeEach(async ({ page, request }) => {
  await deleteAllTodos(request);
  await page.goto('/');
});

// ─── Tests ────────────────────────────────────────────────────────────────────

test('TC-01: summary-label visible after login, contains "of" and "tasks completed"', async ({ page, request }) => {
  await apiCreate(request, 'First Task');
  await apiCreate(request, 'Second Task');
  await injectTokenAndLoad(page);

  await expect(page.locator('#summary-label')).toBeVisible();
  const text = await page.locator('#summary-label').textContent();
  expect(text).toContain('of');
  expect(text).toContain('tasks completed');
});

test('TC-02: singular "task" label when total=1', async ({ page, request }) => {
  await apiCreate(request, 'Only Task');
  await injectTokenAndLoad(page);

  const text = await page.locator('#summary-label').textContent();
  expect(text).toMatch(/0 of 1 task completed/);
  expect(text).not.toMatch(/tasks/);
});

test('TC-03: "0 of 0 tasks completed" when no todos exist', async ({ page }) => {
  await injectTokenAndLoad(page);

  await expect(page.locator('#summary-label')).toHaveText('0 of 0 tasks completed');
});

test('TC-04: toggle complete updates summary-label count', async ({ page, request }) => {
  await apiCreate(request, 'Toggleable Task');
  await injectTokenAndLoad(page);

  await expect(page.locator('#summary-label')).toContainText('0 of 1');

  await page.locator('.todo-btn.toggle').first().click();

  await expect(page.locator('#summary-label')).toContainText('1 of 1', { timeout: 5000 });
});

test('TC-05: all todos complete → #progress-fill has class "all-done"', async ({ page, request }) => {
  await apiCreate(request, 'Task to Complete');
  await injectTokenAndLoad(page);

  await page.locator('.todo-btn.toggle').first().click();

  await expect(page.locator('#progress-fill')).toHaveClass(/all-done/, { timeout: 5000 });
});

test('TC-06: active filter → summary-label reflects active-only count', async ({ page, request }) => {
  await apiCreate(request, 'Active Task');
  const done = await apiCreate(request, 'Done Task');
  await apiToggle(request, done.id);
  await injectTokenAndLoad(page);

  await page.selectOption('#filter-select', 'active');

  await expect(page.locator('#summary-label')).toContainText('of 1', { timeout: 5000 });
  const text = await page.locator('#summary-label').textContent();
  // active tasks have 0 completed
  expect(text).toContain('0 of 1');
});

test('TC-07: completed filter → summary-label reflects completed-only count', async ({ page, request }) => {
  await apiCreate(request, 'Active Task');
  const done = await apiCreate(request, 'Done Task');
  await apiToggle(request, done.id);
  await injectTokenAndLoad(page);

  await page.selectOption('#filter-select', 'completed');

  await expect(page.locator('#summary-label')).toContainText('1 of 1', { timeout: 5000 });
});

test('TC-08: search term → summary-label updates to match search results', async ({ page, request }) => {
  await apiCreate(request, 'Buy apples', 'fruit task');
  await apiCreate(request, 'Do laundry', 'chores task');
  await injectTokenAndLoad(page);

  await expect(page.locator('#summary-label')).toContainText('of 2');

  await page.fill('#search-input', 'apples');

  await expect(page.locator('#summary-label')).toContainText('of 1', { timeout: 5000 });
});

test('TC-09: 375x667 viewport → .summary-bar visible and not overflowing', async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await apiCreate(request, 'Responsive Task');
  await injectTokenAndLoad(page);

  await expect(page.locator('.summary-bar')).toBeVisible();
  const box = await page.locator('.summary-bar').boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375 + 1);
});

test('TC-10: #progress-fill aria-valuenow is a number between 0 and 100', async ({ page, request }) => {
  await apiCreate(request, 'Task A');
  await apiCreate(request, 'Task B');
  await injectTokenAndLoad(page);

  const ariaValue = await page.locator('#progress-fill').getAttribute('aria-valuenow');
  expect(ariaValue).not.toBeNull();
  const num = Number(ariaValue);
  expect(Number.isFinite(num)).toBe(true);
  expect(num).toBeGreaterThanOrEqual(0);
  expect(num).toBeLessThanOrEqual(100);
});

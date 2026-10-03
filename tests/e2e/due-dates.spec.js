// E2E tests for EPMCDMETST-67513 (Due Dates).
const { test, expect } = require('@playwright/test');

const PASSWORD = 'Passw0rd!';
const uid = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
const uniqueEmail = () => `qa.e2e.${uid()}@example.test`;

async function apiUser(request) {
  const email = uniqueEmail();
  expect((await request.post('/signup', { data: { name: 'QA E2E', email, password: PASSWORD } })).status()).toBe(201);
  const { token } = await (await request.post('/login', { data: { email, password: PASSWORD } })).json();
  return { email, token };
}

async function seed(request, token, todo) {
  const r = await request.post('/todos', {
    headers: { Authorization: token },
    data: { description: 'seeded', completed: false, ...todo },
  });
  expect(r.status()).toBe(201);
  return r.json();
}

async function openAs(page, { token, email }) {
  await page.addInitScript(([t, e]) => {
    localStorage.setItem('token', t);
    localStorage.setItem('name', 'QA E2E');
    localStorage.setItem('email', e);
  }, [token, email]);
  await page.goto('/');
}

const card = (page, title) =>
  page.locator('.outputData .output').filter({ has: page.locator('#title', { hasText: title }) });

test('TC-009 [EPMCDMETST-67517] UI signup/login, create with due date, shows Due line', async ({ page }) => {
  const email = uniqueEmail();
  const title = `Due-${uid()}`;
  await page.goto('/');
  await expect(page.locator('#auth-modal')).toBeVisible();
  if ((await page.locator('#auth-submit-btn').innerText()).trim() !== 'Sign Up') await page.click('#auth-toggle-link');
  await page.fill('#auth-name', 'QA E2E');
  await page.fill('#auth-email', email);
  await page.fill('#auth-password', PASSWORD);
  await page.click('#auth-submit-btn');
  await expect(page.locator('#auth-submit-btn')).toHaveText('Login'); // signup returns to the login form
  await page.fill('#auth-email', email);
  await page.fill('#auth-password', PASSWORD);
  await page.click('#auth-submit-btn');
  await expect(page.locator('#auth-modal')).toBeHidden();

  await page.click('#add-todo-btn');
  await page.fill('#edit-title', title);
  await page.fill('#edit-desc', 'created in e2e');
  await page.fill('#edit-dueDate', '2099-01-02');
  await page.click('#save-edit-btn');
  await expect(page.locator('#edit-modal')).toBeHidden();
  await expect(card(page, title).locator('.todo-dueDate')).toHaveText('Due: 1/2/2099');
  await expect(card(page, title)).not.toHaveClass(/\boverdue\b/);
});

test('TC-010 [EPMCDMETST-67517] edit pre-fills YYYY-MM-DD and updates due date', async ({ page, request }) => {
  const u = await apiUser(request);
  const title = `Edit-${uid()}`;
  await seed(request, u.token, { title, dueDate: '2099-01-02' });
  await openAs(page, u);
  await card(page, title).locator('.todo-btn.edit').click();
  await expect(page.locator('#edit-dueDate')).toHaveValue('2099-01-02');
  await page.fill('#edit-dueDate', '2099-01-03');
  await page.click('#save-edit-btn');
  await expect(card(page, title).locator('.todo-dueDate')).toHaveText('Due: 1/3/2099');
});

test('TC-011 [EPMCDMETST-67517] clearing due date removes the Due line', async ({ page, request }) => {
  const u = await apiUser(request);
  const title = `Clear-${uid()}`;
  const todo = await seed(request, u.token, { title, dueDate: '2099-01-02' });
  await openAs(page, u);
  await card(page, title).locator('.todo-btn.edit').click();
  await expect(page.locator('#edit-dueDate')).toHaveValue('2099-01-02');
  await page.fill('#edit-dueDate', '');
  await page.click('#save-edit-btn');
  await expect(page.locator('#edit-modal')).toBeHidden();
  await expect(card(page, title)).toBeVisible();
  await expect(card(page, title).locator('.todo-dueDate')).toHaveCount(0);
  const got = await (await request.get(`/todos/${todo.id}`, { headers: { Authorization: u.token } })).json();
  expect(got.dueDate).toBeNull();
});

test('TC-012 [EPMCDMETST-67518] overdue highlight + Overdue filter', async ({ page, request }) => {
  const u = await apiUser(request);
  const s = uid();
  const past = `Past-${s}`, future = `Future-${s}`, done = `Done-${s}`;
  await seed(request, u.token, { title: past, dueDate: '2020-01-01' });
  await seed(request, u.token, { title: future, dueDate: '2099-01-01' });
  await seed(request, u.token, { title: done, dueDate: '2020-01-01', completed: true });
  await openAs(page, u);
  await expect(card(page, past)).toHaveClass(/\boverdue\b/);
  await expect(card(page, past).locator('.overdue-badge')).toHaveText('OVERDUE');
  await expect(card(page, future)).not.toHaveClass(/\boverdue\b/);
  await expect(card(page, future).locator('.overdue-badge')).toHaveCount(0);
  await expect(card(page, done).locator('.overdue-badge')).toHaveCount(0);
  await page.selectOption('#filter-select', 'overdue');
  await expect(page.locator('.outputData .output')).toHaveCount(1);
  await expect(card(page, past)).toBeVisible();
});

test('TC-013 [EPMCDMETST-67518] Sort by Due date: earliest first, undated last', async ({ page, request }) => {
  const u = await apiUser(request);
  const s = uid();
  const B = `B-${s}`, A = `A-${s}`, C = `C-${s}`;
  await seed(request, u.token, { title: C });
  await seed(request, u.token, { title: A, dueDate: '2099-01-02' });
  await seed(request, u.token, { title: B, dueDate: '2099-01-01' });
  await openAs(page, u);
  await expect(page.locator('#sort-select option[value="dueDate"]')).toHaveText('Sort by Due date');
  await page.selectOption('#sort-select', 'dueDate');
  const titles = page.locator('.outputData .output #title');
  await expect.poll(async () => (await titles.allTextContents()).map(t => t.trim()).slice(0, 2)).toEqual([B, A]);
  const all = (await titles.allTextContents()).map(t => t.trim());
  expect(all.indexOf(C)).toBeGreaterThan(1); // the undated welcome todo also sorts after A
});

// E2E tests for EPMCDMETST-67543 - Show created and edited dates on todo cards.
// One test per scenario in tests/features/EPMCDMETST-67543.feature (identical titles).
// Fixture tests stub GET /todos with page.route (design-review D-3); expected dates are
// computed in the browser with the app's own formatCardDate (D-4).
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^(Created|Edited) \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;
const SEP = ' · ';

// ---------------------------------------------------------------- helpers

function uniqueUser() {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return { name: `E2E ${stamp}`, email: `e2e-67543-${stamp}@example.com`, password: 'Passw0rd!' };
}

async function signUp(page, user) {
  await page.goto(BASE_URL + '/');
  await expect(page.locator('#auth-modal')).toBeVisible();
  await page.locator('#auth-toggle-link').click();
  await expect(page.locator('#auth-modal-title')).toHaveText('Sign Up');
  await page.locator('#auth-name').fill(user.name);
  await page.locator('#auth-email').fill(user.email);
  await page.locator('#auth-password').fill(user.password);
  await page.locator('#auth-submit-btn').click();
  await expect(page.locator('#auth-error')).toHaveText('Signup successful! Please login.');
}

async function logIn(page, user) {
  await expect(page.locator('#auth-modal-title')).toHaveText('Login');
  await page.locator('#auth-email').fill(user.email);
  await page.locator('#auth-password').fill(user.password);
  await page.locator('#auth-submit-btn').click();
  await expect(page.locator('#auth-modal')).toBeHidden();
  await expect(page.locator('#user-info')).toHaveText(`${user.name} (${user.email})`);
}

async function signUpAndLogIn(page) {
  const user = uniqueUser();
  await signUp(page, user);
  await logIn(page, user);
  return user;
}

// Replaces only the GET /todos response; all other requests (auth, POST, PUT ...) go to the real server.
async function routeTodos(page, todos) {
  await page.route(url => url.pathname === '/todos', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: todos });
    return route.continue();
  });
}

function fixture(id, title, createdAt, updatedAt, extra = {}) {
  const todo = { id, userId: 1, title, description: `Description of ${title}`, completed: false };
  if (createdAt !== undefined) todo.createdAt = createdAt;
  if (updatedAt !== undefined) todo.updatedAt = updatedAt;
  return Object.assign(todo, extra);
}

// Fixture test: real sign-up/login, stubbed GET /todos.
async function openWithFixture(page, todos) {
  await routeTodos(page, todos);
  await signUpAndLogIn(page);
  await expect(page.locator('.outputData .output')).toHaveCount(todos.length);
}

function card(page, title) {
  return page.locator('.outputData .output').filter({ has: page.getByText(title, { exact: true }) });
}

async function createTask(page, title, description = `Description of ${title}`) {
  await page.locator('#add-todo-btn').click();
  await expect(page.locator('#edit-modal')).toBeVisible();
  await page.locator('#edit-title').fill(title);
  await page.locator('#edit-desc').fill(description);
  await page.locator('#save-edit-btn').click();
  await expect(page.locator('#edit-modal')).toBeHidden();
  await expect(card(page, title)).toHaveCount(1);
}

async function editTask(page, oldTitle, newTitle, newDesc) {
  await card(page, oldTitle).getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#modal-title')).toHaveText('Edit To-Do');
  await page.locator('#edit-title').fill(newTitle);
  if (newDesc !== undefined) await page.locator('#edit-desc').fill(newDesc);
  await page.locator('#save-edit-btn').click();
  await expect(page.locator('#edit-modal')).toBeHidden();
  await expect(card(page, newTitle)).toHaveCount(1);
}

async function today(page) {
  return page.evaluate(() => formatCardDate(new Date()));
}

async function fmt(page, value) {
  return page.evaluate(v => formatCardDate(new Date(v)), value);
}

// Marks the current document; the marker disappears if the page is reloaded or navigated.
async function markDocument(page) {
  await page.evaluate(() => { window.__e2eNoReload = 'EPMCDMETST-67543'; });
}
async function expectNoReload(page) {
  expect(await page.evaluate(() => window.__e2eNoReload)).toBe('EPMCDMETST-67543');
}

async function lineTops(page, title) {
  const c = card(page, title);
  const created = await c.getByTestId('todo-created').boundingBox();
  const edited = await c.getByTestId('todo-edited').boundingBox();
  return { created, edited };
}

// ======================================================================= story tests

test.describe('EPMCDMETST-67543 card dates', () => {
  // ------------------------------------------------------------ AC-001
  test("New task shows Created with today's date", async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Buy milk', '2 litres');
    const c = card(page, 'Buy milk');
    await expect(c.getByTestId('todo-created')).toHaveText('Created ' + await today(page));
    await expect(c.getByTestId('todo-created')).not.toContainText(':');
  });

  test('Welcome task of a new user shows Created and no Edited label', async ({ page }) => {
    await signUpAndLogIn(page);
    const c = card(page, 'Welcome to your To-Do List!');
    await expect(c.getByTestId('todo-created')).toHaveText('Created ' + await today(page));
    await expect(c.getByTestId('todo-edited')).toHaveCount(0);
  });

  // ------------------------------------------------------------ AC-002
  test('Dates use the DD Mon YYYY format', async ({ page }) => {
    const created = '2026-01-09T12:00:00.000Z';
    const updated = '2026-12-31T12:00:00.000Z';
    await openWithFixture(page, [fixture(1, 'Format task', created, updated)]);
    const c = card(page, 'Format task');
    // Host time zone is within UTC-11..UTC+11, so noon UTC keeps the same calendar day.
    await expect(c.getByTestId('todo-created')).toHaveText('Created 09 Jan 2026');
    await expect(c.getByTestId('todo-edited')).toHaveText('Edited 31 Dec 2026');
    await expect(c.getByTestId('todo-created')).toHaveText('Created ' + await fmt(page, created));
    await expect(c.getByTestId('todo-edited')).toHaveText('Edited ' + await fmt(page, updated));
    for (const id of ['todo-created', 'todo-edited']) {
      const text = await c.getByTestId(id).textContent();
      expect(text).toMatch(DATE_RE);
      expect(text).not.toMatch(/\d{1,2}:\d{2}/);
    }
  });

  test("Dates are shown in the user's local time zone", async ({ browser }) => {
    const cases = [
      { timezoneId: 'Pacific/Kiritimati', created: '2026-10-05T12:00:00.000Z', updated: '2026-10-06T12:00:00.000Z',
        expCreated: 'Created 06 Oct 2026', expEdited: 'Edited 07 Oct 2026' },
      { timezoneId: 'America/Los_Angeles', created: '2026-10-05T03:00:00.000Z', updated: '2026-10-06T03:00:00.000Z',
        expCreated: 'Created 04 Oct 2026', expEdited: 'Edited 05 Oct 2026' },
    ];
    for (const tc of cases) {
      const context = await browser.newContext({ timezoneId: tc.timezoneId });
      const page = await context.newPage();
      try {
        await openWithFixture(page, [fixture(1, 'Zone task', tc.created, tc.updated)]);
        const c = card(page, 'Zone task');
        await expect(c.getByTestId('todo-created')).toHaveText(tc.expCreated);
        await expect(c.getByTestId('todo-edited')).toHaveText(tc.expEdited);
      } finally {
        await context.close();
      }
    }
  });

  // ------------------------------------------------------------ AC-003
  test('Edited label appears after a task is edited', async ({ page }) => {
    await signUpAndLogIn(page);
    await markDocument(page);
    await createTask(page, 'Draft report');
    await expect(card(page, 'Draft report').getByTestId('todo-edited')).toHaveCount(0);
    await page.waitForTimeout(1100); // D-3: exceed the 1000 ms threshold
    await editTask(page, 'Draft report', 'Final report');
    const c = card(page, 'Final report');
    const d = await today(page);
    await expect(c.getByTestId('todo-created')).toHaveText('Created ' + d);
    await expect(c.getByTestId('todo-edited')).toHaveText('Edited ' + d);
    expect(await c.locator('.todo-date-sep').textContent()).toBe(SEP);
    expect(await c.getByTestId('todo-dates').textContent()).toBe(`Created ${d}${SEP}Edited ${d}`);
    await expectNoReload(page);
  });

  test('Edited label is hidden when last-updated is within 1000 ms of creation', async ({ page }) => {
    const base = Date.parse('2026-10-05T10:00:00.000Z');
    const iso = ms => new Date(base + ms).toISOString();
    const deltas = [0, 1, 500, 1000];
    await openWithFixture(page, deltas.map((ms, i) => fixture(i + 1, `Within ${ms} ms`, iso(0), iso(ms))));
    for (const ms of deltas) {
      const c = card(page, `Within ${ms} ms`);
      await expect(c.getByTestId('todo-created')).toHaveText('Created ' + await fmt(page, iso(0)));
      await expect(c.getByTestId('todo-edited')).toHaveCount(0);
      await expect(c.locator('.todo-date-sep')).toHaveCount(0);
    }
  });

  test('Edited label is shown when last-updated is more than 1000 ms after creation', async ({ page }) => {
    const base = Date.parse('2026-10-05T10:00:00.000Z');
    const iso = ms => new Date(base + ms).toISOString();
    const deltas = [1001, 1500, DAY_MS];
    await openWithFixture(page, deltas.map((ms, i) => fixture(i + 1, `After ${ms} ms`, iso(0), iso(ms))));
    for (const ms of deltas) {
      const c = card(page, `After ${ms} ms`);
      await expect(c.getByTestId('todo-edited')).toHaveText('Edited ' + await fmt(page, iso(ms)));
      await expect(c.getByTestId('todo-edited')).toHaveText(DATE_RE);
    }
  });

  test('Edited label is hidden when last-updated is before creation', async ({ page }) => {
    const created = '2026-10-05T10:00:00.000Z';
    const updated = '2026-10-04T10:00:00.000Z';
    await openWithFixture(page, [fixture(1, 'Backwards task', created, updated)]);
    const c = card(page, 'Backwards task');
    await expect(c.getByTestId('todo-created')).toHaveText('Created ' + await fmt(page, created));
    await expect(c.getByTestId('todo-edited')).toHaveCount(0);
  });

  test('Toggling a task to Completed counts as an edit', async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Pay rent');
    await page.waitForTimeout(1100);
    await card(page, 'Pay rent').getByRole('button', { name: 'Mark Complete' }).click();
    const c = card(page, 'Pay rent');
    await expect(c.locator('.status-badge')).toHaveText('Completed');
    await expect(c.getByTestId('todo-edited')).toHaveText('Edited ' + await today(page));
  });

  // ------------------------------------------------------------ AC-004
  test('Missing or invalid creation date shows the Not available fallback', async ({ page }) => {
    const updated = '2026-10-06T10:00:00.000Z';
    const bad = [
      ['missing', undefined], ['null', null], ['empty', ''], ['blank', '   '], ['garbage', 'not-a-date'], ['boolean', true],
    ];
    await openWithFixture(page, bad.map(([label, value], i) => fixture(i + 1, `Created ${label} case`, value, updated)));
    for (const [label] of bad) {
      const c = card(page, `Created ${label} case`);
      await expect(c.getByTestId('todo-created')).toHaveText('Created: Not available');
      await expect(c.getByTestId('todo-edited')).toHaveCount(0);
    }
  });

  test('Missing or invalid last-updated date shows no Edited label', async ({ page }) => {
    const created = '2026-10-05T10:00:00.000Z';
    const bad = [['missing', undefined], ['null', null], ['empty', ''], ['garbage', 'not-a-date'], ['boolean', true]];
    await openWithFixture(page, bad.map(([label, value], i) => fixture(i + 1, `Updated ${label} case`, created, value)));
    const expected = 'Created ' + await fmt(page, created);
    for (const [label] of bad) {
      const c = card(page, `Updated ${label} case`);
      await expect(c.getByTestId('todo-created')).toHaveText(expected);
      await expect(c.getByTestId('todo-edited')).toHaveCount(0);
    }
  });

  test('Numeric timestamps are formatted as dates', async ({ page }) => {
    const created = Date.parse('2026-10-05T10:00:00.000Z');
    const updated = created + 2 * DAY_MS;
    await openWithFixture(page, [fixture(1, 'Numeric task', created, updated)]);
    const c = card(page, 'Numeric task');
    await expect(c.getByTestId('todo-created')).toHaveText('Created ' + await fmt(page, created));
    await expect(c.getByTestId('todo-edited')).toHaveText('Edited ' + await fmt(page, updated));
    await expect(c.getByTestId('todo-created')).toHaveText(DATE_RE);
  });

  test('Invalid dates never break the list or show raw error text', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Digit-free markup: Chromium's lenient Date parser turns strings containing digits
    // (e.g. '<img src=x onerror=...1>') into a valid date, which FR-007 treats as valid.
    const html = '<img src=x onerror="window.__xss=true">';
    await openWithFixture(page, [
      fixture(1, 'Valid dates task', '2026-10-05T10:00:00.000Z', '2026-10-07T10:00:00.000Z'),
      fixture(2, 'No dates task', undefined, undefined),
      fixture(3, 'Html date task', html, html),
    ]);
    await expect(card(page, 'Valid dates task').getByTestId('todo-edited')).toHaveCount(1);
    await expect(card(page, 'No dates task').getByTestId('todo-created')).toHaveText('Created: Not available');
    await expect(card(page, 'Html date task').getByTestId('todo-created')).toHaveText('Created: Not available');
    const text = await page.locator('.outputData').innerText();
    for (const bad of ['Invalid Date', 'NaN', 'undefined']) expect(text).not.toContain(bad);
    await expect(page.locator('.outputData img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(errors).toEqual([]);
  });

  // ------------------------------------------------------------ AC-005
  test('Created date appears immediately after creating a task without a page reload', async ({ page }) => {
    await signUpAndLogIn(page);
    await markDocument(page);
    await createTask(page, 'Call plumber');
    await expect(card(page, 'Call plumber').getByTestId('todo-created')).toHaveText('Created ' + await today(page));
    await expectNoReload(page);
  });

  // ------------------------------------------------------------ AC-006
  test('Created and Edited are on one line with a middle-dot separator on desktop', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openWithFixture(page, [fixture(1, 'Layout task', '2026-10-05T10:00:00.000Z', '2026-10-06T10:00:00.000Z')]);
    const c = card(page, 'Layout task');
    const { created, edited } = await lineTops(page, 'Layout task');
    expect(Math.abs(created.y - edited.y)).toBeLessThan(2);
    expect(edited.x).toBeGreaterThan(created.x);
    await expect(c.locator('.todo-date-sep')).toBeVisible();
    expect(await c.locator('.todo-date-sep').textContent()).toBe(SEP);
    await page.screenshot({ path: testInfo.outputPath('EPMCDMETST-67543-desktop-1280x800.png'), fullPage: true, animations: 'disabled' });
  });

  test('Dates stack and stay fully visible at mobile width 375px', async ({ page }, testInfo) => {
    await openWithFixture(page, [fixture(1, 'Mobile task', '2026-10-05T10:00:00.000Z', '2026-10-06T10:00:00.000Z')]);
    await page.setViewportSize({ width: 375, height: 667 });
    const c = card(page, 'Mobile task');
    const { created, edited } = await lineTops(page, 'Mobile task');
    expect(edited.y).toBeGreaterThanOrEqual(created.y + created.height - 1);
    await expect(c.locator('.todo-date-sep')).toBeHidden();
    for (const id of ['todo-created', 'todo-edited']) {
      await expect(c.getByTestId(id)).toHaveCSS('display', 'block');
      await expect(c.getByTestId(id)).toBeVisible();
    }
    const m = await c.getByTestId('todo-dates').evaluate(el => {
      const cardEl = el.closest('.output');
      return {
        scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
        right: el.getBoundingClientRect().right, cardRight: cardEl.getBoundingClientRect().right,
        ratio: parseFloat(getComputedStyle(el).fontSize) / parseFloat(getComputedStyle(cardEl).fontSize),
      };
    });
    expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
    expect(m.right).toBeLessThanOrEqual(m.cardRight + 0.5);
    expect(m.ratio).toBeGreaterThanOrEqual(0.8);
    await page.screenshot({ path: testInfo.outputPath('EPMCDMETST-67543-mobile-375x667.png'), fullPage: true, animations: 'disabled' });
  });

  test('Dates switch to the stacked layout at the 480px breakpoint', async ({ page }) => {
    await openWithFixture(page, [fixture(1, 'Breakpoint task', '2026-10-05T10:00:00.000Z', '2026-10-06T10:00:00.000Z')]);
    await page.setViewportSize({ width: 481, height: 800 });
    let pos = await lineTops(page, 'Breakpoint task');
    expect(Math.abs(pos.created.y - pos.edited.y)).toBeLessThan(2);
    await page.setViewportSize({ width: 480, height: 800 });
    pos = await lineTops(page, 'Breakpoint task');
    expect(pos.edited.y).toBeGreaterThanOrEqual(pos.created.y + pos.created.height - 1);
  });

  test('Date text keeps the card metadata style and readable contrast', async ({ page }) => {
    await openWithFixture(page, [fixture(1, 'Style task', '2026-10-05T10:00:00.000Z', '2026-10-06T10:00:00.000Z')]);
    const dates = card(page, 'Style task').getByTestId('todo-dates');
    await expect(dates).toHaveClass('todo-timestamp');
    await expect(dates).toHaveCSS('color', 'rgb(107, 114, 128)');
    const s = await dates.evaluate(el => {
      const cs = getComputedStyle(el);
      const rgb = cs.color.match(/\d+/g).slice(0, 3).map(Number);
      const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const L = 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
      return {
        contrastWhite: 1.05 / (L + 0.05),
        ratio: parseFloat(cs.fontSize) / parseFloat(getComputedStyle(el.closest('.output')).fontSize),
      };
    });
    console.log(`[EPMCDMETST-67543] contrast vs white = ${s.contrastWhite.toFixed(2)}:1, font-size ratio = ${s.ratio.toFixed(3)}`);
    expect(s.contrastWhite).toBeGreaterThanOrEqual(4.5);
    expect(s.ratio).toBeCloseTo(0.85, 2);
  });

  // ------------------------------------------------------------ AC-008
  test('Card date markup exposes test ids and no legacy Updated text', async ({ page }) => {
    await openWithFixture(page, [
      fixture(1, 'Edited markup task', '2026-10-05T10:00:00.000Z', '2026-10-06T10:00:00.000Z'),
      fixture(2, 'Unedited markup task', '2026-10-05T10:00:00.000Z', '2026-10-05T10:00:00.000Z'),
    ]);
    for (const title of ['Edited markup task', 'Unedited markup task']) {
      const c = card(page, title);
      await expect(c.getByTestId('todo-dates')).toHaveCount(1);
      await expect(c.getByTestId('todo-dates').getByTestId('todo-created')).toHaveCount(1);
      await expect(c).not.toContainText('Updated:');
    }
    const edited = card(page, 'Edited markup task');
    await expect(edited.getByTestId('todo-dates').getByTestId('todo-edited')).toHaveCount(1);
    await expect(edited.locator('[data-testid="todo-dates"] > span')).toHaveCount(3);
    const unedited = card(page, 'Unedited markup task');
    await expect(unedited.getByTestId('todo-edited')).toHaveCount(0);
    await expect(unedited.locator('.todo-date-sep')).toHaveCount(0);
    await expect(unedited.locator('[data-testid="todo-dates"] > span')).toHaveCount(1);
  });
});

// ======================================================================= AC-007 regression

test.describe('EPMCDMETST-67543 AC-007 regression', () => {
  test('Regression: user can sign up', async ({ page }) => {
    await signUp(page, uniqueUser());
    await expect(page.locator('#auth-modal-title')).toHaveText('Login');
    await expect(page.locator('#auth-name-field')).toBeHidden();
    await expect(page.locator('#auth-email')).toBeVisible();
  });

  test('Regression: user can log in', async ({ page }) => {
    const user = uniqueUser();
    await signUp(page, user);
    await logIn(page, user);
    await expect(page.locator('#logout-btn')).toBeVisible();
    await expect(card(page, 'Welcome to your To-Do List!')).toHaveCount(1);
  });

  test('Regression: user can create a task', async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Water plants', 'Balcony');
    const c = card(page, 'Water plants');
    await expect(c.locator('#desc')).toHaveText('Balcony');
    await expect(c.locator('.status-badge')).toHaveText('Active');
  });

  test('Regression: user can edit a task', async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Old title');
    await editTask(page, 'Old title', 'New title', 'New desc');
    await expect(card(page, 'New title').locator('#desc')).toHaveText('New desc');
    await expect(card(page, 'Old title')).toHaveCount(0);
  });

  test('Regression: user can mark a task complete', async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Finish book');
    await card(page, 'Finish book').getByRole('button', { name: 'Mark Complete' }).click();
    const c = card(page, 'Finish book');
    await expect(c.locator('.status-badge')).toHaveText('Completed');
    await expect(c).toHaveClass(/completed/);
    await expect(c.getByRole('button', { name: 'Mark Active' })).toBeVisible();
  });

  test('Regression: user can filter tasks by status', async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Active one');
    await createTask(page, 'Done one');
    await card(page, 'Done one').getByRole('button', { name: 'Mark Complete' }).click();
    await expect(card(page, 'Done one').locator('.status-badge')).toHaveText('Completed');
    await page.locator('#filter-select').selectOption('completed');
    await expect(page.locator('.outputData .output')).toHaveCount(1);
    await expect(card(page, 'Done one')).toHaveCount(1);
    await page.locator('#filter-select').selectOption('active');
    await expect(card(page, 'Active one')).toHaveCount(1);
    await expect(card(page, 'Done one')).toHaveCount(0);
  });

  test('Regression: user can sort tasks by title', async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Bravo task');
    await createTask(page, 'Alpha task');
    await page.locator('#sort-select').selectOption('title');
    await expect(page.locator('.outputData .output #title'))
      .toHaveText(['Alpha task', 'Bravo task', 'Welcome to your To-Do List!']);
  });

  test('Regression: user can search tasks', async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Groceries list', 'Eggs and bread');
    await createTask(page, 'Gym session', 'Leg day');
    await page.locator('#search-input').fill('groceries');
    await expect(page.locator('.outputData .output')).toHaveCount(1);
    await expect(card(page, 'Groceries list')).toHaveCount(1);
  });

  test('Regression: user can delete a task', async ({ page }) => {
    await signUpAndLogIn(page);
    await createTask(page, 'Temporary task');
    page.once('dialog', dialog => dialog.accept());
    await card(page, 'Temporary task').getByRole('button', { name: 'Delete' }).click();
    await expect(card(page, 'Temporary task')).toHaveCount(0);
    await expect(card(page, 'Welcome to your To-Do List!')).toHaveCount(1);
  });
});

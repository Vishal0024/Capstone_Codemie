// API tests for EPMCDMETST-67513 (Due Dates). Runs against http://localhost:3000,
// started by tests/support/jest-global-setup.js.
const request = require('supertest');
const fs = require('fs');
const path = require('path');

const api = request('http://localhost:3000');
const TODOS_FILE = path.resolve(__dirname, '..', '..', 'todos.json');
const uniqueEmail = () => `qa.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.test`;

async function newUser() {
  const email = uniqueEmail();
  const password = 'Passw0rd!';
  await api.post('/signup').send({ name: 'QA', email, password }).expect(201);
  const res = await api.post('/login').send({ email, password }).expect(200);
  return res.body.token; // raw token, no "Bearer"
}
const create = (t, body = {}) =>
  api.post('/todos').set('Authorization', t).send({ title: 'T', description: 'D', completed: false, ...body });
const update = (t, id, body) =>
  api.put(`/todos/${id}`).set('Authorization', t).send({ title: 'T', description: 'D', completed: false, ...body });
const list = (t, qs = '') => api.get(`/todos${qs}`).set('Authorization', t);

let token;
beforeEach(async () => { token = await newUser(); });

describe('Create with dueDate [EPMCDMETST-67514, EPMCDMETST-67515]', () => {
  test('TC-001 date-only string is stored as UTC midnight and returned by GET', async () => {
    const res = await create(token, { dueDate: '2099-01-02' }).expect(201);
    expect(res.body.dueDate).toBe('2099-01-02T00:00:00.000Z');
    const all = await list(token).expect(200);
    expect(all.body.find(t => t.id === res.body.id).dueDate).toBe('2099-01-02T00:00:00.000Z');
  });

  test('TC-002 missing dueDate -> null', async () => {
    const res = await create(token).expect(201);
    expect(res.body.dueDate).toBeNull();
  });

  test('TC-002b null and empty string -> null', async () => {
    expect((await create(token, { dueDate: null }).expect(201)).body.dueDate).toBeNull();
    expect((await create(token, { dueDate: '' }).expect(201)).body.dueDate).toBeNull();
  });

  test.each(['not-a-date', '2026-13-01', '2026-02-31', 12345, true, {}])(
    'TC-003 invalid dueDate %p -> 400 Invalid dueDate', async (bad) => {
      const res = await create(token, { dueDate: bad }).expect(400);
      expect(res.body).toEqual({ error: 'Invalid dueDate' });
    });

  test('TC-003b timestamp with offset is normalised to ISO UTC', async () => {
    const res = await create(token, { dueDate: '2099-03-15T10:30:00+02:00' }).expect(201);
    expect(res.body.dueDate).toBe('2099-03-15T08:30:00.000Z');
  });
});

describe('Update dueDate [EPMCDMETST-67515]', () => {
  test('TC-004 PUT sets dueDate; GET /:id returns it', async () => {
    const { body } = await create(token).expect(201);
    await update(token, body.id, { dueDate: '2099-05-10' }).expect(200);
    const got = await api.get(`/todos/${body.id}`).set('Authorization', token).expect(200);
    expect(got.body.dueDate).toBe('2099-05-10T00:00:00.000Z');
  });

  test('TC-005 omitting the key keeps the value; null and "" clear it', async () => {
    const { body } = await create(token, { dueDate: '2099-05-11' }).expect(201);
    expect((await update(token, body.id, { title: 'Renamed' }).expect(200)).body.dueDate).toBe('2099-05-11T00:00:00.000Z');
    expect((await update(token, body.id, { dueDate: null }).expect(200)).body.dueDate).toBeNull();
    await update(token, body.id, { dueDate: '2099-05-12' }).expect(200);
    expect((await update(token, body.id, { dueDate: '' }).expect(200)).body.dueDate).toBeNull();
  });

  test('TC-005b invalid dueDate on PUT -> 400 and the stored value is unchanged', async () => {
    const { body } = await create(token, { dueDate: '2099-05-11' }).expect(201);
    const res = await update(token, body.id, { dueDate: '2026-02-31' }).expect(400);
    expect(res.body).toEqual({ error: 'Invalid dueDate' });
    const got = await api.get(`/todos/${body.id}`).set('Authorization', token).expect(200);
    expect(got.body.dueDate).toBe('2099-05-11T00:00:00.000Z');
  });

  test('TC-005c title/description required -> 400 Invalid input', async () => {
    const { body } = await create(token).expect(201);
    expect((await update(token, body.id, { title: '' }).expect(400)).body).toEqual({ error: 'Invalid input' });
    await api.put(`/todos/${body.id}`).set('Authorization', token).send({ title: 'T' }).expect(400);
  });

  test('TC-005d omitting completed is accepted (coerced with !!) - documents current behaviour', async () => {
    const { body } = await create(token).expect(201);
    await api.put(`/todos/${body.id}`).set('Authorization', token).send({ title: 'T', description: 'D' }).expect(200);
  });

  test('TC-005e unknown id -> 404', async () => {
    await update(token, 99999999, { dueDate: '2099-01-01' }).expect(404);
  });
});

describe('List sort/filter [EPMCDMETST-67516]', () => {
  test('TC-006 sort=dueDate ascending, undated last, ties by id', async () => {
    const b = (await create(token, { title: 'B', dueDate: '2099-01-01' }).expect(201)).body;
    const a = (await create(token, { title: 'A', dueDate: '2099-01-02' }).expect(201)).body;
    const a2 = (await create(token, { title: 'A2', dueDate: '2099-01-02' }).expect(201)).body;
    const c = (await create(token, { title: 'C' }).expect(201)).body;
    const res = (await list(token, '?sort=dueDate').expect(200)).body;
    const ids = res.map(t => t.id);
    expect(ids.slice(0, 3)).toEqual([b.id, a.id, a2.id]); // a/a2 tie broken by id
    // Every undated todo (C plus the signup welcome todo) comes after every dated one
    const firstUndated = res.findIndex(t => t.dueDate === null);
    expect(firstUndated).toBe(3);
    expect(res.slice(firstUndated).every(t => t.dueDate === null)).toBe(true);
    expect(ids.indexOf(c.id)).toBeGreaterThanOrEqual(firstUndated);
  });

  test('TC-007 filter=overdue returns only incomplete past-due todos', async () => {
    const past = (await create(token, { title: 'Past', dueDate: '2020-01-01' }).expect(201)).body;
    await create(token, { title: 'Future', dueDate: '2099-01-01' }).expect(201);
    await create(token, { title: 'PastDone', dueDate: '2020-01-01', completed: true }).expect(201);
    await create(token, { title: 'NoDate' }).expect(201);
    const res = await list(token, '?filter=overdue').expect(200);
    expect(res.body.map(t => t.id)).toEqual([past.id]);
  });

  test('unauthenticated list -> 401', async () => {
    await api.get('/todos').expect(401);
  });
});

describe('Legacy records [EPMCDMETST-67514]', () => {
  test('TC-008 record without a dueDate key -> dueDate null in list and detail', async () => {
    const welcome = (await list(token).expect(200)).body[0];
    const todos = JSON.parse(fs.readFileSync(TODOS_FILE, 'utf8'));
    const rec = todos.find(t => t.id === welcome.id);
    delete rec.dueDate;
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2)); // server re-reads the file per request
    expect(JSON.parse(fs.readFileSync(TODOS_FILE, 'utf8')).find(t => t.id === welcome.id)).not.toHaveProperty('dueDate');
    const listed = (await list(token).expect(200)).body.find(t => t.id === welcome.id);
    expect(listed).toHaveProperty('dueDate', null);
    const got = await api.get(`/todos/${welcome.id}`).set('Authorization', token).expect(200);
    expect(got.body).toHaveProperty('dueDate', null);
  });
});

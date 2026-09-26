const request = require('supertest');
const fs = require('fs');
const path = require('path');

const SERVER_DIR = path.resolve(__dirname, '../');
const TODOS_PATH = path.join(SERVER_DIR, 'todos.json');
const USERS_PATH = path.join(SERVER_DIR, 'users.json');
const SESSIONS_PATH = path.join(SERVER_DIR, 'sessions.json');

const app = require('../todoServer');

const TEST_EMAIL = `api-suite-${Date.now()}@example.com`;
const TEST_PASSWORD = 'suitepass123';
const TEST_NAME = 'API Suite User';

let token;
let backupTodos, backupUsers, backupSessions;

beforeAll(async () => {
  backupTodos    = fs.existsSync(TODOS_PATH)    ? fs.readFileSync(TODOS_PATH, 'utf8')    : '[]';
  backupUsers    = fs.existsSync(USERS_PATH)    ? fs.readFileSync(USERS_PATH, 'utf8')    : '[]';
  backupSessions = fs.existsSync(SESSIONS_PATH) ? fs.readFileSync(SESSIONS_PATH, 'utf8') : '{}';

  fs.writeFileSync(TODOS_PATH,    '[]',  'utf8');
  fs.writeFileSync(USERS_PATH,    '[]',  'utf8');
  fs.writeFileSync(SESSIONS_PATH, '{}', 'utf8');

  await request(app).post('/signup').send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD });
  const res = await request(app).post('/login').send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  token = res.body.token;
});

afterAll(() => {
  fs.writeFileSync(TODOS_PATH,    backupTodos,    'utf8');
  fs.writeFileSync(USERS_PATH,    backupUsers,    'utf8');
  fs.writeFileSync(SESSIONS_PATH, backupSessions, 'utf8');
});

// ─── API-01 ───────────────────────────────────────────────────────────────────
describe('API-01', () => {
  it('POST /login valid credentials → 200 + { token, name, email }', async () => {
    const res = await request(app).post('/login').send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('name', TEST_NAME);
    expect(res.body).toHaveProperty('email', TEST_EMAIL);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });
});

// ─── API-02 ───────────────────────────────────────────────────────────────────
describe('API-02', () => {
  it('GET /todos with valid token → 200 + array', async () => {
    const res = await request(app).get('/todos').set('Authorization', token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── API-03 ───────────────────────────────────────────────────────────────────
describe('API-03', () => {
  it('GET /todos?filter=completed → all items have completed:true', async () => {
    const created = await request(app).post('/todos').set('Authorization', token)
      .send({ title: 'Completed Task', description: 'desc', completed: false });
    await request(app).patch(`/todos/${created.body.id}/toggle`).set('Authorization', token);

    const res = await request(app).get('/todos?filter=completed').set('Authorization', token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every(t => t.completed)).toBe(true);
  });
});

// ─── API-04 ───────────────────────────────────────────────────────────────────
describe('API-04', () => {
  it('GET /todos?filter=active → all items have completed:false', async () => {
    await request(app).post('/todos').set('Authorization', token)
      .send({ title: 'Active Task', description: 'desc', completed: false });

    const res = await request(app).get('/todos?filter=active').set('Authorization', token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every(t => !t.completed)).toBe(true);
  });
});

// ─── API-05 ───────────────────────────────────────────────────────────────────
describe('API-05', () => {
  it('GET /todos?search=<term> → all results contain term in title or description', async () => {
    await request(app).post('/todos').set('Authorization', token)
      .send({ title: 'Buy apples', description: 'fruit shop', completed: false });
    await request(app).post('/todos').set('Authorization', token)
      .send({ title: 'Do exercise', description: 'run outside', completed: false });

    const res = await request(app).get('/todos?search=apples').set('Authorization', token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every(t =>
      t.title.toLowerCase().includes('apples') || t.description.toLowerCase().includes('apples')
    )).toBe(true);
    expect(res.body.some(t => t.title === 'Buy apples')).toBe(true);
    expect(res.body.some(t => t.title === 'Do exercise')).toBe(false);
  });
});

// ─── API-06 ───────────────────────────────────────────────────────────────────
describe('API-06', () => {
  it('POST /todos with valid body → 201 + returned object has correct title/description', async () => {
    const res = await request(app).post('/todos').set('Authorization', token)
      .send({ title: 'My New Task', description: 'Details here', completed: false });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('My New Task');
    expect(res.body.description).toBe('Details here');
    expect(res.body.completed).toBe(false);
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });
});

// ─── API-07 ───────────────────────────────────────────────────────────────────
describe('API-07', () => {
  it('DELETE /todos/:id → 200, subsequent GET does not contain deleted id', async () => {
    const created = await request(app).post('/todos').set('Authorization', token)
      .send({ title: 'Delete Me', description: 'desc', completed: false });
    const id = created.body.id;

    const del = await request(app).delete(`/todos/${id}`).set('Authorization', token);
    expect(del.status).toBe(200);

    const list = await request(app).get('/todos').set('Authorization', token);
    expect(list.body.some(t => t.id === id)).toBe(false);
  });
});

// ─── API-08 ───────────────────────────────────────────────────────────────────
describe('API-08', () => {
  it('PATCH /todos/:id/toggle → 200, completed field is toggled', async () => {
    const created = await request(app).post('/todos').set('Authorization', token)
      .send({ title: 'Toggle Me', description: 'desc', completed: false });
    const id = created.body.id;

    const toggled = await request(app).patch(`/todos/${id}/toggle`).set('Authorization', token);
    expect(toggled.status).toBe(200);
    expect(toggled.body.completed).toBe(true);

    const toggledBack = await request(app).patch(`/todos/${id}/toggle`).set('Authorization', token);
    expect(toggledBack.status).toBe(200);
    expect(toggledBack.body.completed).toBe(false);
  });
});

// ─── API-09 ───────────────────────────────────────────────────────────────────
describe('API-09', () => {
  it('GET /todos without token → 401', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(401);
  });
});

// ─── API-10 ───────────────────────────────────────────────────────────────────
describe('API-10', () => {
  it('POST /login with wrong password → 401', async () => {
    const res = await request(app).post('/login').send({ email: TEST_EMAIL, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});

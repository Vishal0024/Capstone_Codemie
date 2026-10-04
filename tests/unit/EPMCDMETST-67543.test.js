// EPMCDMETST-67543 - unit tests for the card date helpers in public/script.js
// Covers FR-002, FR-004, FR-005, FR-006, FR-007, FR-012, FR-014; AC-002, AC-003, AC-004, AC-008.
// D-9: minimal global stubs so the browser script can be loaded in Node (no jsdom).
// OOS-3 (approved deviation from D-9): script.js is loaded with fs + vm instead of require,
// because Jest's Babel transform parses it as a strict module and rejects the pre-existing
// duplicate fetchAndRenderTodos declaration.
// D-4: inputs are built with local-time constructors; process.env.TZ is not set.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { location: { origin: 'http://localhost:3000' } };
global.localStorage = { getItem: () => null };
global.document = { addEventListener: () => {} };

function loadScript() {
  const file = path.join(__dirname, '..', '..', 'public', 'script.js');
  const source = fs.readFileSync(file, 'utf8');
  const wrapped = `(function (module, window, localStorage, document) {\n${source}\n})`;
  const fn = vm.runInThisContext(wrapped, { filename: file });
  const mod = { exports: {} };
  fn(mod, global.window, global.localStorage, global.document);
  return mod.exports;
}

const {
  parseCardDate,
  formatCardDate,
  getCardDates,
  EDITED_THRESHOLD_MS,
} = loadScript();

const iso = (...args) => new Date(...args).toISOString();

describe('EPMCDMETST-67543 module load', () => {
  test('exports the pure helpers and the threshold constant', () => {
    expect(typeof parseCardDate).toBe('function');
    expect(typeof formatCardDate).toBe('function');
    expect(typeof getCardDates).toBe('function');
    expect(EDITED_THRESHOLD_MS).toBe(1000);
  });
});

describe('formatCardDate (FR-002, AC-002)', () => {
  test('formats a local date as DD Mon YYYY', () => {
    expect(formatCardDate(new Date(2026, 9, 5, 12, 0))).toBe('05 Oct 2026');
  });

  test('zero-pads a single-digit day', () => {
    expect(formatCardDate(new Date(2026, 0, 1, 12, 0))).toBe('01 Jan 2026');
  });

  test('keeps a two-digit day unpadded', () => {
    expect(formatCardDate(new Date(2026, 11, 31, 12, 0))).toBe('31 Dec 2026');
  });

  test.each([
    [0, 'Jan'], [1, 'Feb'], [2, 'Mar'], [3, 'Apr'], [4, 'May'], [5, 'Jun'],
    [6, 'Jul'], [7, 'Aug'], [8, 'Sep'], [9, 'Oct'], [10, 'Nov'], [11, 'Dec'],
  ])('month index %i is shown as %s', (month, name) => {
    expect(formatCardDate(new Date(2026, month, 15, 12, 0))).toBe(`15 ${name} 2026`);
  });

  test('uses a four-digit year', () => {
    expect(formatCardDate(new Date(2031, 2, 9, 12, 0))).toMatch(/^09 Mar 2031$/);
  });

  test('uses local time just after local midnight (00:30)', () => {
    const parsed = parseCardDate(iso(2026, 9, 5, 0, 30));
    expect(formatCardDate(parsed)).toBe('05 Oct 2026');
  });

  test('uses local time just before local midnight (23:30)', () => {
    const parsed = parseCardDate(iso(2026, 9, 5, 23, 30));
    expect(formatCardDate(parsed)).toBe('05 Oct 2026');
  });
});

describe('parseCardDate (FR-007, AC-004)', () => {
  test('returns a Date for a valid ISO string', () => {
    const value = iso(2026, 9, 5, 12, 0);
    const result = parseCardDate(value);
    expect(Object.prototype.toString.call(result)).toBe('[object Date]'); // realm-independent (vm context)
    expect(result.getTime()).toBe(new Date(2026, 9, 5, 12, 0).getTime());
  });

  test('returns a Date for a valid number', () => {
    const ms = new Date(2026, 9, 5, 12, 0).getTime();
    const result = parseCardDate(ms);
    expect(Object.prototype.toString.call(result)).toBe('[object Date]'); // realm-independent (vm context)
    expect(result.getTime()).toBe(ms);
  });

  test.each([
    ['undefined (missing)', undefined],
    ['null', null],
    ['empty string', ''],
    ['whitespace-only string', '   '],
    ['unparsable string', 'not-a-date'],
    ['boolean true', true],
    ['object', {}],
    ['array', []],
    ['NaN', NaN],
  ])('returns null for %s without throwing', (_label, value) => {
    expect(() => parseCardDate(value)).not.toThrow();
    expect(parseCardDate(value)).toBeNull();
  });
});

describe('getCardDates (FR-001, FR-003 to FR-006, AC-001, AC-003, AC-004)', () => {
  const createdLocal = new Date(2026, 9, 5, 12, 0);
  const createdIso = createdLocal.toISOString();
  const plus = (ms) => new Date(createdLocal.getTime() + ms).toISOString();

  test('builds the Created label without a colon', () => {
    expect(getCardDates({ createdAt: createdIso, updatedAt: createdIso })).toEqual({
      created: 'Created 05 Oct 2026',
      edited: null,
    });
  });

  test.each([
    ['missing', {}],
    ['null', { createdAt: null }],
    ['empty string', { createdAt: '' }],
    ['unparsable string', { createdAt: 'not-a-date' }],
    ['boolean true', { createdAt: true }],
  ])('createdAt %s gives the fallback and no Edited label', (_label, fields) => {
    const todo = { ...fields, updatedAt: plus(86400000) };
    expect(getCardDates(todo)).toEqual({ created: 'Created: Not available', edited: null });
  });

  test.each([
    ['missing', undefined],
    ['null', null],
    ['unparsable string', 'not-a-date'],
    ['empty string', ''],
  ])('updatedAt %s gives no Edited label', (_label, updatedAt) => {
    const result = getCardDates({ createdAt: createdIso, updatedAt });
    expect(result.created).toBe('Created 05 Oct 2026');
    expect(result.edited).toBeNull();
  });

  test.each([
    ['+1 ms', 1],
    ['+500 ms', 500],
    ['+1000 ms (boundary)', 1000],
  ])('updatedAt %s after createdAt is not shown as edited', (_label, ms) => {
    expect(getCardDates({ createdAt: createdIso, updatedAt: plus(ms) }).edited).toBeNull();
  });

  test('updatedAt +1001 ms after createdAt is shown as edited (same day)', () => {
    expect(getCardDates({ createdAt: createdIso, updatedAt: plus(1001) }).edited).toBe('Edited 05 Oct 2026');
  });

  test('updatedAt +1 day is shown as edited with the later date', () => {
    expect(getCardDates({ createdAt: createdIso, updatedAt: plus(86400000) }).edited).toBe('Edited 06 Oct 2026');
  });

  test('same-day edit later in the day shows Edited with the same date', () => {
    const updated = iso(2026, 9, 5, 18, 45);
    expect(getCardDates({ createdAt: createdIso, updatedAt: updated })).toEqual({
      created: 'Created 05 Oct 2026',
      edited: 'Edited 05 Oct 2026',
    });
  });

  test('updatedAt before createdAt is not shown as edited', () => {
    expect(getCardDates({ createdAt: createdIso, updatedAt: plus(-86400000) }).edited).toBeNull();
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'x'],
  ])('todo %s gives the fallback without throwing', (_label, todo) => {
    expect(() => getCardDates(todo)).not.toThrow();
    expect(getCardDates(todo)).toEqual({ created: 'Created: Not available', edited: null });
  });

  test('output never contains Invalid Date, NaN or undefined', () => {
    const inputs = [
      {}, null, undefined, 'x',
      { createdAt: 'not-a-date', updatedAt: 'not-a-date' },
      { createdAt: NaN, updatedAt: NaN },
      { createdAt: createdIso, updatedAt: plus(86400000) },
      { createdAt: createdIso, updatedAt: true },
    ];
    inputs.forEach((todo) => {
      const { created, edited } = getCardDates(todo);
      const text = `${created} ${edited === null ? '' : edited}`;
      expect(text).not.toMatch(/Invalid Date|NaN|undefined/);
    });
  });
});

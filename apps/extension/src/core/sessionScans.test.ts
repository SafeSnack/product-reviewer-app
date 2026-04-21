import { describe, expect, it } from 'vitest';
import { localCalendarDateKey, mergeScansToday } from './sessionScans.js';

describe('sessionScans', () => {
  it('mergeScansToday resets when date changes', () => {
    const prev = { date: '2000-01-01', keys: ['amazon:A'] };
    const next = mergeScansToday('2026-04-21', prev, 'amazon:B');
    expect(next).toEqual({ date: '2026-04-21', keys: ['amazon:B'] });
  });

  it('mergeScansToday dedupes same product key same day', () => {
    const prev = { date: '2026-04-21', keys: ['amazon:A'] };
    const next = mergeScansToday('2026-04-21', prev, 'amazon:A');
    expect(next).toBe(prev);
  });

  it('mergeScansToday appends new keys', () => {
    const prev = { date: '2026-04-21', keys: ['amazon:A'] };
    const next = mergeScansToday('2026-04-21', prev, 'amazon:B');
    expect(next).toEqual({ date: '2026-04-21', keys: ['amazon:A', 'amazon:B'] });
  });

  it('localCalendarDateKey is stable for fixed input', () => {
    const d = new Date(Date.UTC(2026, 3, 21, 12, 0, 0));
    expect(localCalendarDateKey(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

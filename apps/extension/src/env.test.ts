import { describe, it, expect } from 'vitest';
import { IS_DEV, MODE } from './env.js';

describe('env', () => {
  it('exposes vite mode', () => {
    expect(typeof MODE).toBe('string');
    expect(typeof IS_DEV).toBe('boolean');
  });
});

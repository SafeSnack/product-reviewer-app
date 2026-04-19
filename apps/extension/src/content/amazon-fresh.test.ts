import { describe, expect, it } from 'vitest';
import { classifyAmazonPage } from './amazon-fresh.js';

describe('classifyAmazonPage', () => {
  it('classifies search paths', () => {
    expect(classifyAmazonPage('https://www.amazon.com/s?k=milk')).toBe('search');
    expect(classifyAmazonPage('https://www.amazon.com/s/ref=nb_sb_noss')).toBe('search');
    expect(classifyAmazonPage('https://www.amazon.com/gp/browse.html?node=123')).toBe('search');
  });

  it('classifies PDP paths', () => {
    expect(classifyAmazonPage('https://www.amazon.com/dp/B0ABCDEFGHI')).toBe('pdp');
    expect(classifyAmazonPage('https://www.amazon.com/gp/product/B0ABCDEFGHI/ref=x')).toBe('pdp');
  });

  it('returns other for unrelated paths', () => {
    expect(classifyAmazonPage('https://www.amazon.com/gp/css/homepage.html')).toBe('other');
    expect(classifyAmazonPage('not-a-url')).toBe('other');
  });
});

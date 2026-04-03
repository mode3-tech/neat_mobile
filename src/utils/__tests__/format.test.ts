import { formatNaira, formatNairaWhole } from '../format';

describe('formatNaira (kobo → naira)', () => {
  it('formats kobo to naira with currency symbol', () => {
    expect(formatNaira(25000000)).toBe('₦250,000.00');
  });

  it('handles zero', () => {
    expect(formatNaira(0)).toBe('₦0.00');
  });

  it('handles small amounts (under 1 naira)', () => {
    expect(formatNaira(50)).toBe('₦0.50');
  });
});

describe('formatNairaWhole (naira → display string)', () => {
  it('formats whole naira with currency symbol and commas', () => {
    expect(formatNairaWhole(250000)).toBe('₦250,000.00');
  });

  it('handles zero', () => {
    expect(formatNairaWhole(0)).toBe('₦0.00');
  });

  it('handles decimal values', () => {
    expect(formatNairaWhole(19166.67)).toBe('₦19,166.67');
  });

  it('handles large amounts', () => {
    expect(formatNairaWhole(10000000)).toBe('₦10,000,000.00');
  });
});

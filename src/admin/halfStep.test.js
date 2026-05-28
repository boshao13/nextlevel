import { isHalfStep, STEP } from './halfStep';

test('STEP is 0.5', () => {
  expect(STEP).toBe(0.5);
});

test('integers and half-integers pass', () => {
  expect(isHalfStep(0)).toBe(true);
  expect(isHalfStep(0.5)).toBe(true);
  expect(isHalfStep(1)).toBe(true);
  expect(isHalfStep(2.5)).toBe(true);
  expect(isHalfStep(100.5)).toBe(true);
});

test('non-half steps fail', () => {
  expect(isHalfStep(0.3)).toBe(false);
  expect(isHalfStep(0.25)).toBe(false);
  expect(isHalfStep(1.1)).toBe(false);
});

test('negative numbers fail (amount only goes up via correction, usage is positive)', () => {
  expect(isHalfStep(-1)).toBe(false);
  expect(isHalfStep(-0.5)).toBe(false);
});

test('non-numbers fail', () => {
  expect(isHalfStep(NaN)).toBe(false);
  expect(isHalfStep('1')).toBe(false);
  expect(isHalfStep(null)).toBe(false);
  expect(isHalfStep(undefined)).toBe(false);
});

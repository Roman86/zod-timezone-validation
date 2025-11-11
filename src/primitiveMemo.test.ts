import { primitiveMemo } from './primitiveMemo';

test('primitive memo', () => {
  let accum = 0;

  const direct = (increment: number) => {
    accum += increment;
    return accum;
  };

  const mem = primitiveMemo(direct);

  expect(mem(0)).toBe(0);
  expect(mem(1)).toBe(1);
  expect(direct(0)).toBe(1);
  expect(direct(1)).toBe(2);
  expect(direct(1)).toBe(3);
  expect(mem(1)).toBe(1);
  expect(mem(1)).toBe(1);
  expect(mem(0)).toBe(0);
  expect(mem(2)).toBe(5);
  expect(mem(1)).toBe(1);
  expect(direct(0)).toBe(5);
});

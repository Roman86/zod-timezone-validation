// biome-ignore lint/suspicious/noExplicitAny: any function, but would be good to restrict the arguments with primitive types only
type FnProxy<F extends (...args: any[]) => any> = (
  ...a: Parameters<F>
) => ReturnType<F>;

// biome-ignore lint/suspicious/noExplicitAny: any function, but would be good to restrict the arguments with primitive types only
export const primitiveMemo = <F extends (...args: any[]) => any>(
  fn: F,
): FnProxy<F> => {
  const cache = new Map<string, ReturnType<F>>();
  return (...args) => {
    const key = args.map(String).join('&');
    const hit = cache.get(key);
    if (hit != null) {
      return hit;
    }
    const result: ReturnType<F> = fn(...args);
    cache.set(key, result);
    return result;
  };
};

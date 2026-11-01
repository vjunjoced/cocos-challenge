export function indexBy<T, K>(items: T[], getKey: (item: T) => K): Map<K, T> {
  return new Map(items.map((item) => [getKey(item), item]));
}

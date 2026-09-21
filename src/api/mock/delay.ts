// Stands in for real network latency so loading states are actually exercised
// against the mock API, not just the real one.
export function mockDelay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class SlidingWindowRateLimiter {
  private readonly buckets = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string, now = Date.now()): boolean {
    const stamps = (this.buckets.get(key) ?? []).filter(
      (timestamp) => now - timestamp < this.windowMs,
    );
    if (stamps.length >= this.maxRequests) {
      this.buckets.set(key, stamps);
      return false;
    }
    stamps.push(now);
    this.buckets.set(key, stamps);
    return true;
  }
}

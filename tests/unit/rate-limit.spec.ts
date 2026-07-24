import { expect, test } from "@playwright/test";

import { SlidingWindowRateLimiter } from "../../src/lib/cms/rate-limit";

test("sliding-window rate limiter rejects excess requests and recovers", () => {
  const limiter = new SlidingWindowRateLimiter(2, 1_000);

  expect(limiter.consume("client", 0)).toBe(true);
  expect(limiter.consume("client", 100)).toBe(true);
  expect(limiter.consume("client", 200)).toBe(false);
  expect(limiter.consume("other-client", 200)).toBe(true);
  expect(limiter.consume("client", 1_001)).toBe(true);
});

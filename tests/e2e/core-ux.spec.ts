import { expect, test } from "@playwright/test";

test("homepage remains within the viewport and exposes working navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Industrial parts and automation spares");
  await expect(page.getByRole("link", { name: "Feeders" })).toHaveAttribute("href", "/asphalt?line=feeders");
  await expect(page.getByRole("link", { name: "Contact via WhatsApp" })).toHaveAttribute("href", /wa\.me\/441618187420/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const clippedHeadings = await page.locator("main h2").evaluateAll((headings) =>
    headings.filter((heading) => heading.scrollWidth > heading.clientWidth + 1).map((heading) => heading.textContent),
  );
  expect(clippedHeadings).toEqual([]);
});

test("mobile navigation uses separate named controls", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile navigation test");
  page.on("pageerror", (error) => console.error("Browser page error:", error.message));
  page.on("console", (message) => { if (message.type() === "error") console.error("Browser console error:", message.text()); });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open navigation" });
  await expect(menu).toBeVisible();
  await expect(menu).toBeEnabled({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: /^Cart/ })).toBeVisible();
  await menu.click();
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "All products", exact: true })).toBeVisible();
});

test("authentication controls and metadata are accessible", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle("Sign In | Spares Automation");
  await expect(page.getByRole("button", { name: "Show password" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute("href", "/forgot-password");
});

test("contact methods are actionable and consistent", async ({ page }) => {
  await page.goto("/contact-us");
  await expect(page.getByRole("link", { name: /Technical Sales/ })).toHaveAttribute("href", "tel:+441618187420");
  await expect(page.getByRole("link", { name: /Email Enquiries/ })).toHaveAttribute("href", "mailto:trade@spares-automation.co.uk");
});

test("all products keeps one search and a compact catalogue hero", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("searchbox")).toHaveCount(1);
  await expect(page.getByPlaceholder("Search within results...")).toHaveCount(0);

  const hero = page.getByRole("heading", { name: /all products catalogue/i }).locator("xpath=ancestor::section[1]");
  const box = await hero.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThanOrEqual(281);
});

test("information pages use completed compact content flows", async ({ page }) => {
  await page.goto("/about-us");
  await expect(page.getByRole("heading", { level: 1, name: "Industrial parts and automation support" })).toBeVisible();
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveCount(4);
  await expect(page.locator("main img")).toHaveCount(0);

  await page.goto("/contact-us");
  await expect(page.getByRole("heading", { level: 1, name: "Contact Spares Automation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Prepare email request" })).toBeVisible();
  await expect(page.locator("main img")).toHaveCount(0);
});

test("trade and tracking pages collect the required details", async ({ page }) => {
  await page.goto("/trade-account");
  await expect(page.getByRole("textbox", { name: "Registered company name" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Company registration number" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "VAT number" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Prepare application email" })).toBeVisible();

  await page.goto("/track-order");
  await expect(page.getByRole("textbox", { name: "Order number" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Prepare email request" })).toBeVisible();
  await expect(page.getByRole("link", { name: /View account orders/ })).toHaveAttribute("href", "/account");
});

test("crawler files are available", async ({ request }) => {
  expect((await request.get("/robots.txt")).ok()).toBeTruthy();
  expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
});

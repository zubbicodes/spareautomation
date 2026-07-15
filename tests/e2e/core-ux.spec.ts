import { expect, test } from "@playwright/test";

test("homepage remains within the viewport and exposes working navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Industrial parts and automation spares");
  await expect(page.getByRole("link", { name: "Feeders" })).toHaveAttribute("href", "/asphalt?line=feeders");
  await expect(page.getByRole("link", { name: /Control Panels & Software/i })).toHaveAttribute("href", "/control-panels-software");
  await expect(page.getByText("Browse sub-categories", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Sub-categories -/i)).toHaveCount(0);
  await expect(page.getByText("New Arrivals", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/attach it to an email or send it by WhatsApp/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /wa\.me\/441618187420/);
  const supportControls = await page.getByRole("button", { name: "Submit Request" }).or(page.getByRole("link", { name: "Email sales" })).or(page.getByRole("link", { name: "WhatsApp" })).evaluateAll((controls) => controls.map((control) => control.getBoundingClientRect().height));
  expect(supportControls.every((height) => height <= 46)).toBeTruthy();
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

test("registration form stays inside a 320px phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/register");
  const outsideControls = await page.locator("input, select, button").evaluateAll((controls) =>
    controls
      .filter((control) => {
        const rect = control.getBoundingClientRect();
        const style = getComputedStyle(control);
        return style.display !== "none" && (rect.left < -1 || rect.right > window.innerWidth + 1);
      })
      .map((control) => control.getAttribute("name") || control.getAttribute("aria-label") || control.textContent),
  );
  expect(outsideControls).toEqual([]);
});

test("touch tablets keep homepage category choices visible", async ({ browser, isMobile }) => {
  test.skip(isMobile, "Runs once with an explicit touch-tablet context");
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".hero-range-panel").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Feeders" })).toBeVisible();
  await context.close();
});

test("desktop hero hover fills the category panel with the range title", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop hover treatment");
  await page.goto("/");
  const firstRange = page.locator(".hero-range").first();
  await firstRange.hover();
  await expect(page.getByTestId("hero-hover-title-0")).toBeVisible();
  await expect(page.getByTestId("hero-hover-title-0")).toContainText(/Asphalt \/ Blacktop Spares/i);
});

test("all products keeps one search and a compact catalogue hero", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("searchbox")).toHaveCount(1);
  await expect(page.getByPlaceholder("Search within results...")).toHaveCount(0);

  const hero = page.getByRole("heading", { name: /all products catalogue/i }).locator("xpath=ancestor::section[1]");
  const box = await hero.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThanOrEqual(281);

  await expect(page.getByRole("button", { name: /Control Panels & Software/i })).toBeVisible();
  await expect(page.getByText("New Arrivals", { exact: true })).toHaveCount(0);
});

test("category labels and legacy route match the approved catalogue wording", async ({ page }) => {
  await page.goto("/asphalt");
  for (const label of ["Feeders", "Burner / Drying", "Bitumen", "Hot Stone / Silos", "Baghouse", "Mixing Tower"]) {
    await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/Heavy Plant|Vertical 01/i)).toHaveCount(0);
  await expect(page.getByText(/Specialist procurement of bituminous/i)).toHaveCount(0);

  await page.goto("/new-arrivals");
  await expect(page).toHaveURL(/\/control-panels-software$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("CONTROL PANELS & SOFTWARE");
});

test("resource navigation accurately describes the request service", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('header a[href="/resources"]', { hasText: "PDFs & Videos" })).toHaveAttribute("href", "/resources");
  await page.goto("/resources");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Request PDFs, manuals, and videos");
  await expect(page.getByText(/request service rather than a public download library/i)).toBeVisible();
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

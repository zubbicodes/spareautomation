import { expect, test } from "@playwright/test";

test("homepage remains within the viewport and exposes working navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Industrial parts and automation spares");
  await expect(page.getByRole("link", { name: "Feeders" })).toHaveAttribute("href", "/asphalt?line=feeders");
  await expect(page.getByRole("link", { name: /Control Panels & Software/i })).toHaveAttribute("href", "/control-panels-software");
  await expect(page.getByText("Browse sub-categories", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Sub-categories -/i)).toHaveCount(0);
  await expect(page.getByText("New Arrivals", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/attach it to an email or send it by WhatsApp/i)).toHaveCount(0);
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
  await expect(navigation.getByRole("link", { name: "All Products", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Home Automation and Controls", exact: true })).toHaveAttribute("href", "/home-controls");
  await expect(navigation.getByRole("link", { name: "Control Panels and Software", exact: true })).toHaveAttribute("href", "/control-panels-software");
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

test("account application links precede sign in in the top bar", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop top bar test");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const credit = page.getByRole("link", { name: "Open Credit Account", exact: true });
  const trade = page.getByRole("link", { name: "Open Trade Account", exact: true }).first();
  const signIn = page.getByRole("link", { name: "Sign in", exact: true });
  await expect(credit).toHaveAttribute("href", "/credit-account");
  await expect(trade).toHaveAttribute("href", "/trade-account");
  const order = await Promise.all([credit, trade, signIn].map((link) => link.evaluate((element) => element.getBoundingClientRect().left)));
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);
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

test("homepage part finder uses the approved heading hierarchy and concise copy", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "Need help finding a part?" });
  const instruction = page.getByText("Send a part number or product description.", { exact: true });
  await expect(heading).toBeVisible();
  await expect(instruction).toBeVisible();
  const sizes = await Promise.all([
    heading.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    instruction.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  ]);
  expect(sizes[0]).toBeGreaterThan(sizes[1]);
  await expect(page.getByText(/Use this form for text details/i)).toHaveCount(0);
});

test("supported payment marks appear in the footer", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.getByRole("heading", { name: "Payments we support" })).toBeVisible();
  for (const method of ["Visa", "Mastercard", "Maestro", "Visa Electron", "PayPal"]) {
    await expect(footer.getByRole("img", { name: method, exact: true })).toBeVisible();
  }
});

test("all products keeps one search and a compact catalogue hero", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("searchbox")).toHaveCount(1);
  await expect(page.getByPlaceholder("Search within results...")).toHaveCount(0);

  const hero = page.getByRole("heading", { name: /all products catalogue/i }).locator("xpath=ancestor::section[1]");
  const box = await hero.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThanOrEqual(181);

  await expect(page.getByRole("button", { name: /Control Panels & Software/i })).toBeVisible();
  await expect(page.getByText("New Arrivals", { exact: true })).toHaveCount(0);
});

test("every product exposes tabbed support content and useful empty states", async ({ page }) => {
  await page.goto("/products");
  const firstProduct = page.locator("article a").first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("PayPal accepted", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "PayPal", exact: true }).first()).toBeVisible();

  const videoTab = page.getByRole("tab", { name: "Video Guide" });
  const pdfTab = page.getByRole("tab", { name: "PDF Guide" });
  const descriptionTab = page.getByRole("tab", { name: "Description" });
  await expect(videoTab).toBeVisible();
  await expect(pdfTab).toBeVisible();
  await expect(descriptionTab).toBeVisible();
  await expect(videoTab).toHaveAttribute("aria-selected", "true");

  await pdfTab.click();
  await expect(pdfTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText(/PDF|Datasheet|Manual/i);

  await descriptionTab.click();
  await expect(descriptionTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).not.toBeEmpty();
});

test("customers can build a quote from a product", async ({ page }) => {
  await page.goto("/products");
  await page.locator("article a").first().click();
  await page.waitForLoadState("networkidle");

  const productTitle = (await page.getByRole("heading", { level: 1 }).textContent())?.trim();
  await page.getByRole("button", { name: "Build a quote" }).click();

  await expect(page).toHaveURL(/\/quote$/);
  await expect(page.getByRole("heading", { level: 1, name: "My Quote" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quote summary" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit quote" })).toBeVisible();
  if (productTitle) await expect(page.getByText(productTitle, { exact: true })).toBeVisible();
});

test("category labels and legacy route match the approved catalogue wording", async ({ page }) => {
  await page.goto("/asphalt");
  const hero = page.getByRole("heading", { name: /asphalt.*(?:spares|catalogue)/i }).locator("xpath=ancestor::section[1]");
  const box = await hero.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThanOrEqual(181);

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
  await expect(page.locator('header a[href="/resources"]', { hasText: "PDF and Videos" })).toHaveAttribute("href", "/resources");
  await page.goto("/resources");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("PDFs, manuals & videos");
  await expect(page.getByText(/arranged by category/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Resource library is being updated/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: /PDFs & Videos/i }).first()).toBeVisible();
  await expect(page.getByText("Product resources").first()).toBeVisible();
});

test("main navigation uses the approved labels and routes", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop navigation test");
  await page.setViewportSize({ width: 1900, height: 900 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  const items = [
    ["All Products", "/products"],
    ["Asphalt / Blacktop Spares", "/asphalt"],
    ["Readymix / Concrete Spares", "/concrete"],
    ["Packing Machinery Spares", "/packing"],
    ["Automation and Drives", "/automation"],
    ["Home Automation and Controls", "/home-controls"],
    ["Control Panels and Software", "/control-panels-software"],
    ["PDF and Videos", "/resources"],
    ["Contact", "/contact-us"],
  ] as const;

  for (const [label, href] of items) {
    await expect(navigation.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
  }

  const overflow = await navigation.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const itemRows = await navigation.getByRole("link").evaluateAll((links) =>
    new Set(links.map((link) => Math.round(link.getBoundingClientRect().top))).size,
  );
  expect(itemRows).toBe(1);
  const edgeGaps = await navigation.getByRole("link").evaluateAll((links) => {
    const first = links[0].getBoundingClientRect();
    const last = links[links.length - 1].getBoundingClientRect();
    return { left: first.left, right: window.innerWidth - last.right };
  });
  expect(edgeGaps.left).toBeLessThanOrEqual(40);
  expect(edgeGaps.right).toBeLessThanOrEqual(40);
  await expect(navigation.getByRole("link").first()).toHaveCSS("font-size", "10px");

  await page.setViewportSize({ width: 1280, height: 900 });
  const compactRows = await navigation.getByRole("link").evaluateAll((links) =>
    new Set(links.map((link) => Math.round(link.getBoundingClientRect().top))).size,
  );
  expect(compactRows).toBe(1);

  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(navigation).toBeHidden();
  const menu = page.getByRole("button", { name: "Open navigation" });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
});

test("information pages use completed compact content flows", async ({ page }) => {
  await page.goto("/about-us");
  await expect(page.getByRole("heading", { level: 1, name: "Industrial parts and automation support" })).toBeVisible();
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveCount(4);
  await expect(page.locator("main img")).toHaveCount(0);

  await page.goto("/contact-us");
  await expect(page.getByRole("heading", { level: 1, name: "Contact Spares Automation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send request" })).toBeVisible();
  await expect(page.locator("main img")).toHaveCount(0);
});

test("trade and tracking pages collect the required details", async ({ page }) => {
  await page.goto("/trade-account");
  await expect(page.getByRole("heading", { name: "Apply for a trade account" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "What you will need" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Review and approval" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Registered company name" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Company registration number" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "VAT number" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit application" })).toBeVisible();

  await page.goto("/track-order");
  await expect(page.getByRole("textbox", { name: "Order number" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send request" })).toBeVisible();
  await expect(page.getByRole("link", { name: /View account orders/ })).toHaveAttribute("href", "/account");
});

test("crawler files are available", async ({ request }) => {
  expect((await request.get("/robots.txt")).ok()).toBeTruthy();
  expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
});
